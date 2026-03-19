# Sooacel CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CLI interactive Node.js pour gerer les variables d'environnement Vercel de plusieurs comptes clients Sooatek.

**Architecture:** Point d'entree `bin/sooacel.js` qui parse les sous-commandes, 4 modules (`config.js`, `api.js`, `prompts.js`, `display.js`) avec responsabilites separees. Tokens charges depuis `~/.sooacel/.env`. Appels API via `@vercel/sdk`.

**Tech Stack:** Node.js >= 18 (ESM), `@vercel/sdk` ^1, `@inquirer/prompts` ^7, `chalk` ^5

**Spec:** `docs/superpowers/specs/2026-03-19-sooacel-cli-design.md`

---

## File Structure

```
sooacel/
├── bin/
│   └── sooacel.js           ← Point d'entree CLI, shebang, parse argv
├── src/
│   ├── config.js            ← Charge ~/.sooacel/.env, retourne les comptes
│   ├── api.js               ← Wrapper @vercel/sdk (CRUD env vars, list projects)
│   ├── prompts.js           ← Menus interactifs (@inquirer/prompts)
│   └── display.js           ← Formatage output (chalk, tableaux)
├── setup/
│   ├── install.sh           ← (reecrit) installe npm + alias sooacel
│   ├── install.ps1          ← (reecrit) installe npm + fonction sooacel
│   └── .env.template        ← (mis a jour) 3 comptes au lieu de 4
├── package.json             ← bin, dependencies, engines
└── guides/
    ├── ADMIN-SETUP.md       ← (mis a jour)
    └── DEV-USAGE.md         ← (mis a jour)
```

---

## Vercel SDK API Reference

Methodes confirmees sur `@vercel/sdk` v1.19:

```js
import { Vercel } from "@vercel/sdk";
const vercel = new Vercel({ bearerToken: token });

// Projets
vercel.projects.getProjects({ teamId, limit, search })

// Env vars
vercel.projects.filterProjectEnvs({ idOrName, teamId, decrypt })
vercel.projects.createProjectEnv({ idOrName, teamId, upsert, requestBody: { key, value, type, target, comment } })
vercel.projects.editProjectEnv({ idOrName, id, teamId, requestBody: { value, type, target, comment } })
vercel.projects.removeProjectEnv({ idOrName, id, teamId })
```

---

### Task 1: package.json + npm install

**Files:**
- Create: `package.json`

- [ ] **Step 1: Creer package.json**

```json
{
  "name": "sooacel",
  "version": "1.0.0",
  "description": "CLI interne Sooatek pour gerer les variables d'environnement Vercel",
  "type": "module",
  "bin": {
    "sooacel": "./bin/sooacel.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@vercel/sdk": "^1",
    "@inquirer/prompts": "^7",
    "chalk": "^5"
  }
}
```

- [ ] **Step 2: npm install**

```bash
npm install
```

Verifie que `node_modules/` est cree et les 3 deps installees.

- [ ] **Step 3: Ajouter node_modules au .gitignore**

