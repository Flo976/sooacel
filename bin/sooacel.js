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

Usage: sooacel [commande] [options]

Commandes:
  (aucune)    Wizard interactif complet
  ls          Lister les variables d'environnement
  set         Ajouter une variable
  edit        Modifier une variable
  rm          Supprimer une variable
  pull        Tirer les VE en local (.env.local)

Options (mode non-interactif):
  --account <nom>       Compte Vercel (ex: dexyu, eanet)
  --project <nom>       Nom du projet
  --key <nom>           Nom de la variable
  --value <valeur>      Valeur de la variable
  --type <type>         Type: encrypted (defaut), plain, sensitive
  --target <cibles>     Cibles separees par des virgules: production,preview,development
  --environment <env>   Environnement pour pull: development, preview, production
  --comment <texte>     Commentaire optionnel
  --yes, -y             Skip les confirmations
  --show-values         Afficher les valeurs en clair (ls uniquement)

Options generales:
  --help, -h            Afficher cette aide
  --version, -v         Afficher la version

Exemples (non-interactif):
  sooacel ls --account dexyu --project app
  sooacel set --account dexyu --project app --key DATABASE_URL --value "postgres://..." --target production,preview
  sooacel edit --account dexyu --project app --key DATABASE_URL --value "new-value"
  sooacel rm --account dexyu --project app --key DATABASE_URL --yes
  sooacel pull --account dexyu --project app --environment development
