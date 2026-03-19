# Vercel Env Manager — Gestion des variables d'environnement

## Decision

**Pivot 1** : l'approche initiale (web UI custom avec Next.js, JWT, SQLite) a ete abandonnee.
La CLI Vercel couvre deja le CRUD des VE, et l'audit trail / ACL granulaire
ne sont pas critiques pour une equipe de 4-5 devs de confiance.

**Pivot 2** : les aliases shell `ve-*` ont ete remplaces par un CLI maison `sooacel`.
Les aliases necesitaient une modification du shell RC de chaque poste et etaient
difficilement extensibles. Un CLI Node.js installe globalement (`bin/sooacel.js`)
offre une meilleure portabilite, un wizard interactif unifie, et une surface
d'evolution plus propre (ajout de sous-commandes, tests, packaging).

## Probleme

- Plusieurs devs doivent ajouter/modifier des variables d'environnement sur differents projets Vercel clients
- Creer un compte Vercel par dev est trop couteux (facturation par siege)
- Le MCP Vercel est read-only (pas d'ecriture possible)
- Besoin d'un audit trail et de controle d'acces granulaire

## Solution

Un CLI Node.js (`sooacel`) installe globalement sur le poste dev.
Il lit un fichier `.env` local (`~/.sooacel/.env`) contenant un token Vercel par
compte client, puis expose un wizard interactif et des sous-commandes
(`ls`, `set`, `edit`, `rm`, `pull`) qui appellent l'API Vercel REST via `@vercel/sdk`.

## Architecture

```
Poste dev (Linux/macOS/Windows)
├── ~/.sooacel/.env           ← tokens Vercel (1 par compte client)
└── $(npm bin -g)/sooacel     ← CLI installe globalement
         |
         v
    bin/sooacel.js            ← point d'entree, parsing des sous-commandes
         |
         +-- src/config.js    ← lecture du .env, liste des comptes
         +-- src/api.js       ← appels Vercel REST via @vercel/sdk
         +-- src/prompts.js   ← wizard interactif (inquirer)
         +-- src/display.js   ← formatage de la sortie console
         |
         v
    @vercel/sdk → Vercel REST API
```

## Livrables

| Fichier | Description |
|---------|-------------|
| `package.json` | Manifest Node.js, dependances (`@vercel/sdk`, `inquirer`, `dotenv`), bin entry |
| `bin/sooacel.js` | Point d'entree du CLI, parsing des sous-commandes et options |
| `src/config.js` | Lecture du `.env`, construction de la liste des comptes disponibles |
| `src/api.js` | Fonctions d'appel a l'API Vercel REST via `@vercel/sdk` |
| `src/prompts.js` | Wizard interactif (selection compte, projet, action, valeurs) |
| `src/display.js` | Formatage et affichage des resultats dans le terminal |
| `setup/install.sh` | Script d'installation Linux/macOS (npm install -g, copie du .env) |
| `setup/install.ps1` | Script d'installation Windows |
| `setup/.env.template` | Template .env a remplir par l'admin |
| `guides/ADMIN-SETUP.md` | Guide admin : tokens, installation, rotation |
| `guides/DEV-USAGE.md` | Guide dev : sous-commandes sooacel, wizard, troubleshooting |

## API Vercel REST — Endpoints utilises

### 1. Lister les projets

```http
GET /v10/projects?teamId={teamId}&limit={n}&search={name}
Authorization: Bearer {VERCEL_TOKEN}
```

**Query params utiles** :

| Param    | Type   | Description                           |
| -------- | ------ | ------------------------------------- |
| `teamId` | string | Team ID Vercel                        |
| `slug`   | string | Team slug (alternative a teamId)      |
| `search` | string | Recherche par nom de projet (max 100) |
| `limit`  | string | Nombre de resultats (pagination)      |
| `from`   | string | Continuation token (pagination)       |

**Reponse** :

```json
[
  {
    "id": "prj_xxx",
    "name": "mon-projet",
    "framework": "nextjs",
    "accountId": "team_xxx",
    "nodeVersion": "22.x",
    "createdAt": 1710000000000,
    "updatedAt": 1710000000000
  }
]
```

### 2. Lister les VE d'un projet

```http
GET /v10/projects/{idOrName}/env?teamId={teamId}&decrypt=true
Authorization: Bearer {VERCEL_TOKEN}
```

**Query params** :

| Param       | Type              | Description                                    |
| ----------- | ----------------- | ---------------------------------------------- |
| `decrypt`   | `"true"/"false"`  | Dechiffrer les valeurs                         |
| `gitBranch` | string (max 250)  | Filtrer par branche (necessite target=preview)  |
| `teamId`    | string            | Team ID                                        |
| `slug`      | string            | Team slug                                      |

**Reponse** :

```json
{
  "envs": [
    {
      "id": "env_xxx",
      "key": "DATABASE_URL",
      "value": "postgres://...",
      "type": "encrypted",
      "target": ["production", "preview"],
      "comment": "Base de donnees principale",
      "createdAt": 1710000000000,
      "updatedAt": 1710000000000,
      "createdBy": "user_xxx",
      "updatedBy": "user_xxx"
    }
  ],
  "pagination": {
    "count": 10,
    "next": null,
    "prev": null
  }
}
```

### 3. Creer une ou plusieurs VE

```http
POST /v10/projects/{idOrName}/env?teamId={teamId}&upsert=true
Authorization: Bearer {VERCEL_TOKEN}
Content-Type: application/json
```

**`upsert=true`** : met a jour si la cle existe deja (au lieu de retourner 403).

**Body (une seule VE)** :

```json
{
  "key": "MA_VARIABLE",
  "value": "ma-valeur",
  "type": "encrypted",
  "target": ["production", "preview", "development"],
  "gitBranch": null,
  "comment": "Ajoute par dev X via l'outil interne"
}
```

**Body (batch, plusieurs VE)** :

```json
[
  { "key": "VAR_1", "value": "val1", "type": "encrypted", "target": ["production"] },
  { "key": "VAR_2", "value": "val2", "type": "plain", "target": ["preview", "development"] }
]
```

**Champs du body** :

| Champ                  | Type     | Required | Description                                           |
| ---------------------- | -------- | -------- | ----------------------------------------------------- |
| `key`                  | string   | Oui      | Nom de la variable                                    |
| `value`                | string   | Oui      | Valeur de la variable                                 |
| `type`                 | enum     | Oui      | `"system"`, `"secret"`, `"encrypted"`, `"plain"`, `"sensitive"` |
| `target`               | string[] | Oui*     | `["production"]`, `["preview"]`, `["development"]`    |
| `gitBranch`            | string   | Non      | Branche git (max 250, necessite target=preview)        |
| `comment`              | string   | Non      | Commentaire (max 500)                                 |
| `customEnvironmentIds` | string[] | Non      | IDs d'environnements custom                           |

**Reponse 201** :

```json
{
  "created": { "id": "env_xxx", "key": "MA_VARIABLE", "type": "encrypted", "value": "..." },
  "failed": []
}
```

**Codes d'erreur** :

| Code | Signification                                              |
| ---- | ---------------------------------------------------------- |
| 400  | Body invalide ou document projet trop large                |
| 401  | Token invalide                                             |
| 403  | VE existe deja (sans upsert), ou pas de permission prod    |
| 404  | Projet introuvable                                         |
| 409  | Projet en cours de transfert                               |
| 429  | Rate limit atteint                                         |

### 4. Modifier une VE existante

```http
PATCH /v9/projects/{idOrName}/env/{envId}?teamId={teamId}
Authorization: Bearer {VERCEL_TOKEN}
Content-Type: application/json
```

**Body** (tous les champs sont optionnels) :

```json
{
  "key": "NEW_NAME",
  "value": "new-value",
  "type": "encrypted",
  "target": ["production"],
  "gitBranch": null,
  "comment": "Modifie par dev X le 2026-03-19"
}
```

**Reponse 200** : l'objet VE mis a jour avec `id`, `key`, `value`, `type`, `target`, `updatedAt`, etc.

### 5. Supprimer une VE

```http
DELETE /v9/projects/{idOrName}/env/{envId}?teamId={teamId}
Authorization: Bearer {VERCEL_TOKEN}
```

**Reponse 200** : l'objet VE supprime.

---

## Types de variables d'environnement

| Type        | Comportement                                                    | Usage recommande               |
| ----------- | --------------------------------------------------------------- | ------------------------------ |
| `plain`     | Visible en clair partout                                        | Config non-sensible            |
| `encrypted` | Chiffre au repos, dechiffre au runtime                          | **Defaut recommande**          |
| `sensitive` | Comme encrypted, mais masque dans les logs et l'UI (write-only) | Secrets critiques (API keys)   |
| `secret`    | Legacy, migrer vers `sensitive`                                 | Ne plus utiliser               |
| `system`    | Variables systeme Vercel                                        | Ne pas toucher                 |

## Targets (environnements)

| Target        | Quand                                   |
| ------------- | --------------------------------------- |
| `production`  | Deploiements de production              |
| `preview`     | Deploiements de branches/PR             |
| `development` | `vercel dev` et `vercel env pull`       |

---

## Evolutions possibles

- **Audit trail** : wrapper shell qui logge chaque commande dans un fichier partage
- **ACL granulaire** : outil custom si le besoin de restreindre par dev/projet/env se confirme
- **Batch import** : script de parsing `.env` + appels CLI en boucle

## References

- [Vercel REST API — OpenAPI spec](https://openapi.vercel.sh/)
- [Vercel REST API — Create env vars](https://vercel.com/docs/rest-api/projects/create-one-or-more-environment-variables)
- [Vercel REST API — List env vars](https://vercel.com/docs/rest-api/projects/retrieve-the-environment-variables-of-a-project-by-id-or-name)
- [Vercel REST API — Edit env var](https://vercel.com/docs/rest-api/projects/edit-an-environment-variable)
- [Vercel REST API — Delete env var](https://vercel.com/docs/rest-api/projects/remove-an-environment-variable)
- [Vercel REST API — List projects](https://vercel.com/docs/rest-api/projects/retrieve-a-list-of-projects)
- [@vercel/sdk npm](https://www.npmjs.com/package/@vercel/sdk)
- [Vercel Environment Variables docs](https://vercel.com/docs/environment-variables)
