```
███████╗  ██████╗   ██████╗   █████╗   ██████╗ ███████╗ ██╗
██╔════╝ ██╔═══██╗ ██╔═══██╗ ██╔══██╗ ██╔════╝ ██╔════╝ ██║
███████╗ ██║   ██║ ██║   ██║ ███████║ ██║      █████╗   ██║
╚════██║ ██║   ██║ ██║   ██║ ██╔══██║ ██║      ██╔══╝   ██║
███████║ ╚██████╔╝ ╚██████╔╝ ██║  ██║ ╚██████╗ ███████╗ ███████╗
╚══════╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═╝  ╚═════╝ ╚══════╝ ╚══════╝
```

**CLI interne Sooatek pour gerer les variables d'environnement Vercel.**

Gerez les VE de tous vos comptes clients Vercel depuis un seul outil interactif, sans avoir besoin d'un compte Vercel par developpeur.

---

## Fonctionnalites

- **Wizard interactif** — selection du compte, projet et action avec menus navigables
- **Multi-comptes** — Dexyu (team), Eanet, Sooatek en un seul outil
- **CRUD complet** — lister, ajouter, modifier, supprimer les variables d'environnement
- **Pull local** — tire les VE dans un `.env.local` pour le dev local
- **Sous-commandes** — `sooacel ls`, `set`, `edit`, `rm`, `pull` pour aller vite
- **Cross-platform** — Linux, macOS, Windows (PowerShell)

---

## Quick Start

### 1. Installation

```bash
# Cloner le repo
git clone git@github.com:sooatek/sooacel.git
cd sooacel

# Lancer le script d'installation
bash setup/install.sh        # Linux / macOS
# ou
powershell -ExecutionPolicy Bypass -File setup/install.ps1   # Windows
```

Le script :
- Verifie Node.js >= 18
- Installe les dependances (`npm install`)
- Cree `~/.sooacel/` avec un template `.env`
- Ajoute l'alias `sooacel` a votre shell

### 2. Configuration (admin)

Un admin genere les tokens Vercel et remplit `~/.sooacel/.env` sur chaque poste dev.

> Voir le guide complet : [`guides/ADMIN-SETUP.md`](guides/ADMIN-SETUP.md)

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

> Voir le guide complet : [`guides/DEV-USAGE.md`](guides/DEV-USAGE.md)

---

## Exemple

```
$ sooacel set

   ███████╗  ██████╗   ██████╗   █████╗   ██████╗ ███████╗ ██╗
   ...

   Vercel Env Manager — by sooatek.

? Compte Vercel : Dexyu (team)
? Projet : app
? Nom de la variable : DATABASE_URL
? Valeur : ********
? Type : encrypted (defaut recommande)
? Environnements : production, preview
? Commentaire : Ajoute par Rina

✅ Variable DATABASE_URL ajoutee sur app (production, preview)
```

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

## Comptes configures

| Alias dans .env | Compte Vercel | Type |
|-----------------|---------------|------|
| `VERCEL_TOKEN_DEXYU` | Dexyu | Team |
| `VERCEL_TOKEN_EANET` | Eanet | Personnel |
| `VERCEL_TOKEN_SOOATEK` | Sooatek | Personnel |

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

## Guides

| Guide | Description |
|-------|-------------|
| [`ADMIN-SETUP.md`](guides/ADMIN-SETUP.md) | Generer les tokens, installer sur les postes dev, rotation |
| [`DEV-USAGE.md`](guides/DEV-USAGE.md) | Utilisation quotidienne, commandes, troubleshooting |
| [`SPECS-VERCEL-ENV-MANAGER.md`](SPECS-VERCEL-ENV-MANAGER.md) | Specs techniques, reference API Vercel |

---

## Evolutions prevues

- [ ] `sooacel projects add` — creer un projet Vercel
- [ ] Audit trail local (`~/.sooacel/audit.log`)
- [ ] Mode non-interactif (`sooacel set --account dexyu --project app --key X --value Y`)
- [ ] Diff entre environnements (production vs preview vs development)
- [ ] Batch import depuis un fichier `.env`

---

*Developpe par [Sooatek](https://sooatek.com)*