Ajouter `node_modules/` au `.gitignore` existant.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: init package.json with @vercel/sdk, inquirer, chalk"
```

---

### Task 2: src/config.js

**Files:**
- Create: `src/config.js`

- [ ] **Step 1: Creer src/config.js**

Le module doit :
1. Lire `~/.sooacel/.env` (path: `join(homedir(), '.sooacel', '.env')`)
2. Parser chaque ligne avec regex `^\s*([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$` (strip guillemets)
3. Mapper les variables aux comptes avec un mapping hardcode :

```js
const ACCOUNTS = [
  { name: "Dexyu (team)", key: "dexyu", tokenVar: "VERCEL_TOKEN_DEXYU", teamIdVar: "VERCEL_TEAM_DEXYU" },
  { name: "Eanet", key: "eanet", tokenVar: "VERCEL_TOKEN_EANET", teamIdVar: null },
  { name: "Sooatek", key: "sooatek", tokenVar: "VERCEL_TOKEN_SOOATEK", teamIdVar: null },
];
```

4. Retourner un tableau de comptes actifs (ceux dont le token est non-vide)
5. Si le fichier n'existe pas → throw avec message clair
6. Sur Linux/macOS, verifier les permissions du fichier (stat, mode & 0o077 !== 0 → warning stderr)

Export : `loadAccounts()` → `[{ name, key, token, teamId }]`

- [ ] **Step 2: Tester manuellement**

```bash
node -e "import('./src/config.js').then(m => m.loadAccounts()).then(console.log).catch(console.error)"
```

Attendu : affiche les 3 comptes charges depuis `~/.sooacel/.env`.

- [ ] **Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat: add config module to load Vercel accounts from .env"
```

---

### Task 3: src/api.js

**Files:**
- Create: `src/api.js`

- [ ] **Step 1: Creer src/api.js**

Wrapper autour de `@vercel/sdk`. Chaque fonction cree une instance `Vercel` avec le token passe en parametre.

Fonctions a implementer :

```js
import { Vercel } from "@vercel/sdk";

// Cree un client SDK
function createClient(token) {
  return new Vercel({ bearerToken: token });
}

// Liste les projets (gere la pagination)
export async function listProjects(token, teamId) {
  // Appelle vercel.projects.getProjects({ teamId, limit: "100" })
  // Suit pagination.next si present
  // Retourne [{ id, name, framework }]
}

// Liste les env vars d'un projet
export async function listEnvVars(token, projectId, teamId) {
  // Appelle vercel.projects.filterProjectEnvs({ idOrName: projectId, teamId, decrypt: "true" })
  // Gere la pagination
  // Retourne [{ id, key, value, type, target, comment }]
}

// Cree une env var (avec check d'existence + upsert)
export async function createEnvVar(token, projectId, { key, value, type, target, comment }, teamId) {
  // Appelle vercel.projects.createProjectEnv({
  //   idOrName: projectId, teamId, upsert: "true",
  //   requestBody: { key, value, type, target, comment }
  // })
}

// Modifie une env var (PATCH)
export async function editEnvVar(token, projectId, envId, updates, teamId) {
  // Appelle vercel.projects.editProjectEnv({
  //   idOrName: projectId, id: envId, teamId,
  //   requestBody: updates
  // })
}

// Supprime une env var
export async function deleteEnvVar(token, projectId, envId, teamId) {
  // Appelle vercel.projects.removeProjectEnv({
  //   idOrName: projectId, id: envId, teamId
  // })
}
```

Gestion d'erreur globale : wrapper try/catch autour de chaque appel SDK.
Detecter les erreurs par statusCode ou message :
- 401 → "Token invalide ou expire. Contactez l'admin."
- 403 → "Pas de permission sur ce projet/environnement."
- 404 → "Projet introuvable."
- 429 → "Rate limit Vercel atteint. Reessayez dans quelques minutes."
- Erreur reseau (ENOTFOUND, ETIMEDOUT, etc.) → "Impossible de joindre l'API Vercel. Verifiez votre connexion internet."

Toutes les erreurs sont relancees sous forme d'`Error` avec un message user-friendly en francais.

- [ ] **Step 2: Tester manuellement avec le token Dexyu**

```bash
node -e "
import { listProjects } from './src/api.js';
import { loadAccounts } from './src/config.js';
const accounts = await loadAccounts();
const dexyu = accounts.find(a => a.key === 'dexyu');
const projects = await listProjects(dexyu.token, dexyu.teamId);
console.log(projects.map(p => p.name));
"
```

Attendu : liste des noms de projets du compte Dexyu.

- [ ] **Step 3: Commit**

```bash
git add src/api.js
git commit -m "feat: add API module wrapping @vercel/sdk for env var CRUD"
```

---

### Task 4: src/display.js

**Files:**
- Create: `src/display.js`

- [ ] **Step 1: Creer src/display.js**

```js
import chalk from "chalk";

export function showSuccess(message) {
  console.log(chalk.green(`✅ ${message}`));
}

export function showError(message) {
  console.error(chalk.red(`❌ ${message}`));
}

export function showWarning(message) {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

export function showEnvVarList(vars, projectName, accountName) {
  // Affiche un header : "Variables d'environnement — {projectName} ({accountName})"
  // Puis un tableau aligne avec colonnes : Nom, Type, Environnements
  // Utilise chalk.bold pour les headers
  // Termine par "{n} variables"
  // Si aucune variable : affiche "Aucune variable d'environnement."
}

export function maskValue(value) {
  // Affiche les 4 premiers caracteres + "****"
  // Si value < 4 chars → "****"
  if (!value || value.length < 4) return "****";
  return value.substring(0, 4) + "****";
}

export function showHeader() {
  console.log("");
  console.log(chalk.bold("  Sooacel — Vercel Env Manager"));
  console.log("");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/display.js
git commit -m "feat: add display module for formatted CLI output"
```

---

### Task 5: src/prompts.js

**Files:**
- Create: `src/prompts.js`

- [ ] **Step 1: Creer src/prompts.js**

Utilise `@inquirer/prompts` (v7+ API: fonctions standalone, pas de classe Inquirer).

```js
import { select, input, password, checkbox, confirm, search } from "@inquirer/prompts";
```

Fonctions a implementer :

```js
// Choix du compte Vercel
export async function selectAccount(accounts) {
  // select() avec choices: accounts.map(a => ({ name: a.name, value: a }))
}

// Choix du projet (avec recherche)
export async function selectProject(projects) {
  // search() avec source: filtre par nom
  // Affiche "name (framework)" pour chaque projet
}

// Choix de l'action principale
export async function selectAction() {
  // select() avec choices:
  // - { name: "Lister les variables", value: "ls" }
  // - { name: "Ajouter une variable", value: "set" }
  // - { name: "Modifier une variable", value: "edit" }
  // - { name: "Supprimer une variable", value: "rm" }
  // - { name: "Tirer les VE en local (.env.local)", value: "pull" }
  // - { name: "Quitter", value: "quit" }
}

// Choix d'une VE existante (pour edit/rm)
export async function selectEnvVar(envVars) {
  // select() avec choices: envVars.map(v => ({
  //   name: `${v.key} (${v.target.join(", ")}) [${v.type}]`,
  //   value: v
  // }))
}

// Saisie d'une nouvelle VE
export async function inputNewEnvVar() {
  // 1. input() pour le nom (key) — validation: non vide, UPPER_SNAKE_CASE
  // 2. password() pour la valeur (masquee)
  // 3. select() pour le type — choices: encrypted (defaut), plain, sensitive
  // 4. checkbox() pour les targets — choices: production, preview, development
  //    validation: au moins un selectionne
  // 5. input() pour le commentaire (optionnel)
  // Retourne { key, value, type, target, comment }
}

// Saisie pour modifier une VE
export async function inputEditEnvVar(currentVar) {
  // Affiche la valeur masquee actuelle (maskValue)
  // 1. password() pour la nouvelle valeur
  // 2. input() pour le commentaire (optionnel)
  // Retourne { value, comment }
}

// Confirmation de suppression
export async function confirmDelete(varName, projectName) {
  // confirm() avec message: "Supprimer {varName} sur {projectName} ?"
  // default: false
}

// Choix d'un environnement (pour pull)
export async function selectEnvironment() {
  // select() avec choices: development, preview, production
}

// Confirmation d'ecrasement .env.local
export async function confirmOverwrite(filePath) {
  // confirm() avec message: "{filePath} existe deja. Ecraser ?"
  // default: false
}
```

- [ ] **Step 2: Commit**

```bash
git add src/prompts.js
git commit -m "feat: add prompts module with interactive menus"
```

---

### Task 6: bin/sooacel.js — Point d'entree

**Files:**
- Create: `bin/sooacel.js`

- [ ] **Step 1: Creer bin/sooacel.js**

```js
#!/usr/bin/env node
```

Le fichier orchestre tout le flow :

1. Parse `process.argv[2]` :
   - `--help` / `-h` → affiche l'usage et sort
   - `--version` / `-v` → affiche la version depuis package.json et sort
   - `ls`, `set`, `edit`, `rm`, `pull` → action predefinie
   - Autre chose → erreur + usage
   - Rien → wizard complet

2. Charge les comptes via `loadAccounts()`

3. Si wizard complet : `selectAccount()` → `selectAction()` → dispatch

4. Pour chaque action, le flow est :

**ls :**
```
selectAccount → listProjects → selectProject → listEnvVars → showEnvVarList
```

**set :**
```
selectAccount → listProjects → selectProject → inputNewEnvVar
→ listEnvVars (check si cle existe)
→ si existe: confirm upsert
→ createEnvVar → showSuccess
```

**edit :**
```
selectAccount → listProjects → selectProject → listEnvVars → selectEnvVar
→ inputEditEnvVar → editEnvVar → showSuccess
```

**rm :**
```
selectAccount → listProjects → selectProject → listEnvVars → selectEnvVar
→ confirmDelete → deleteEnvVar → showSuccess
```

**pull :**
```
selectAccount → listProjects → selectProject → selectEnvironment
→ listEnvVars (filtre par env)
→ check si .env.local existe → confirmOverwrite si oui
→ ecrit le fichier → showSuccess
```

5. Gestion globale des erreurs :
   - Catch au top level → `showError(err.message)`
   - Process exit code 1 sur erreur
   - Ctrl+C (SIGINT) → sort proprement, exit code 0

- [ ] **Step 2: Rendre executable**

```bash
chmod +x bin/sooacel.js
```

- [ ] **Step 3: Tester le wizard complet**

```bash
node bin/sooacel.js
```

Verifier le flow complet : compte → projet → action → execution.

- [ ] **Step 4: Tester les sous-commandes**

```bash
node bin/sooacel.js ls
node bin/sooacel.js --help
node bin/sooacel.js --version
node bin/sooacel.js invalid
```

- [ ] **Step 5: Commit**

```bash
git add bin/sooacel.js
git commit -m "feat: add CLI entry point with wizard and subcommands"
```

---

### Task 7: Reecrire setup/install.sh

**Files:**
- Modify: `setup/install.sh`

- [ ] **Step 1: Reecrire install.sh**

Le nouveau script doit :
1. Verifier Node.js >= 18 (parser la sortie de `node --version` et comparer)
2. Creer `~/.sooacel/` (chmod 700) + copier `.env.template` si absent (chmod 600)
3. Executer `npm install` dans le repertoire du repo (resolu via `$SCRIPT_DIR/..`)
4. Detecter le shell (bash/zsh)
5. Ajouter un alias au rc (idempotent, marqueurs `# --- Sooacel` / `# --- Fin Sooacel`) :
   ```bash
   alias sooacel="/chemin/absolu/vers/repo/bin/sooacel.js"
   ```
6. Afficher un resume

Les anciennes fonctions `ve-*` et le `source ~/.sooacel/.env` ne sont plus injectes dans le rc — c'est le CLI qui charge le `.env` lui-meme.

- [ ] **Step 2: Commit**

```bash
git add setup/install.sh
git commit -m "feat: rewrite install.sh for sooacel CLI (replaces ve-* aliases)"
```

---

### Task 8: Reecrire setup/install.ps1

**Files:**
- Modify: `setup/install.ps1`

- [ ] **Step 1: Reecrire install.ps1**

Meme logique que install.sh mais en PowerShell :
1. Verifier Node.js >= 18
2. Creer `~/.sooacel/` + copier `.env.template` si absent
3. `npm install` dans le repo
4. Ajouter une fonction au `$PROFILE` (idempotent, marqueurs) :
   ```powershell
   function sooacel { node "/chemin/absolu/vers/repo/bin/sooacel.js" @args }
   ```
5. Afficher un resume

- [ ] **Step 2: Commit**

```bash
git add setup/install.ps1
git commit -m "feat: rewrite install.ps1 for sooacel CLI (replaces ve-* functions)"
```

---

### Task 9: Mettre a jour setup/.env.template

**Files:**
- Modify: `setup/.env.template`

- [ ] **Step 1: Mettre a jour le template**

Supprimer `VERCEL_TOKEN_THEO` (plus necessaire, Sooatek gere Theo).
Le template final :

```env
# ============================================
# Sooacel — Tokens Vercel
# ============================================
# Ce fichier est depose par un admin sur chaque poste dev.
# NE JAMAIS COMMITER CE FICHIER REMPLI.
#
# Pour chaque compte client, remplir le token genere sur :
# https://vercel.com/account/tokens

# --- Comptes Vercel ---
VERCEL_TOKEN_DEXYU=
VERCEL_TOKEN_EANET=
VERCEL_TOKEN_SOOATEK=

# --- Team IDs (comptes en mode team uniquement) ---
VERCEL_TEAM_DEXYU=
```

- [ ] **Step 2: Commit**

```bash
git add setup/.env.template
git commit -m "fix: remove VERCEL_TOKEN_THEO from .env.template"
```

---

### Task 10: Mettre a jour les guides

**Files:**
- Modify: `guides/ADMIN-SETUP.md`
- Modify: `guides/DEV-USAGE.md`

- [ ] **Step 1: Mettre a jour ADMIN-SETUP.md**

Modifications :
- Supprimer toute reference a Theo (4 comptes → 3 comptes)
- Remplacer les references aux aliases `ve-*` par `sooacel`
- Section installation : meme commande (`bash setup/install.sh`) mais le script installe maintenant le CLI au lieu des aliases
- Ajouter une note : "Le CLI `sooacel` remplace les aliases `ve-*`"

- [ ] **Step 2: Mettre a jour DEV-USAGE.md**

Reecriture complete pour documenter le CLI interactif :
- Supprimer toutes les commandes `ve-*`
- Documenter le wizard : `sooacel` lance le mode interactif
- Documenter les sous-commandes : `sooacel ls`, `sooacel set`, `sooacel edit`, `sooacel rm`, `sooacel pull`
- Meme structure de troubleshooting
- Ajouter `sooacel --help` et `sooacel --version`

- [ ] **Step 3: Commit**

```bash
git add guides/ADMIN-SETUP.md guides/DEV-USAGE.md
git commit -m "docs: update guides for sooacel CLI (replaces ve-* aliases)"
```

---

### Task 11: Mettre a jour SPECS-VERCEL-ENV-MANAGER.md

**Files:**
- Modify: `SPECS-VERCEL-ENV-MANAGER.md`

- [ ] **Step 1: Mettre a jour les specs**

Modifications par rapport a la version actuelle (qui decrit les aliases) :
- Section "Decision" : ajouter le 2eme pivot (aliases → CLI maison)
- Section "Solution" : remplacer par la description du CLI interactif
- Section "Architecture" : mettre le schema du CLI (bin/sooacel.js → src/* → @vercel/sdk)
- Section "Livrables" : mettre a jour le tableau avec les nouveaux fichiers
- Conserver les sections API REST, types de VE, targets, references

- [ ] **Step 2: Commit**

```bash
git add SPECS-VERCEL-ENV-MANAGER.md
git commit -m "docs: update specs to reflect sooacel CLI approach"
```

---

### Task 12: Test end-to-end + nettoyage

**Files:**
- Verify: tous les fichiers

- [ ] **Step 1: Verifier la structure finale**

```bash
ls -la bin/ src/ setup/ guides/
```

Attendu :
- `bin/sooacel.js` (executable)
- `src/config.js`, `src/api.js`, `src/prompts.js`, `src/display.js`
- `setup/install.sh` (executable), `setup/install.ps1`, `setup/.env.template`
- `guides/ADMIN-SETUP.md`, `guides/DEV-USAGE.md`
- `package.json`, `package-lock.json`

- [ ] **Step 2: Test end-to-end**

```bash
node bin/sooacel.js
```

Derouler le wizard complet :
1. Choisir Dexyu → verifier que les projets se chargent
2. Choisir un projet → lister les VE
3. Tester `sooacel set` (ajouter une VE de test)
4. Tester `sooacel edit` (modifier la VE de test)
5. Tester `sooacel rm` (supprimer la VE de test)
6. Tester `sooacel pull`

- [ ] **Step 3: Verifier qu'aucun secret n'est dans le repo**

```bash
grep -r "vcp_" . --include="*.js" --include="*.json" --include="*.md" --include="*.env"
```

S'assurer que seul le `.env.template` contient des valeurs vides.

- [ ] **Step 4: Verifier le .gitignore**

Le `.gitignore` doit contenir :
```
node_modules/
.env
.env.local
.env*.local
```
