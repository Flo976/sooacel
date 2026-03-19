# Guide d'utilisation — CLI sooacel

Ce guide est destine aux developpeurs Sooatek. Toutes les commandes sont a copier-coller directement.

---

## 1. Prerequis

- Le script d'installation a ete lance par l'admin (`setup/install.sh` ou `setup/install.ps1`)
- Le fichier `.env` a ete rempli par l'admin avec les tokens Vercel valides
- La commande `sooacel` est disponible dans votre shell

---

## 2. Verification

Verifiez que le CLI est correctement installe :

```bash
sooacel --version
```

La commande affiche le numero de version du CLI. Si la commande n'est pas reconnue, voir la section [Troubleshooting](#8-troubleshooting).

---

## 3. Usage principal — wizard interactif

La commande sans argument lance le wizard interactif :

```bash
sooacel
```

Le wizard vous guide pas a pas : choix du compte, choix du projet, choix de l'action. C'est le point d'entree recommande pour les operations courantes.

---

## 4. Sous-commandes disponibles

### `sooacel ls` — Lister les variables d'environnement

```bash
sooacel ls
```

Flow interactif : selection du compte → selection du projet → affichage des variables avec leurs cibles (production, preview, development).

---

### `sooacel set` — Ajouter ou mettre a jour une variable

```bash
sooacel set
```

Flow interactif : selection du compte → selection du projet → saisie du nom de la variable → saisie de la valeur → selection des cibles (production, preview, development). Si la variable existe deja, elle est mise a jour (upsert).

---

### `sooacel edit` — Modifier une variable existante

```bash
sooacel edit
```

Flow interactif : selection du compte → selection du projet → selection de la variable → modification de la valeur et/ou des cibles.

---

### `sooacel rm` — Supprimer une variable

```bash
sooacel rm
```

Flow interactif : selection du compte → selection du projet → selection de la variable → confirmation → suppression.

---

### `sooacel pull` — Tirer les variables en local

```bash
sooacel pull
```

Flow interactif : selection du compte → selection du projet → selection de l'environnement (development, preview, production) → creation d'un fichier `.env.local` dans le repertoire courant.

> **Attention :** le fichier `.env.local` ne doit pas etre commite. Verifiez qu'il est bien dans votre `.gitignore`.

---

## 5. Aide

```bash
sooacel --help
```

Affiche la liste de toutes les sous-commandes et leurs options.

---

## 6. Comptes disponibles

| Compte  | Type  |
|---------|-------|
| Dexyu   | Team  |
| Eanet   | Perso |
| Sooatek | Perso |

Le wizard interactif propose ces comptes a la selection automatiquement.

---

## 7. Aide memoire rapide

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

## 8. Troubleshooting

| Erreur | Cause probable | Solution |
|--------|----------------|----------|
| `Error: Not authorized` (401) | Token expire ou invalide | Contacter l'admin pour renouveler le token dans `.env` |
| `Error: Forbidden` (403) | Pas les permissions sur ce projet ou cet environnement | Contacter l'admin pour verifier les droits |
| `Error: Rate limited` (429) | Trop de requetes en peu de temps | Attendre quelques minutes puis reessayer |
| Commande `sooacel` non reconnue | Le CLI n'est pas dans le PATH | Recharger le shell : `source ~/.bashrc` ou `. $PROFILE` |
