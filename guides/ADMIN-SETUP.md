# Guide administrateur — Configuration des tokens Vercel

Ce guide est destine aux admins Sooatek qui configurent l'outil `sooacel`
pour la premiere fois ou qui onboardent un nouveau poste developpeur.

---

## 1. Prerequis

- Avoir un acces **Owner** ou **Admin** sur chaque compte Vercel gere :
  - **Dexyu** (compte team)
  - **Eanet** (compte personnel)
  - **Theo** (compte personnel)
  - **Sooatek** (compte personnel)
- Git et les scripts d'installation (`setup/install.sh` ou `setup/install.ps1`) disponibles sur le poste.

---

## 2. Generer un token Vercel

Repeter la procedure suivante pour chacun des quatre comptes.

1. Ouvrir : <https://vercel.com/account/tokens>
   _(se connecter avec le compte concerne si necessaire)_
2. Cliquer sur **Create Token**.
3. Remplir les champs :
   | Champ | Valeur |
   |-------|--------|
   | **Name** | `sooatek-env-manager-<compte>` — ex : `sooatek-env-manager-dexyu` |
   | **Scope** | Full Account |
   | **Expiration** | 1 an |
4. Cliquer **Create**.
5. **Copier le token immediatement** — il ne sera plus affiche apres fermeture de la modale.
6. Stocker temporairement la valeur dans un gestionnaire de mots de passe ou un fichier local chiffre, le temps de remplir le `.env`.

Comptes a traiter :

- [ ] Dexyu → token nomme `sooatek-env-manager-dexyu`
- [ ] Eanet → token nomme `sooatek-env-manager-eanet`
- [ ] Theo → token nomme `sooatek-env-manager-theo`
- [ ] Sooatek → token nomme `sooatek-env-manager-sooatek`

---

## 3. Recuperer le Team ID Dexyu

Le compte **Dexyu** est un compte team : son Team ID est requis en plus du token.

### Via le dashboard Vercel

1. Se connecter sur <https://vercel.com> avec le compte Dexyu.
2. Aller dans **Settings > General**.
3. Copier la valeur du champ **Team ID** (format : `team_xxxxxxxxxxxxxxxxxxxxxxxx`).

### Via la CLI Vercel

```bash
VERCEL_TOKEN=<token_dexyu> vercel teams ls
```

La commande affiche l'identifiant de l'equipe dans la colonne `ID`.

---

## 4. Remplir le fichier .env

1. Copier le template fourni :
   ```bash
   cp setup/.env.template .env
   ```
2. Ouvrir `.env` et renseigner chaque variable avec les valeurs collectees :
   ```
   VERCEL_TOKEN_DEXYU=<token_dexyu>
   VERCEL_TEAM_DEXYU=<team_id_dexyu>
   VERCEL_TOKEN_EANET=<token_eanet>
   VERCEL_TOKEN_THEO=<token_theo>
   VERCEL_TOKEN_SOOATEK=<token_sooatek>
   ```
3. Ne jamais commiter ce fichier `.env` (il est dans `.gitignore`).

---

## 5. Installer sur un poste developpeur

1. Transmettre le fichier `.env` rempli au developpeur via un canal securise
   (gestionnaire de mots de passe partage, chiffrement GPG, etc.).
2. Le developpeur place le fichier `.env` a la racine du depot `sooacel`.
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
   activer les alias.

---

## 6. Rotation des tokens

A effectuer **une fois par an** ou **des qu'un developpeur quitte l'equipe**.

1. Generer un **nouveau token** pour le ou les comptes concernes (cf. section 2).
2. Mettre a jour la variable correspondante dans le `.env` de **chaque poste developpeur**.
3. **Revoquer l'ancien token** sur <https://vercel.com/account/tokens>.

> Ne pas revoquer l'ancien token avant que tous les postes aient ete mis a jour,
> sous peine d'interrompre le travail en cours.

---

## 7. Ajouter un nouveau compte client

1. Generer un token Vercel pour le nouveau compte (cf. section 2), avec le nom
   `sooatek-env-manager-<nom>`.
2. Ajouter la variable dans `setup/.env.template` :
   ```
   VERCEL_TOKEN_<NOM>=
   ```
3. Distribuer le `.env` mis a jour a chaque developpeur (cf. section 5).
4. Ajouter la fonction `ve-<nom>` dans le script rc correspondant **ou** relancer
   `install.sh` / `install.ps1` apres avoir mis a jour le script d'installation.

---

## 8. Securite

> **Attention** : un token Vercel avec le scope *Full Account* donne acces a
> l'integralite du compte — deploiements, domaines, membres, facturation — et pas
> uniquement aux variables d'environnement.

Recommandations :

- Ne jamais partager un token par e-mail ou messagerie instantanee non chiffree.
- Utiliser un gestionnaire de mots de passe partage (ex : 1Password, Bitwarden Teams).
- Instruire les developpeurs de **n'utiliser les alias `ve-*` que pour les operations
  sur les variables d'environnement** (`env pull`, `env add`, `env rm`, etc.).
- En cas de suspicion de fuite, revoquer le token immediatement sur
  <https://vercel.com/account/tokens> et en generer un nouveau.
