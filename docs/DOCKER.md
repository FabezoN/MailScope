# Docker

<!-- NOTE: Mettre à jour ce fichier à chaque ajout de service (front, osint-service, job-runner) -->

Le `docker-compose.yml` est à la racine du monorepo et orchestre tous les services de l'application.

## Prérequis

Créer un fichier `.env` à la racine du monorepo (copier depuis `.env.example`) :

```bash
cp .env.example .env
```

Le `.env` n'est pas commité. Les variables configurées :

| Variable | Description | Valeur par défaut |
|---|---|---|
| `DB_HOST` | Hostname PostgreSQL | `db` (nom du service Docker) |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_USERNAME` | Utilisateur PostgreSQL | `mailscope` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `mailscope` |
| `DB_NAME` | Nom de la base de données | `mailscope` |
| `NODE_ENV` | Environnement Node | `development` |

## Services

| Service | Mode | Port |
|---|---|---|
| `db` | PostgreSQL 16 | 5432 |
| `gateway-dev` | NestJS watch (ts-node-dev) | 3000 |
| `gateway-build` | NestJS compilé (node dist/) | 3000 |
| `front-dev` | Vite dev server (HMR) | 5173 |
| `front-build` | Nginx servant le build statique | 80 |
| `job-runner-dev` | Worker NestJS watch (tsx watch) | - |
| `job-runner-build` | Worker compilé (node dist/) | - |

## Commandes

### Lancer en développement

```bash
docker compose up
```

Lance les services par défaut en mode **dev avec watch** :
- `gateway-dev`
- `job-runner-dev`

Chaque modification dans `src/` redémarre automatiquement le service concerné.

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

Lance les services compilés (TypeScript → JavaScript) :
- `gateway-build`
- `job-runner-build`

Utile pour vérifier que le build passe avant un merge.

```bash
docker compose --profile build up --build
```

Rebuild les images puis lance les services compilés.

### Autres commandes utiles

```bash
docker compose down          # arrêter et supprimer les containers
docker compose logs gateway-dev  # voir les logs d'un service
docker compose logs job-runner-dev
docker compose ps            # état des containers
```

## Volumes (mode dev)

En mode dev, le code source est monté en volume — les images n'ont pas besoin d'être rebuildées pour refléter les changements :

| Volume local | Chemin dans le container |
|---|---|
| `./apps/gateway/src` | `/app/apps/gateway/src` |
| `./apps/job-runner/src` | `/app/apps/job-runner/src` |
| `./packages` | `/app/packages` |
| `./apps/front/src` | `/app/apps/front/src` |

## Variables d'environnement (front)

Le service `front-dev` reçoit `VITE_API_URL` via le `docker-compose.yml`.  
Pour personnaliser, créer un fichier `.env` à la racine ou dans `apps/front/` :

```env
VITE_API_URL=http://localhost:3000
```

> Les variables Vite doivent commencer par `VITE_` pour être exposées au navigateur.

## Job runner

Le `job-runner` est branché dans le `docker-compose.yml` avec :
- `job-runner-dev`
- `job-runner-build`

