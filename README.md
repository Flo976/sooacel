```
███████╗  ██████╗   ██████╗   █████╗   ██████╗ ███████╗ ██╗
██╔════╝ ██╔═══██╗ ██╔═══██╗ ██╔══██╗ ██╔════╝ ██╔════╝ ██║
███████╗ ██║   ██║ ██║   ██║ ███████║ ██║      █████╗   ██║
╚════██║ ██║   ██║ ██║   ██║ ██╔══██║ ██║      ██╔══╝   ██║
███████║ ╚██████╔╝ ╚██████╔╝ ██║  ██║ ╚██████╗ ███████╗ ███████╗
╚══════╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═╝  ╚═════╝ ╚══════╝ ╚══════╝
```

**CLI interactive pour gerer les variables d'environnement Vercel multi-comptes.**

Gerez les VE de tous vos comptes Vercel depuis un seul outil interactif, sans avoir besoin d'un compte Vercel par developpeur.

---

## Pourquoi Sooacel ?

- Vous gerez **plusieurs comptes/clients Vercel** et voulez un point d'entree unique
- Vous ne voulez pas creer un **compte Vercel par developpeur** (facturation par siege)
- La CLI Vercel officielle est **interactive de maniere non controlable** et n'a pas de `env edit`
- Vous voulez une UX **simple et guidee** pour les devs qui ne connaissent pas Vercel

## Fonctionnalites

- **Wizard interactif** — selection du compte, projet et action avec menus navigables
- **Multi-comptes dynamique** — ajoutez autant de comptes Vercel que necessaire, detection automatique
- **CRUD complet** — lister, ajouter, modifier, supprimer les variables d'environnement
- **Pull local** — tire les VE dans un `.env.local` pour le dev local
- **Sous-commandes** — `sooacel ls`, `set`, `edit`, `rm`, `pull` pour aller vite
- **Cross-platform** — Linux, macOS, Windows (PowerShell)

---

## Quick Start

### 1. Installation

```bash
git clone https://github.com/Flo976/sooacel.git
cd sooacel

# Linux / macOS
bash setup/install.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File setup/install.ps1
```

Le script :
- Verifie Node.js >= 18
- Installe les dependances (`npm install`)
- Cree `~/.sooacel/` avec un template `.env`
- Ajoute l'alias `sooacel` a votre shell

### 2. Configuration

