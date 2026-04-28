# Docker

<!-- NOTE: Mettre à jour ce fichier à chaque ajout de service (front, db, osint-service, job-runner) -->

Le `docker-compose.yml` est à la racine du monorepo et orchestre tous les services de l'application.

## Services actuels

| Service | Mode | Port |
|---|---|---|
| `api-dev` | NestJS watch (ts-node-dev) | 3000 |
| `api-build` | NestJS compilé (node dist/) | 3000 |

## Commandes

### Lancer en développement

```bash
docker compose up
```

Lance tous les services par défaut en mode **dev avec watch** — chaque modification dans `src/` redémarre automatiquement le serveur.

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

Lance les services compilés (TypeScript → JavaScript). Utile pour vérifier que le build passe avant un merge.

```bash
docker compose --profile build up --build
```

Rebuild les images puis lance les services compilés.

### Autres commandes utiles

```bash
docker compose down          # arrêter et supprimer les containers
docker compose logs api-dev  # voir les logs d'un service
docker compose ps            # état des containers
```

## Volumes (mode dev)

En mode dev, le code source est monté en volume — les images n'ont pas besoin d'être rebuildées pour refléter les changements :

| Volume local | Chemin dans le container |
|---|---|
| `./apps/api/src` | `/app/apps/api/src` |
| `./packages` | `/app/packages` |
