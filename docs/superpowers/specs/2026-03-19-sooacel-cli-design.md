# Sooacel CLI — Design Spec

## Decision

Pivot de l'approche "aliases ve-* + CLI Vercel" vers une **CLI interactive maison** qui tape l'API Vercel REST directement via `@vercel/sdk`.

**Raison** : la CLI Vercel a des frictions (prompts interactifs non controlables, pas de `env edit`, bugs de `--scope` selon les versions). Une CLI maison offre un controle total sur l'UX et permet d'ajouter des fonctionnalites (audit trail, etc.) plus tard.

---

## Contexte

- **Qui** : devs Sooatek (~4-5 personnes)
- **Quoi** : gerer les variables d'environnement (VE) sur les projets Vercel de differents clients
- **Comptes Vercel** : 3 comptes (Dexyu en mode team, Eanet perso, Sooatek perso)
- **Distribution** : les devs clonent le repo, lancent `npm install`, un alias `sooacel` est ajoute au shell

## Cas d'usage

1. **CAS 1** : Rina doit ajouter une VE sur le projet "app" de Dexyu → `sooacel set` → choisit Dexyu → app → saisit la VE
2. **CAS 2** : Rina doit modifier une VE sur "sos-lunettes-front" de Sooatek → `sooacel edit` → choisit Sooatek → sos-lunettes-front → choisit la VE → modifie
3. **CAS 3** : Rivo doit supprimer une VE sur la PWA d'Eanet → `sooacel rm` → choisit Eanet → pwa → choisit la VE → confirme

---

## Architecture

```
Poste dev
├── ~/.sooacel/.env                 ← tokens Vercel (1 par compte)
├── ~/repos/sooacel/                ← repo clone
│   ├── bin/sooacel.js              ← point d'entree
│   ├── src/config.js               ← charge les tokens
│   ├── src/api.js                  ← wrapper @vercel/sdk
│   ├── src/prompts.js              ← menus interactifs
│   └── src/display.js              ← formatage output
└── ~/.bashrc ou $PROFILE           ← alias sooacel → bin/sooacel.js
         |
         v
    @vercel/sdk → Vercel REST API (api.vercel.com)
```

---

## Flow interactif

### Wizard principal (`sooacel`)

```
$ sooacel

  Sooacel — Vercel Env Manager

? Compte Vercel :
  > Dexyu (team)
    Eanet
    Sooatek

? Projet :                    (fetch live depuis l'API, avec recherche)
  > app
    api
    sos-lunettes-front
    [Rechercher...]

? Action :
  > Lister les variables
    Ajouter une variable
    Modifier une variable
    Supprimer une variable
    Tirer les VE en local (.env.local)
```

### Sous-commandes (raccourcis)

| Commande | Saute directement a | Demande encore |
|----------|---------------------|----------------|
| `sooacel` | Debut du wizard | Tout |
| `sooacel ls` | Lister les variables | Compte + projet |
| `sooacel set` | Ajouter une variable | Compte + projet + saisie VE |
| `sooacel edit` | Modifier une variable | Compte + projet + choix VE |
| `sooacel rm` | Supprimer une variable | Compte + projet + choix VE |
| `sooacel pull` | Tirer en local | Compte + projet |

### Flow "Ajouter une variable" (`sooacel set`)

```
? Compte Vercel : Dexyu (team)
? Projet : app
? Nom de la variable : DATABASE_URL
? Valeur : ********                    (masquee a la saisie)
? Type :
  > encrypted (defaut recommande)
    plain
    sensitive
? Environnements :                     (multi-select avec espace)
  * production
  * preview
    development
? Commentaire (optionnel) : Ajoute par Rina

✅ Variable DATABASE_URL ajoutee sur app (production, preview)
```

### Flow "Modifier une variable" (`sooacel edit`)

```
? Compte Vercel : Sooatek
? Projet : sos-lunettes-front
? Variable a modifier :
  > DATABASE_URL (production, preview) [encrypted]
    NEXT_PUBLIC_API_URL (production, preview, development) [plain]
    STRIPE_SECRET_KEY (production) [sensitive]

  Valeur actuelle : postg****...           (masquee, 4 premiers caracteres visibles)
? Nouvelle valeur : ********
? Commentaire (optionnel) : Mis a jour par Rina

✅ Variable DATABASE_URL modifiee sur sos-lunettes-front
```