`.trimStart();

const KNOWN_ACTIONS = ["ls", "set", "edit", "rm", "pull"];

function isExitPromptError(err) {
  return err && (err.name === "ExitPromptError" || err.constructor?.name === "ExitPromptError");
}

// ── argument parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { command: null, flags: {} };

  let i = 0;
  // First positional arg = command
  if (args[0] && !args[0].startsWith("-")) {
    result.command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg === "--yes" || arg === "-y") {
      result.flags.yes = true;
      i++;
    } else if (arg === "--show-values") {
      result.flags.showValues = true;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      result.flags.help = true;
      i++;
    } else if (arg === "--version" || arg === "-v") {
      result.flags.version = true;
      i++;
    } else if (arg.startsWith("--") && i + 1 < args.length) {
      const key = arg.slice(2);
      result.flags[key] = args[i + 1];
      i += 2;
    } else {
      result.flags._unknown = arg;
      i++;
    }
  }

  return result;
}

// ── resolve account & project (interactive or from flags) ────────────────────

async function resolveAccount(accounts, flags) {
  if (flags.account) {
    const match = accounts.find((a) => a.key === flags.account.toLowerCase());
    if (!match) {
      throw new Error(`Compte inconnu : ${flags.account}. Comptes disponibles : ${accounts.map(a => a.key).join(", ")}`);
    }
    return match;
  }
  return selectAccount(accounts);
}

async function resolveProject(token, teamId, flags) {
  const projects = await listProjects(token, teamId);
  if (flags.project) {
    const match = projects.find((p) => p.name === flags.project);
    if (!match) {
      throw new Error(`Projet inconnu : ${flags.project}`);
    }
    return match;
  }
  return selectProject(projects);
}

async function resolveEnvVar(token, projectName, teamId, flags) {
  const vars = await listEnvVars(token, projectName, teamId);
  if (flags.key) {
    const match = vars.find((v) => v.key === flags.key);
    if (!match) {
      throw new Error(`Variable introuvable : ${flags.key}`);
    }
    return { vars, selected: match };
  }
  const selected = await selectEnvVar(vars);
  return { vars, selected };
}

// ── action handlers ──────────────────────────────────────────────────────────

async function actionLs(token, teamId, accountName, flags) {
  const project = await resolveProject(token, teamId, flags);
  const vars = await listEnvVars(token, project.name, teamId);
  showEnvVarList(vars, project.name, accountName, { showValues: !!flags.showValues });
}

async function actionSet(token, teamId, flags) {
  const project = await resolveProject(token, teamId, flags);

  let newVar;
  if (flags.key && flags.value) {
    // Non-interactive mode
    newVar = {
      key: flags.key,
      value: flags.value,
      type: flags.type || "encrypted",
      target: flags.target ? flags.target.split(",").map(s => s.trim()) : ["production", "preview"],
      comment: flags.comment || undefined,
    };
  } else {
    newVar = await inputNewEnvVar();
  }

  const existing = await listEnvVars(token, project.name, teamId);
  const duplicate = existing.find((v) => v.key === newVar.key);

  if (duplicate) {
    showWarning(`La variable ${newVar.key} existe deja.`);
    if (!flags.yes) {
      const ok = await confirm({ message: "Ecraser la valeur existante ?", default: false });
      if (!ok) {
        showWarning("Operation annulee.");
        return;
      }
    }
  }

  await createEnvVar(token, project.name, newVar, teamId);
  showSuccess(`Variable ${newVar.key} creee sur ${project.name}.`);
}

async function actionEdit(token, teamId, flags) {
  const project = await resolveProject(token, teamId, flags);
  const { selected: envVar } = await resolveEnvVar(token, project.name, teamId, flags);

  let updates;
  if (flags.value) {
    updates = {
      value: flags.value,
      comment: flags.comment || undefined,
    };
  } else {
    updates = await inputEditEnvVar(envVar);
  }

  await editEnvVar(token, project.name, envVar.id, updates, teamId);
  showSuccess(`Variable ${envVar.key} modifiee.`);
}

async function actionRm(token, teamId, flags) {
  const project = await resolveProject(token, teamId, flags);
  const { selected: envVar } = await resolveEnvVar(token, project.name, teamId, flags);

  if (!flags.yes) {
    const yes = await confirmDelete(envVar.key, project.name);
    if (!yes) {
      showWarning("Operation annulee.");
      return;
    }
  }

  await deleteEnvVar(token, project.name, envVar.id, teamId);
  showSuccess(`Variable ${envVar.key} supprimee.`);
}

async function actionPull(token, teamId, flags) {
  const project = await resolveProject(token, teamId, flags);

  let selectedEnv;
  if (flags.environment) {
    const valid = ["development", "preview", "production"];
    if (!valid.includes(flags.environment)) {
      throw new Error(`Environnement invalide : ${flags.environment}. Valeurs possibles : ${valid.join(", ")}`);
    }
    selectedEnv = flags.environment;
  } else {
    selectedEnv = await selectEnvironment();
  }

  const allVars = await listEnvVars(token, project.name, teamId);
  const vars = allVars.filter(
    (v) => Array.isArray(v.target) && v.target.includes(selectedEnv)
  );

  const outputPath = join(process.cwd(), ".env.local");

  if (existsSync(outputPath) && !flags.yes) {
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

// ── dispatch ─────────────────────────────────────────────────────────────────

async function dispatch(action, account, flags) {
  const { token, teamId, name: accountName } = account;
  switch (action) {
    case "ls":
      await actionLs(token, teamId, accountName, flags);
      break;
    case "set":
      await actionSet(token, teamId, flags);
      break;
    case "edit":
      await actionEdit(token, teamId, flags);
      break;
    case "rm":
      await actionRm(token, teamId, flags);
      break;
    case "pull":
      await actionPull(token, teamId, flags);
      break;
    default:
      showError(`Action inconnue : ${action}`);
      process.exit(1);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { command, flags } = parseArgs(process.argv);

  if (flags.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  if (flags.version) {
    console.log(pkg.version);
    process.exit(0);
  }

  if (command && !KNOWN_ACTIONS.includes(command)) {
    showError(`Commande inconnue : ${command}`);
    process.stdout.write("\n" + USAGE);
    process.exit(1);
  }

  const accounts = loadAccounts();

  // Show header only in interactive mode
  const isNonInteractive = flags.account && command;
  if (!isNonInteractive) {
    showHeader();
  }

  const account = await resolveAccount(accounts, flags);

  let action;
  if (command) {
    action = command;
  } else {
    action = await selectAction();
    if (action === "quit") {
      process.exit(0);
    }
  }

  await dispatch(action, account, flags);
}

main().catch((err) => {
  if (isExitPromptError(err)) {
    process.exit(0);
  }
  showError(err.message ?? String(err));
  process.exit(1);
});
