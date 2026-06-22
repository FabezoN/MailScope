# Tests — Mailscope

## Stack technique

- **Jest** — runner et assertions
- **ts-jest** — transpilation TypeScript pour Jest
- **@nestjs/testing** — module de test NestJS (injection de dépendances mockée)
- **Supertest** — requêtes HTTP sur une instance NestJS en mémoire (E2E)

Aucune base de données ni Redis n'est requis pour lancer les tests : toutes les dépendances d'infrastructure sont mockées.

---

## Lancer les tests

```bash
# Tous les services depuis la racine
pnpm test

# Par service
pnpm --filter @mailscope/investigations-service test
pnpm --filter @mailscope/job-runner test
```

---

## investigations-service

### Tests unitaires — `InvestigationsService`

**Fichier :** `src/modules/investigations/investigations.service.spec.ts`

Dépendances mockées : `Repository<Investigation>`, `Repository<Report>`, `Queue` (BullMQ).

| Méthode | Cas testé |
|---|---|
| `create` | Sauvegarde en BDD et enqueue le job `analyze` avec `investigationId` + `email` |
| `findAllByUser` | Retourne toutes les investigations sans filtre de statut |
| `findAllByUser` | Filtre par statut quand `query.status` est fourni |
| `findOne` | Retourne l'investigation avec la relation `report` |
| `findOne` | Lève `NotFoundException` si l'investigation n'existe pas |
| `remove` | Supprime l'investigation existante |
| `remove` | Lève `NotFoundException` si l'investigation n'existe pas |
| `retry` | Supprime le rapport lié, remet le statut à `PENDING`, re-enqueue depuis `COMPLETED` |
| `retry` | Re-enqueue depuis `FAILED` |
| `retry` | Lève `BadRequestException` si le statut est `PROCESSING` |
| `retry` | Lève `BadRequestException` si le statut est `PENDING` |
| `retry` | Lève `NotFoundException` si l'investigation n'existe pas |
| `updateStatus` | Met à jour le statut seul (sans résultat ni erreur) |
| `updateStatus` | Met à jour avec `result` quand fourni |
| `updateStatus` | Met à jour avec `errorMessage` quand fourni |

### Tests E2E — `InvestigationsController`

**Fichier :** `test/investigations.e2e-spec.ts`

Instance NestJS complète en mémoire via `@nestjs/testing` + Supertest. Les repositories et la queue sont mockés au niveau du module.

| Endpoint | Cas testé | Code attendu |
|---|---|---|
| `POST /investigations` | Email valide → investigation créée en `PENDING` + job enqueué | 201 |
| `POST /investigations` | Email invalide (format incorrect) | 400 |
| `GET /investigations` | Retourne la liste des investigations de l'utilisateur | 200 |
| `GET /investigations?status=COMPLETED` | Filtre par statut via query param | 200 |
| `GET /investigations/:id` | Retourne l'investigation par id | 200 |
| `GET /investigations/:id` | Investigation introuvable | 404 |
| `PATCH /investigations/:id/status` | Met à jour le statut en `COMPLETED` avec résultat | 200 |
| `PATCH /investigations/:id/status` | Statut invalide dans le body | 400 |
| `POST /investigations/:id/retry` | Re-enqueue une investigation `FAILED` | 201 |
| `POST /investigations/:id/retry` | Investigation déjà `PROCESSING` | 400 |
| `DELETE /investigations/:id` | Supprime l'investigation | 204 |
| `DELETE /investigations/:id` | Investigation introuvable | 404 |

---

## job-runner

### Tests unitaires — `AnalysisProcessor`

**Fichier :** `src/analysis/analysis.processor.spec.ts`

Dépendances mockées : `HttpService`, `ConfigService`.

| Cas testé | Vérification |
|---|---|
| Job traité avec succès | PATCH `PROCESSING` envoyé avant l'appel à l'osint-service |
| Job traité avec succès | POST `/osint/email` appelé avec l'email du job |
| Job traité avec succès | PATCH `COMPLETED` envoyé avec `result` contenant `holehe`, `leakix` et `score` calculé |
| Échec de l'osint-service | PATCH `FAILED` envoyé avec `errorMessage` |
| Échec de l'osint-service | L'erreur est re-levée après le patch `FAILED` |

---

## Configuration

### Fichiers ajoutés par service

```
apps/investigations-service/
├── jest.config.ts          # configuration Jest
├── tsconfig.test.json      # override module CommonJS pour ts-jest
├── src/modules/investigations/
│   └── investigations.service.spec.ts
└── test/
    └── investigations.e2e-spec.ts

apps/job-runner/
├── jest.config.ts          # configuration Jest (+ moduleNameMapper @mailscope/utils)
├── tsconfig.test.json      # override module CommonJS + types jest
└── src/analysis/
    └── analysis.processor.spec.ts
```

### Dépendances de développement ajoutées

**investigations-service**
- `jest`, `ts-jest`, `@types/jest`
- `@nestjs/testing`
- `supertest`, `@types/supertest`

**job-runner**
- `jest`, `ts-jest`, `@types/jest`
- `@nestjs/testing`
