# Guide administrateur — Configuration des tokens Vercel

Ce guide est destine aux administrateurs qui configurent l'outil `sooacel`
pour la premiere fois ou qui onboardent un nouveau poste developpeur.

---

## 1. Prerequis

- Avoir un acces **Owner** ou **Admin** sur chaque compte Vercel a gerer
- Git et Node.js >= 18 installes sur le poste

---

## 2. Generer un token Vercel

Repeter la procedure suivante pour chaque compte a gerer.

1. Ouvrir : <https://vercel.com/account/tokens>
   _(se connecter avec le compte concerne si necessaire)_
2. Cliquer sur **Create Token**.
3. Remplir les champs :
   | Champ | Valeur |
   |-------|--------|
   | **Name** | `sooacel-<compte>` — ex : `sooacel-clienta` |
   | **Scope** | Full Account |
   | **Expiration** | 1 an |
4. Cliquer **Create**.
5. **Copier le token immediatement** — il ne sera plus affiche apres fermeture de la modale.
6. Stocker temporairement la valeur dans un gestionnaire de mots de passe ou un fichier local chiffre.

---

## 3. Recuperer le Team ID (comptes team uniquement)

Si un compte Vercel est en mode **team**, son Team ID est requis en plus du token.

### Via le dashboard Vercel

1. Se connecter sur <https://vercel.com> avec le compte concerne.
2. Aller dans **Settings > General**.
3. Copier la valeur du champ **Team ID** (format : `team_xxxxxxxxxxxxxxxxxxxxxxxx`).

### Via la CLI Vercel

```bash
VERCEL_TOKEN=<token> vercel teams ls
```

La commande affiche l'identifiant de l'equipe dans la colonne `ID`.

---

## 4. Remplir le fichier .env

1. Copier le template fourni :
   ```bash
   cp setup/.env.template ~/.sooacel/.env
   ```
2. Ouvrir `~/.sooacel/.env` et renseigner chaque variable :
   ```env
   VERCEL_TOKEN_CLIENTA=vcp_xxx
   VERCEL_TOKEN_CLIENTB=vcp_yyy

   # Pour les comptes team :
   VERCEL_TEAM_CLIENTA=team_xxx
   ```
3. Ne jamais commiter ce fichier (il est hors du repo, dans `~/.sooacel/`).

> Ajoutez autant de `VERCEL_TOKEN_*` que de comptes a gerer. Le CLI les detecte automatiquement.

---

## 5. Installer sur un poste developpeur

1. Transmettre le fichier `.env` rempli au developpeur via un canal securise
   (gestionnaire de mots de passe partage, chiffrement GPG, etc.).
2. Le developpeur place le fichier a `~/.sooacel/.env`.
3. Lancer le script d'installation :

   **Linux / macOS**
   ```bash
   bash setup/install.sh
   ```

   **Windows (PowerShell)**
   ```powershell
   powershell -ExecutionPolicy Bypass -File setup/install.ps1
   ```

4. Redemarrer le terminal (ou `source ~/.bashrc` / `source ~/.zshrc`) pour
   activer la commande `sooacel`.

---

## 6. Rotation des tokens

A effectuer **une fois par an** ou **des qu'un developpeur quitte l'equipe**.

1. Generer un **nouveau token** pour le ou les comptes concernes (cf. section 2).
2. Mettre a jour la variable correspondante dans le `.env` de **chaque poste developpeur**.
3. **Revoquer l'ancien token** sur <https://vercel.com/account/tokens>.

> Ne pas revoquer l'ancien token avant que tous les postes aient ete mis a jour.

---

## 7. Ajouter un nouveau compte

1. Generer un token Vercel pour le nouveau compte (cf. section 2).
2. Ajouter dans `~/.sooacel/.env` de chaque poste dev :
   ```env
   VERCEL_TOKEN_NOUVEAUCLIENT=vcp_xxx
   # Si team :
   VERCEL_TEAM_NOUVEAUCLIENT=team_xxx
   ```
3. Le compte apparait automatiquement dans le wizard au prochain lancement.

---

## 8. Securite

> **Attention** : un token Vercel avec le scope *Full Account* donne acces a
> l'integralite du compte — deploiements, domaines, membres, facturation — et pas
> uniquement aux variables d'environnement.

Recommandations :

- Ne jamais partager un token par e-mail ou messagerie instantanee non chiffree.
- Utiliser un gestionnaire de mots de passe partage (ex : 1Password, Bitwarden Teams).
- Instruire les developpeurs de **n'utiliser `sooacel` que pour les operations
  sur les variables d'environnement** (`ls`, `set`, `edit`, `rm`, `pull`).
- En cas de suspicion de fuite, revoquer le token immediatement sur
  <https://vercel.com/account/tokens> et en generer un nouveau.