### Flow "Supprimer une variable" (`sooacel rm`)

```
? Compte Vercel : Eanet
? Projet : pwa
? Variable a supprimer :
  > OLD_API_KEY (production) [encrypted]

⚠️  Supprimer OLD_API_KEY sur pwa (production) ? (o/N) : o

✅ Variable OLD_API_KEY supprimee de pwa
```

### Flow "Lister les variables" (`sooacel ls`)

```
? Compte Vercel : Dexyu (team)
? Projet : app

  Variables d'environnement — app (Dexyu)

  Nom                    Type        Environnements
  DATABASE_URL           encrypted   production, preview
  NEXT_PUBLIC_API_URL    plain       production, preview, development
  STRIPE_SECRET_KEY      sensitive   production
  REDIS_URL              encrypted   production, preview

  4 variables
```

### Flow "Tirer en local" (`sooacel pull`)

```
? Compte Vercel : Dexyu (team)
? Projet : app
? Environnement :
  > development
    preview
    production

✅ 4 variables ecrites dans .env.local
```

---

## Modules

### `bin/sooacel.js`

Point d'entree. Shebang `#!/usr/bin/env node`.
- Parse `process.argv[2]` pour la sous-commande (`ls`, `set`, `edit`, `rm`, `pull`)
- Si pas de sous-commande → lance le wizard complet
- Si sous-commande inconnue → affiche un message d'erreur + usage
- `--help` / `-h` → affiche l'usage (liste des sous-commandes)
- `--version` / `-v` → affiche la version depuis package.json
- Gestion des erreurs globale (catch non gere → message propre)
- Ctrl+C → sort proprement a tout moment

### `src/config.js`

Charge `~/.sooacel/.env` et expose les comptes.

```js
// Retourne :
[
  { name: "Dexyu (team)", key: "dexyu", token: "vcp_...", teamId: "team_..." },
  { name: "Eanet", key: "eanet", token: "vcp_...", teamId: null },
  { name: "Sooatek", key: "sooatek", token: "vcp_...", teamId: null },
]
```

- Parse le `.env` avec regex (`^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$`), strip les guillemets si presents
- Mapping hardcode : `VERCEL_TOKEN_DEXYU` → compte "Dexyu (team)", `VERCEL_TEAM_DEXYU` → teamId
- Si `~/.sooacel/.env` absent → erreur : "Fichier ~/.sooacel/.env introuvable. Lancez le script d'installation."
- Si un token est vide → le compte est ignore

### `src/api.js`

Wrapper `@vercel/sdk`. Fonctions exposees :

```
listProjects(token, teamId?)
  → [{ id, name, framework }]

listEnvVars(token, projectId, teamId?)
  → [{ id, key, value, type, target, comment }]
  (avec decrypt=true pour voir les valeurs)

createEnvVar(token, projectId, { key, value, type, target, comment }, teamId?)
  (verifie si la cle existe deja ; si oui, demande confirmation avant upsert)

editEnvVar(token, projectId, envId, { value?, type?, target?, comment? }, teamId?)
  (PATCH, edition partielle)

deleteEnvVar(token, projectId, envId, teamId?)

pullEnvVars(token, projectId, environment, teamId?)
  → ecrit un fichier .env.local dans le repertoire courant (process.cwd())
  → si .env.local existe deja, demande confirmation avant d'ecraser
```

Reserve pour le futur (pas dans le MVP) :
```
createProject(token, { name, framework }, teamId?)
```