Generez un [token Vercel](https://vercel.com/account/tokens) pour chaque compte a gerer, puis remplissez `~/.sooacel/.env` :

```env
VERCEL_TOKEN_CLIENTA=vcp_xxx
VERCEL_TOKEN_CLIENTB=vcp_yyy

# Pour les comptes en mode team :
VERCEL_TEAM_CLIENTA=team_xxx
```

> Guide complet : [`guides/ADMIN-SETUP.md`](guides/ADMIN-SETUP.md)

### 3. Utilisation

```bash
# Wizard interactif complet
sooacel

# Sous-commandes directes
sooacel ls      # Lister les variables
sooacel set     # Ajouter une variable
sooacel edit    # Modifier une variable
sooacel rm      # Supprimer une variable
sooacel pull    # Tirer les VE en local (.env.local)

# Aide
sooacel --help
sooacel --version
```

> Guide complet : [`guides/DEV-USAGE.md`](guides/DEV-USAGE.md)

---

## Exemple

```
$ sooacel set

   ███████╗  ██████╗   ██████╗  ...
   Vercel Env Manager — by sooatek.

? Compte Vercel : ClientA (team)
? Projet : my-app
? Nom de la variable : DATABASE_URL
? Valeur : ********
? Type : encrypted (defaut recommande)
? Environnements : production, preview
? Commentaire : Added by dev

✅ Variable DATABASE_URL ajoutee sur my-app (production, preview)
```

---

## Ajouter un compte Vercel

Le CLI detecte automatiquement tous les `VERCEL_TOKEN_*` presents dans `~/.sooacel/.env`.

Pour ajouter un nouveau compte :

```env
VERCEL_TOKEN_NEWCLIENT=vcp_xxx
```

Si le compte est en mode **team**, ajoutez aussi le team ID :

```env
VERCEL_TEAM_NEWCLIENT=team_xxx
```

Le compte apparaitra automatiquement dans le wizard — aucune modification du code necessaire.

---

## Architecture

```
sooacel/
├── bin/sooacel.js       # Point d'entree CLI
├── src/
│   ├── config.js        # Charge les tokens depuis ~/.sooacel/.env
│   ├── api.js           # Wrapper @vercel/sdk (CRUD env vars)
│   ├── prompts.js       # Menus interactifs (@inquirer/prompts)
│   └── display.js       # Formatage output (chalk)
├── setup/
│   ├── install.sh       # Installation Linux/macOS
│   ├── install.ps1      # Installation Windows
│   └── .env.template    # Template tokens
├── guides/
│   ├── ADMIN-SETUP.md   # Guide admin
│   └── DEV-USAGE.md     # Guide dev
├── skill/
│   └── SKILL.md         # Skill Claude Code
└── package.json
```

### Flow

```
~/.sooacel/.env (tokens)
       |
       v
  config.js  -->  prompts.js (menus interactifs)
       |               |
       v               v
    api.js  <----  bin/sooacel.js (orchestration)
       |
       v
  @vercel/sdk --> Vercel REST API
```

---

## Stack technique

| Composant | Technologie | Role |
|-----------|-------------|------|
| Runtime | Node.js >= 18 | ESM natif |
| API | `@vercel/sdk` | Typage + appels Vercel REST API |
| Prompts | `@inquirer/prompts` | Menus interactifs navigables |
| Affichage | `chalk` | Couleurs et formatage terminal |

---

## Securite

- Les tokens sont stockes dans `~/.sooacel/.env` (permissions 600), **jamais dans le repo**
- Le CLI verifie les permissions du fichier au demarrage
- Les valeurs des VE sont masquees a la saisie et a l'affichage
- Chaque token donne un acces complet au compte Vercel associe — utiliser uniquement pour la gestion des VE

---

## Documentation

| Guide | Description |
|-------|-------------|
| [`ADMIN-SETUP.md`](guides/ADMIN-SETUP.md) | Generer les tokens, installer sur les postes dev, rotation |
| [`DEV-USAGE.md`](guides/DEV-USAGE.md) | Utilisation quotidienne, commandes, troubleshooting |

---

## Mode non-interactif

Toutes les sous-commandes supportent un mode 100% non-interactif via des flags :

```bash
# Lister
sooacel ls --account clienta --project my-app

# Ajouter
sooacel set --account clienta --project my-app \
  --key DATABASE_URL --value "postgres://..." \
  --target production,preview --yes

# Modifier
sooacel edit --account clienta --project my-app \
  --key DATABASE_URL --value "new-value"

# Supprimer
sooacel rm --account clienta --project my-app --key OLD_VAR --yes

# Pull en local
sooacel pull --account clienta --project my-app --environment development --yes
```

Le flag `--yes` / `-y` skip toutes les confirmations. Ideal pour le scripting et l'integration avec des outils comme Claude Code.

---

## Skill Claude Code

Un skill est inclus dans le repo pour permettre a Claude Code de gerer les VE Vercel directement en conversation.

### Installation

```bash
claude skill add /chemin/vers/sooacel/skill
```

### Utilisation

Une fois le skill installe, vous pouvez demander a Claude Code :

- "Liste les variables d'environnement du projet app sur dexyu"
- "Ajoute DATABASE_URL=postgres://... sur le projet my-app de clienta en production"
- "Supprime la variable OLD_KEY du projet pwa sur eanet"
- "Pull les VE de development pour le projet app de dexyu"

Claude Code utilisera automatiquement le CLI `sooacel` en mode non-interactif.

---

## Evolutions prevues

- [ ] `sooacel projects add` — creer un projet Vercel
- [ ] Audit trail local (`~/.sooacel/audit.log`)
- [ ] Diff entre environnements (production vs preview vs development)
- [ ] Batch import depuis un fichier `.env`

---

## Licence

MIT

---

*Developpe par [Sooatek](https://sooatek.com)*
