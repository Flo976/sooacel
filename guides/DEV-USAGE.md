# Guide d'utilisation - Gestion des variables d'environnement Vercel

Ce guide est destine aux developpeurs Sooatek. Toutes les commandes sont a copier-coller directement.

---

## 1. Prerequis

- Le script d'installation a ete lance par l'admin (`setup/install.sh`)
- Le fichier `.env` a ete rempli par l'admin avec les tokens Vercel valides
- Les aliases `ve-xxx` sont disponibles dans votre shell

---

## 2. Verification

Verifiez que votre environnement est operationnel :

```bash
ve-dexyu whoami
```

La commande doit afficher les informations du compte Dexyu. Si ce n'est pas le cas, voir la section [Troubleshooting](#10-troubleshooting).

---

## 3. Comptes disponibles

| Alias      | Compte Vercel | Type  |
|------------|---------------|-------|
| ve-dexyu   | Dexyu         | Team  |
| ve-eanet   | Eanet         | Perso |
| ve-theo    | Theo          | Perso |
| ve-sooatek | Sooatek       | Perso |

Utilisez l'alias correspondant au compte sur lequel se trouve le projet cible.

---

## 4. Lister les projets

```bash
ve-dexyu project ls
```

Affiche tous les projets du compte Dexyu.

---

## 5. Lister les variables d'environnement d'un projet

```bash
ve-dexyu env ls --project app
```

Remplacez `app` par le nom du projet souhaite.

---

## 6. Ajouter une variable d'environnement

### Mode guide (la CLI pose les questions)

```bash
ve-dexyu env add --project app
```

La CLI vous demande successivement : le nom de la variable, sa valeur, et les environnements cibles (development, preview, production).

### Mode direct

```bash
ve-dexyu env add MA_VAR production --project app
```

Apres cette commande, saisissez la valeur de la variable quand la CLI vous la demande, puis validez avec Entree.

---

## 7. Modifier une variable d'environnement

La CLI Vercel ne dispose pas de commande `env edit`. Il faut supprimer la variable puis la recreer.

```bash
ve-theo env rm MA_VAR --project sos-lunettes-front --environment production
ve-theo env add MA_VAR production --project sos-lunettes-front
```

Saisissez la nouvelle valeur quand la CLI vous la demande.

---

## 8. Supprimer une variable d'environnement

```bash
ve-eanet env rm MA_VAR --project pwa --environment production
```

Remplacez `MA_VAR`, `pwa` et `production` par les valeurs appropriees.

---

## 9. Tirer les variables d'environnement en local

```bash
ve-dexyu env pull --project app --environment development
```

Cree un fichier `.env.local` dans le repertoire courant avec toutes les variables de l'environnement `development` du projet `app`.

> **Attention :** le fichier `.env.local` ne doit pas etre commite. Verifiez qu'il est bien dans votre `.gitignore`.

---

## 10. Troubleshooting

| Erreur                          | Cause probable                                      | Solution                                              |
|---------------------------------|-----------------------------------------------------|-------------------------------------------------------|
| `Error: Not authorized` (401)   | Token expire ou invalide                            | Contacter l'admin pour renouveler le token dans `.env` |
| `Error: Forbidden` (403)        | Pas les permissions sur ce projet ou cet environnement | Contacter l'admin pour verifier les droits             |
| `Error: Rate limited` (429)     | Trop de requetes en peu de temps                    | Attendre quelques minutes puis reessayer              |
| Commande `ve-xxx` non reconnue  | Les aliases ne sont pas charges dans le shell       | Recharger le shell : `source ~/.bashrc` ou `. $PROFILE` |
