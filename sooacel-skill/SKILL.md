---
name: sooacel
description: >
  Manage Vercel environment variables across multiple accounts using the sooacel CLI.
  Use this skill whenever the user mentions Vercel environment variables, env vars, VE,
  .env, secrets, or wants to list/add/edit/delete/pull environment variables on a Vercel project.
  Also trigger when the user mentions sooacel, "variable d'environnement", or references
  a Vercel project/account in the context of configuration or secrets management.
  Do NOT trigger for general Vercel deployment, domain, or billing questions.
---

# Sooacel — Vercel Env Manager CLI

Sooacel is an interactive + non-interactive CLI that manages Vercel environment variables across multiple accounts. It wraps `@vercel/sdk` and stores tokens in `~/.sooacel/.env`.

## Setup

The CLI lives at: `/home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js`

If the user hasn't installed it yet, point them to:
```bash
cd /home/florent-didelot/Documents/GitHub/sooacel
bash setup/install.sh
```

## How to Use

Always use the **non-interactive mode** (pass all arguments via flags). Never launch the interactive wizard — it uses inquirer prompts that cannot be controlled from Claude Code.

### Available commands

#### List env vars
```bash
node /home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js ls --account <account> --project <project>
```

#### Add / upsert an env var
```bash
node /home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js set \
  --account <account> \
  --project <project> \
  --key <KEY_NAME> \
  --value "<value>" \
  --type <encrypted|plain|sensitive> \
  --target <production,preview,development> \
  --comment "<optional comment>" \
  --yes
```
- `--type` defaults to `encrypted` if omitted
- `--target` defaults to `production,preview` if omitted
- `--yes` skips the upsert confirmation if the key already exists

#### Edit an existing env var
```bash
node /home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js edit \
  --account <account> \
  --project <project> \
  --key <KEY_NAME> \
  --value "<new value>" \
  --comment "<optional comment>"
```

#### Delete an env var
```bash
node /home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js rm \
  --account <account> \
  --project <project> \
  --key <KEY_NAME> \
  --yes
```
- `--yes` skips the deletion confirmation

#### Pull env vars to .env.local
```bash
node /home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js pull \
  --account <account> \
  --project <project> \
  --environment <development|preview|production> \
  --yes
```
- `--yes` skips overwrite confirmation if `.env.local` already exists

### Parameters

| Flag | Description | Required for |
|------|-------------|-------------|
| `--account` | Account key (lowercase, matches VERCEL_TOKEN_* suffix) | All commands |
| `--project` | Vercel project name | All commands |
| `--key` | Env var name | set, edit, rm |
| `--value` | Env var value | set, edit |
| `--type` | `encrypted` (default), `plain`, `sensitive` | set (optional) |
| `--target` | Comma-separated: `production,preview,development` | set (optional) |
| `--environment` | `development`, `preview`, or `production` | pull |
| `--comment` | Optional comment | set, edit (optional) |
| `--yes` / `-y` | Skip all confirmations | Any (optional) |

## Account Discovery

Accounts are auto-discovered from `~/.sooacel/.env`. Any `VERCEL_TOKEN_<NAME>=<token>` line creates an account with key `<name>` (lowercased). The `--account` flag matches against this key.

To see available accounts, run:
```bash
node /home/florent-didelot/Documents/GitHub/sooacel/bin/sooacel.js ls --account nonexistent --project x 2>&1
```
The error message lists all available account keys.

## Common Patterns

**User asks to add a variable:**
1. Ask which account and project if not specified
2. Run `sooacel set` with all flags
3. Confirm success from the output

**User asks to check what variables exist:**
1. Run `sooacel ls` with account and project
2. Present the table output to the user

**User asks to update a variable:**
1. Run `sooacel edit` with account, project, key, and new value

**User asks to delete a variable:**
1. Run `sooacel rm` with `--yes` to skip confirmation

**User asks to pull env vars for local dev:**
1. Run `sooacel pull` with `--environment development --yes`

## Error Handling

The CLI returns clear French error messages:
- `Token invalide ou expire` → token needs rotation, contact admin
- `Pas de permission` → wrong account or insufficient access
- `Projet introuvable` → check project name spelling
- `Compte inconnu` → check account key, list available accounts
- `Variable introuvable` → check key name with `sooacel ls` first

Always check the exit code: 0 = success, 1 = error.