Pagination :
- `listProjects` et `listEnvVars` gerent la pagination automatiquement (suivent `pagination.next` jusqu'a epuisement)

Gestion d'erreur :
- 401 → "Token invalide ou expire. Contactez l'admin."
- 403 → "Pas de permission sur ce projet/environnement."
- 404 → "Projet introuvable."
- 429 → "Rate limit Vercel atteint. Reessayez dans quelques minutes."
- Erreur reseau (DNS, timeout, pas de connexion) → "Impossible de joindre l'API Vercel. Verifiez votre connexion internet."

### `src/prompts.js`

Menus interactifs avec `@inquirer/prompts`.

Fonctions :
- `selectAccount(accounts)` → choix du compte (liste navigable)
- `selectProject(projects)` → choix du projet (avec recherche/filtre)
- `selectAction()` → choix de l'action
- `selectEnvVar(envVars)` → choix d'une VE existante (pour edit/rm)
- `inputNewEnvVar()` → saisie nom + valeur + type + targets + commentaire
- `inputEditEnvVar(currentVar)` → saisie nouvelle valeur + commentaire
- `confirmDelete(varName, projectName)` → confirmation de suppression
- `selectEnvironment()` → choix d'un environnement (pour pull)

### `src/display.js`

Formatage de l'output avec `chalk`.

Fonctions :
- `showEnvVarList(vars, projectName, accountName)` → tableau formate
- `showSuccess(message)` → vert avec ✅
- `showError(message)` → rouge
- `showWarning(message)` → jaune avec ⚠️

---

## Configuration : `~/.sooacel/.env`

```env
# Comptes Vercel geres par Sooatek
VERCEL_TOKEN_DEXYU=vcp_xxx
VERCEL_TOKEN_EANET=vcp_xxx
VERCEL_TOKEN_SOOATEK=vcp_xxx

# Team IDs
VERCEL_TEAM_DEXYU=team_xxx
```

Inchange par rapport a la version precedente (sauf suppression de VERCEL_TOKEN_THEO).

Securite :
- `~/.sooacel/` doit avoir les permissions 700 (`chmod 700`)
- `~/.sooacel/.env` doit avoir les permissions 600 (`chmod 600`)
- `config.js` verifie les permissions au demarrage et affiche un warning si le fichier est lisible par d'autres utilisateurs

---

## package.json

```json
{
  "name": "sooacel",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "sooacel": "./bin/sooacel.js"
  },
  "dependencies": {
    "@vercel/sdk": "^1",
    "@inquirer/prompts": "^7",
    "chalk": "^5"
  }
}
```

- ESM natif (`"type": "module"`)
- Pas de framework CLI (commander, yargs) — sous-commandes gerees via `process.argv[2]`
- 3 dependances seulement
- Versions pinees en semver majeur, `package-lock.json` commite dans le repo
- Node.js >= 18 requis (ESM, top-level await)

---

## Scripts d'installation (mis a jour)

### `install.sh` (Linux/macOS)

1. Verifie Node.js >= 18
2. Cree `~/.sooacel/` (chmod 700) + copie `.env.template` (chmod 600)
3. `npm install` dans le repertoire du repo
4. Ajoute un alias au shell rc :
   ```bash
   alias sooacel="/chemin/absolu/vers/repo/bin/sooacel.js"
   ```
5. Affiche un resume

### `install.ps1` (Windows)

1. Verifie Node.js >= 18
2. Cree `~/.sooacel/` + copie `.env.template`
3. `npm install` dans le repertoire du repo
4. Ajoute une fonction au `$PROFILE` :
   ```powershell
   function sooacel { node "/chemin/absolu/vers/repo/bin/sooacel.js" @args }
   ```
5. Affiche un resume

Les aliases `ve-*` sont supprimes.

---

## Guides (mis a jour)

### `ADMIN-SETUP.md`

- Meme contenu pour la generation de tokens (3 comptes au lieu de 4)
- Section installation : `bash setup/install.sh` (inchange)
- Suppression de toute reference a `ve-*`

### `DEV-USAGE.md`

- Remplace toutes les commandes `ve-*` par `sooacel`
- Documente le wizard et les sous-commandes
- Memes sections troubleshooting

---

## Ce qui n'est PAS couvert (et pourquoi)

- **Audit trail** : pas critique a ce stade. L'architecture permet de l'ajouter facilement dans `api.js` (log avant chaque appel).
- **ACL granulaire** : le dev qui a le token a acces a tout le compte. Acceptable pour une equipe de confiance.
- **Add project** : prevu dans l'API (`createProject`) mais pas dans le wizard MVP.
- **Batch import .env** : a evaluer si le besoin se confirme.

## Evolution possible

- Ajouter `sooacel projects add` pour creer un projet
- Audit trail local (append dans `~/.sooacel/audit.log`)
- Mode non-interactif complet (`sooacel set --account dexyu --project app --key X --value Y`)
- Diff view entre environnements
