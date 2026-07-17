# Club des Financiers du Nord — Cloudflare Pages

## Ce que contient ce projet

- Accueil sans scroll forcé sur desktop
- Navigation par catégories en haut
- Documentation du club avec les vrais fichiers fournis
- Événements en cartes homogènes
- Membre de bureau en cartes au même style
- Page admin cachée sur `/cfn2008ph`
- Authentification via cookie signé
- CRUD événements avec upload multiple de photos

## À configurer dans Cloudflare Pages

Ajoute ces variables/secrets :
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Ajoute aussi une base **D1** avec la liaison :
- `CFN_DB`

Puis exécute le SQL de `schema.sql`.

## Déploiement

1. Envoie le dossier sur GitHub.
2. Branche le dépôt à Cloudflare Pages.
3. Configure la base D1 et les variables.
4. Déploie.

## Remarques franches

- La partie “membre de bureau” a des emplacements photo propres, mais pas de vraies photos, parce qu’aucune image du bureau n’a été fournie dans les fichiers.
- Si tu veux des cartes avec les vrais visages, il faut donner les images ou le fichier PowerPoint source.
- L’admin est réellement protégée par les endpoints API. La route seule ne suffit pas à modifier quoi que ce soit.

## Route admin

- Page publique cachée : `/cfn2008ph`
- Ancien accès : `/admin.html` (redirigé vers `/cfn2008ph`)
