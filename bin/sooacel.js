#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { loadAccounts } from "../src/config.js";
import { listProjects, listEnvVars, createEnvVar, editEnvVar, deleteEnvVar } from "../src/api.js";
import { confirm } from "@inquirer/prompts";
import {
  selectAccount,
  selectProject,
  selectAction,
  selectEnvVar,
  inputNewEnvVar,
  inputEditEnvVar,
  confirmDelete,
  selectEnvironment,
  confirmOverwrite,
} from "../src/prompts.js";
import { showHeader, showSuccess, showError, showWarning, showEnvVarList } from "../src/display.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

const USAGE = `
Sooacel — Vercel Env Manager

Usage: sooacel [commande]

Commandes:
  (aucune)    Wizard interactif complet
  ls          Lister les variables d'environnement
  set         Ajouter une variable
  edit        Modifier une variable
  rm          Supprimer une variable
  pull        Tirer les VE en local (.env.local)

Options:
  --help, -h      Afficher cette aide
  --version, -v   Afficher la version
`.trimStart();

function isExitPromptError(err) {
  // @inquirer/prompts throws an error with name "ExitPromptError" on Ctrl+C
  return err && (err.name === "ExitPromptError" || err.constructor?.name === "ExitPromptError");
}

// ── action handlers ───────────────────────────────────────────────────────────

async function actionLs(token, teamId, accountName) {
  const projects = await listProjects(token, teamId);
  const project = await selectProject(projects);
  const vars = await listEnvVars(token, project.name, teamId);
  showEnvVarList(vars, project.name, accountName);
}

async function actionSet(token, teamId) {
  const projects = await listProjects(token, teamId);
  const project = await selectProject(projects);
  const newVar = await inputNewEnvVar();

  const existing = await listEnvVars(token, project.name, teamId);
  const duplicate = existing.find((v) => v.key === newVar.key);

  if (duplicate) {
    showWarning(`La variable ${newVar.key} existe deja.`);
    const ok = await confirm({ message: "Ecraser la valeur existante ?", default: false });
    if (!ok) {
      showWarning("Operation annulee.");
      return;
    }
  }

  await createEnvVar(token, project.name, newVar, teamId);
  showSuccess(`Variable ${newVar.key} creee sur ${project.name}.`);
}

async function actionEdit(token, teamId) {
  const projects = await listProjects(token, teamId);
  const project = await selectProject(projects);
  const vars = await listEnvVars(token, project.name, teamId);
  const envVar = await selectEnvVar(vars);
  const updates = await inputEditEnvVar(envVar);
  await editEnvVar(token, project.name, envVar.id, updates, teamId);
  showSuccess(`Variable ${envVar.key} modifiee.`);
}

async function actionRm(token, teamId) {
  const projects = await listProjects(token, teamId);
  const project = await selectProject(projects);
  const vars = await listEnvVars(token, project.name, teamId);
  const envVar = await selectEnvVar(vars);
  const yes = await confirmDelete(envVar.key, project.name);
  if (!yes) {
    showWarning("Operation annulee.");
    return;
  }
  await deleteEnvVar(token, project.name, envVar.id, teamId);
  showSuccess(`Variable ${envVar.key} supprimee.`);
}

async function actionPull(token, teamId) {
  const projects = await listProjects(token, teamId);
  const project = await selectProject(projects);
  const selectedEnv = await selectEnvironment();
  const allVars = await listEnvVars(token, project.name, teamId);

  const vars = allVars.filter(
    (v) => Array.isArray(v.target) && v.target.includes(selectedEnv)
  );

  const outputPath = join(process.cwd(), ".env.local");

  if (existsSync(outputPath)) {
    const ok = await confirmOverwrite(outputPath);
    if (!ok) {
      showWarning("Operation annulee.");
      return;
    }
  }

  const lines = vars.map((v) => `${v.key}=${v.value ?? ""}`).join("\n") + "\n";
  writeFileSync(outputPath, lines, "utf8");
  showSuccess(`${vars.length} variable(s) ecrite(s) dans .env.local`);
}

// ── dispatch ──────────────────────────────────────────────────────────────────

async function dispatch(action, account) {
  const { token, teamId, name: accountName } = account;
  switch (action) {
    case "ls":
      await actionLs(token, teamId, accountName);
      break;
    case "set":
      await actionSet(token, teamId);
      break;
    case "edit":
      await actionEdit(token, teamId);
      break;
    case "rm":
      await actionRm(token, teamId);
      break;
    case "pull":
      await actionPull(token, teamId);
      break;
    default:
      showError(`Action inconnue : ${action}`);
      process.exit(1);
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2];

  // --help / -h
  if (arg === "--help" || arg === "-h") {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  // --version / -v
  if (arg === "--version" || arg === "-v") {
    console.log(pkg.version);
    process.exit(0);
  }

  const KNOWN_ACTIONS = ["ls", "set", "edit", "rm", "pull"];

  // Unknown flag or command
  if (arg !== undefined && !KNOWN_ACTIONS.includes(arg)) {
    showError(`Commande inconnue : ${arg}`);
    process.stdout.write("\n" + USAGE);
    process.exit(1);
  }

  // Load accounts (may throw if ~/.sooacel/.env is missing)
  const accounts = loadAccounts();

  showHeader();

  const account = await selectAccount(accounts);

  let action;
  if (arg && KNOWN_ACTIONS.includes(arg)) {
    // Subcommand provided on CLI
    action = arg;
  } else {
    // Full wizard: ask for action
    action = await selectAction();
    if (action === "quit") {
      process.exit(0);
    }
  }

  await dispatch(action, account);
}

main().catch((err) => {
  if (isExitPromptError(err)) {
    process.exit(0);
  }
  showError(err.message ?? String(err));
  process.exit(1);
});
