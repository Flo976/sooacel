# Guide d'utilisation — CLI sooacel

Ce guide est destine aux developpeurs qui utilisent `sooacel` au quotidien.

---

## 1. Prerequis

- Le script d'installation a ete lance (`setup/install.sh` ou `setup/install.ps1`)
- Le fichier `~/.sooacel/.env` a ete rempli avec les tokens Vercel valides
- La commande `sooacel` est disponible dans votre shell

---

## 2. Verification

Verifiez que le CLI est correctement installe :

```bash
sooacel --version
```

Si la commande n'est pas reconnue, voir la section [Troubleshooting](#7-troubleshooting).

---

## 3. Usage principal — wizard interactif

La commande sans argument lance le wizard interactif :

```bash
sooacel
```

Le wizard vous guide pas a pas : choix du compte, choix du projet, choix de l'action.

---

## 4. Sous-commandes disponibles

### `sooacel ls` — Lister les variables d'environnement

```bash
sooacel ls
```

Selection du compte → selection du projet → affichage des variables avec leurs cibles (production, preview, development).

---

### `sooacel set` — Ajouter ou mettre a jour une variable

```bash
sooacel set
```

Selection du compte → selection du projet → saisie du nom → valeur → type → cibles. Si la variable existe deja, confirmation avant mise a jour.

---

### `sooacel edit` — Modifier une variable existante

```bash
sooacel edit
```

Selection du compte → selection du projet → selection de la variable → nouvelle valeur.

---

### `sooacel rm` — Supprimer une variable

```bash
sooacel rm
```

Selection du compte → selection du projet → selection de la variable → confirmation → suppression.

---

### `sooacel pull` — Tirer les variables en local

```bash
sooacel pull
```

Selection du compte → selection du projet → selection de l'environnement → creation d'un fichier `.env.local` dans le repertoire courant.

> **Attention :** le fichier `.env.local` ne doit pas etre commite. Verifiez qu'il est bien dans votre `.gitignore`.

---

## 5. Aide

```bash
sooacel --help
```

---

## 6. Aide memoire rapide

| Action | Commande |
|--------|----------|
| Wizard complet | `sooacel` |
| Lister les variables | `sooacel ls` |
| Ajouter / mettre a jour | `sooacel set` |
| Modifier | `sooacel edit` |
| Supprimer | `sooacel rm` |
| Tirer en local | `sooacel pull` |
| Aide | `sooacel --help` |
| Version | `sooacel --version` |

---

## 7. Troubleshooting

| Erreur | Cause probable | Solution |
|--------|----------------|----------|
| `Error: Not authorized` (401) | Token expire ou invalide | Contacter l'admin pour renouveler le token |
| `Error: Forbidden` (403) | Pas les permissions sur ce projet | Contacter l'admin pour verifier les droits |
| `Error: Rate limited` (429) | Trop de requetes en peu de temps | Attendre quelques minutes puis reessayer |
| Commande `sooacel` non reconnue | Le CLI n'est pas dans le PATH | Recharger le shell : `source ~/.bashrc` ou `. $PROFILE` |
