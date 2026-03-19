import { select, input, password, checkbox, confirm, search } from "@inquirer/prompts";
import { maskValue } from "./display.js";

// Select a Vercel account from list
export async function selectAccount(accounts) {
  return select({
    message: "Compte Vercel :",
    choices: accounts.map(a => ({ name: a.name, value: a })),
  });
}

// Select a project with search/filter
export async function selectProject(projects) {
  return search({
    message: "Projet :",
    source: async (term) => {
      const filtered = term
        ? projects.filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
        : projects;
      return filtered.map(p => ({
        name: p.framework ? `${p.name} (${p.framework})` : p.name,
        value: p,
      }));
    },
  });
}

// Select main action
export async function selectAction() {
  return select({
    message: "Action :",
    choices: [
      { name: "Lister les variables", value: "ls" },
      { name: "Ajouter une variable", value: "set" },
      { name: "Modifier une variable", value: "edit" },
      { name: "Supprimer une variable", value: "rm" },
      { name: "Tirer les VE en local (.env.local)", value: "pull" },
      { name: "Quitter", value: "quit" },
    ],
  });
}

// Select an existing env var (for edit/rm)
export async function selectEnvVar(envVars) {
  return select({
    message: "Variable :",
    choices: envVars.map(v => ({
      name: `${v.key} (${v.target.join(", ")}) [${v.type}]`,
      value: v,
    })),
  });
}

// Input a new env var (key, value, type, targets, comment)
export async function inputNewEnvVar() {
  const key = await input({
    message: "Nom de la variable :",
    validate: (v) => v.trim().length > 0 || "Le nom ne peut pas etre vide",
  });

  const value = await password({
    message: "Valeur :",
    mask: "*",
  });

  const type = await select({
    message: "Type :",
    choices: [
      { name: "encrypted (defaut recommande)", value: "encrypted" },
      { name: "plain", value: "plain" },
      { name: "sensitive", value: "sensitive" },
    ],
  });

  const target = await checkbox({
    message: "Environnements :",
    choices: [
      { name: "production", value: "production", checked: true },
      { name: "preview", value: "preview", checked: true },
      { name: "development", value: "development" },
    ],
    validate: (v) => v.length > 0 || "Selectionnez au moins un environnement",
  });

  const comment = await input({
    message: "Commentaire (optionnel) :",
  });

  return { key: key.trim(), value, type, target, comment: comment.trim() || undefined };
}

// Input to edit an existing env var
export async function inputEditEnvVar(currentVar) {
  console.log(`  Valeur actuelle : ${maskValue(currentVar.value)}`);

  const value = await password({
    message: "Nouvelle valeur :",
    mask: "*",
  });

  const comment = await input({
    message: "Commentaire (optionnel) :",
  });

  return { value, comment: comment.trim() || undefined };
}

// Confirm deletion
export async function confirmDelete(varName, projectName) {
  return confirm({
    message: `Supprimer ${varName} sur ${projectName} ?`,
    default: false,
  });
}

// Select an environment (for pull)
export async function selectEnvironment() {
  return select({
    message: "Environnement :",
    choices: [
      { name: "development", value: "development" },
      { name: "preview", value: "preview" },
      { name: "production", value: "production" },
    ],
  });
}

// Confirm overwrite of .env.local
export async function confirmOverwrite(filePath) {
  return confirm({
    message: `${filePath} existe deja. Ecraser ?`,
    default: false,
  });
}
