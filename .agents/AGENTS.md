# IoT Mesurable - Frontend Nuxt App

Dashboard IoT construit avec Nuxt 3 pour visualiser les données des modules en temps réel.

## Stack technique

- **Framework** : Nuxt 3
- **Styling** : TailwindCSS
- **API client** : Orval (types générés depuis Swagger)
- **Real-time** : Socket.IO client
- **Lang** : TypeScript
- **Linting** : ESLint + Prettier
- **Tests** : Vitest

## Ports et URLs

| Service | URL dev | URL prod |
|---------|---------|----------|
| Frontend | http://localhost:3000 | via Nginx :80 |
| API Backend | http://localhost:3001 | via Nginx /api |
| Swagger | http://localhost:3001/documentation | — |

## Génération des types API

```bash
npm run gen:api    # Génère depuis le Swagger du backend
```

⚠️ Le backend doit tourner pour générer les types.

## Bonnes pratiques

- Toujours utiliser les types générés par Orval (pas de types manuels pour l'API)
- Les URLs API en dev passent par le proxy Nuxt (pas de localhost:3001 en dur)
- Utiliser les composables pour la logique réutilisable
- i18n : fichiers dans `i18n/`

## Structure

```
app/
├── components/      # Composants Vue
├── composables/     # Logique réutilisable
├── layouts/         # Layouts Nuxt
├── pages/           # Pages (file-based routing)
├── plugins/         # Plugins (socket.io, etc.)
└── assets/          # CSS, images
```
