# battle4 — POC Next.js Twitch + Streamlabs

Ce dépôt contient un POC minimal pour se connecter via Twitch (OAuth), appeler Helix, lire le chat via tmi.js (prototype) et préparer l'intégration Streamlabs.

Quickstart

1. Copier l'exemple d'env et remplir les variables :

```bash
cp .env.example .env.local
# éditer .env.local -> remplir TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, ...
```

2. Installer les dépendances :

```bash
npm install
```

3. Lancer en dev :

```bash
npm run dev
```

Test OAuth local avec ngrok (exemple)

1. Démarrer ngrok pointant sur le port 3000 :

```bash
ngrok http 3000
```

2. Renseigner l'URL publique (ex: https://xxxxx.ngrok-free.app) dans votre application Twitch/Streamlabs comme redirect URI. Mettre cette URL dans `NGROK_URL` si besoin.

Endpoints API (POC)

- GET /api/twitch/auth -> redirige vers l'autorisation Twitch
- POST /api/twitch/token -> échange `code` contre tokens (POC)
- GET /api/twitch/user -> appelle /helix/users avec access_token
- GET /api/twitch/stream -> (POC) appelle /helix/streams
- GET/POST /api/streamlabs/\* -> skeletons

Sécurité

- Ne commitez jamais `.env.local` contenant des secrets.
- Le stockage des tokens est pour le moment en mémoire (POC). Avant prod : utiliser une DB chiffrée.

Notes

Ce repo est minimal et vise à fournir un starter pour la démonstration. Voir README pour steps supplémentaires.
