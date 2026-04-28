# Docker

<!-- NOTE: Mettre à jour ce fichier à chaque ajout de service (front, db, osint-service, job-runner) -->

Le `docker-compose.yml` est à la racine du monorepo et orchestre tous les services de l'application.

## Services actuels

| Service | Mode | Port |
|---|---|---|
| `api-dev` | NestJS watch (ts-node-dev) | 3000 |
| `api-build` | NestJS compilé (node dist/) | 3000 |
| `front-dev` | Vite dev server (HMR) | 5173 |
| `front-build` | Nginx servant le build statique | 80 |

## Commandes

### Lancer en développement

```bash
docker compose up
```

Lance tous les services par défaut en mode **dev avec watch** — chaque modification dans `src/` redémarre automatiquement le serveur ou déclenche le HMR Vite.

```bash
docker compose up --build
```

Même chose mais **rebuild les images** avant de démarrer. À utiliser après :
- un changement de dépendances (`package.json`)
- un changement de `Dockerfile`
- un changement de `tsconfig.json`

### Lancer en mode build

```bash
docker compose --profile build up
```

Lance les services compilés (`api-build` + `front-build`). Le front est servi par Nginx sur le port 80. Utile pour vérifier que les builds passent avant un merge.

```bash
docker compose --profile build up --build
```

Rebuild les images puis lance les services compilés.

### Autres commandes utiles

```bash
docker compose down             # arrêter et supprimer les containers
docker compose logs api-dev     # voir les logs d'un service
docker compose logs front-dev   # voir les logs du front
docker compose ps               # état des containers
```

## Volumes (mode dev)

En mode dev, le code source est monté en volume — les images n'ont pas besoin d'être rebuildées pour refléter les changements :

| Volume local | Chemin dans le container |
|---|---|
| `./apps/api/src` | `/app/apps/api/src` |
| `./packages` | `/app/packages` |
| `./apps/front/src` | `/app/apps/front/src` |

## Variables d'environnement (front)

Le service `front-dev` reçoit `VITE_API_URL` via le `docker-compose.yml`.  
Pour personnaliser, créer un fichier `.env` à la racine ou dans `apps/front/` :

```env
VITE_API_URL=http://localhost:3000
```

> Les variables Vite doivent commencer par `VITE_` pour être exposées au navigateur.
