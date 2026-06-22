# Job Runner

Service de traitement asynchrone des analyses email via BullMQ.

## Rôle

Le job-runner consomme les jobs de la queue BullMQ `email-analysis` publiés par `investigations-service`. Pour chaque job il :

1. Passe l'investigation en `PROCESSING`
2. Appelle `osint-service` pour récupérer les données Holehe et LeakIX
3. Calcule le score de risque (`@mailscope/utils`)
4. Met à jour l'investigation en `COMPLETED` avec le rapport complet
5. En cas d'erreur, passe en `FAILED` et relance (retry automatique BullMQ)

## Architecture

```
investigations-service  →  BullMQ (Redis)  →  job-runner
                                                   │
                                          osint-service (HTTP)
                                                   │
                                          @mailscope/utils (score)
                                                   │
                                          investigations-service PATCH /status
```

## Queue

- **Nom** : `email-analysis`
- **Job name** : `analyze`
- **Payload** : `{ investigationId: string, email: string }`

## Scoring (`packages/utils/src/scoring.ts`)

Algorithme pur (sans dépendances NestJS), importable partout.

| Critère | Points |
|---------|--------|
| Compte Holehe détecté (`exists && !rateLimit`) | +8 par compte (max 40) |
| Email utilisé comme récupération | +5 par plateforme (max 15) |
| Exposition LeakIX | +10 par entrée (max 20) |
| Port sensible exposé (22, 3306, 5432, 6379…) | +8 par port (max 24) |
| Sévérité `high` | +10 |
| Sévérité `critical` | +15 |

Score clampé à **100**.

| Niveau | Plage |
|--------|-------|
| `LOW` | 0 – 30 |
| `MEDIUM` | 31 – 60 |
| `HIGH` | 61 – 85 |
| `CRITICAL` | 86 – 100 |

## Résultat stocké

Le champ `result` (JSONB) de l'investigation contient :

```json
{
  "email": "target@example.com",
  "domain": "example.com",
  "scannedAt": "2026-06-22T10:00:00.000Z",
  "durationMs": 1234,
  "holehe": [...],
  "leakix": [...],
  "score": {
    "value": 73,
    "level": "HIGH",
    "reasons": ["3 compte(s) public(s) détecté(s) : twitter, instagram, spotify", "..."],
    "recommendations": ["Limitez la réutilisation de cet email...", "..."]
  }
}
```

## Endpoint interne

`PATCH /investigations/:id/status` sur `investigations-service` (réseau Docker interne uniquement).

```json
{ "status": "COMPLETED", "result": { ... } }
{ "status": "FAILED", "errorMessage": "..." }
```

## Variables d'environnement

| Variable | Valeur Docker | Description |
|----------|---------------|-------------|
| `REDIS_HOST` | `redis` | Hôte Redis |
| `REDIS_PORT` | `6379` | Port Redis |
| `INVESTIGATIONS_SERVICE_URL` | `http://investigations-service-dev:3003` | URL interne |
| `OSINT_SERVICE_URL` | `http://osint-service-dev:3001` | URL interne |
