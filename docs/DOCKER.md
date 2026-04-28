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
| `api-dev` | NestJS watch (ts-node-dev) | 3000 |
| `api-build` | NestJS compilé (node dist/) | 3000 |

## Commandes

### Lancer en développement

```bash
docker compose up
```

Lance `db` + `api-dev`. L'API démarre après que PostgreSQL soit healthy (healthcheck automatique).

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

Lance `db` + `api-build` (TypeScript compilé).

```bash
docker compose --profile build up --build
```

Rebuild les images puis lance les services compilés.

### Autres commandes utiles

```bash
docker compose down                  # arrêter et supprimer les containers
docker compose down -v               # idem + supprime le volume postgres_data
docker compose logs api-dev          # voir les logs d'un service
docker compose logs -f api-dev       # suivre les logs en temps réel
docker compose ps                    # état des containers
```

## Volumes (mode dev)

En mode dev, le code source est monté en volume — les images n'ont pas besoin d'être rebuildées pour refléter les changements :

| Volume local | Chemin dans le container |
|---|---|
| `./apps/api/src` | `/app/apps/api/src` |
| `./packages` | `/app/packages` |

Les données PostgreSQL sont persistées dans un volume nommé `postgres_data`.
