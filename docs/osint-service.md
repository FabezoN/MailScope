# OSINT Service

Microservice NestJS isolé responsable de l'analyse OSINT d'une adresse email.  
Il est appelé par le **job-runner** lors du traitement d'une investigation.

## Rôle

Pour un email donné, le service :

1. Extrait le domaine (`user@example.com` → `example.com`)
2. Interroge **Holehe** pour détecter les plateformes où l'email est enregistré
3. Retourne un rapport structuré au job-runner

> Les étapes 2 et 3 sont actuellement des **mocks**. L'intégration réelle est prévue après validation de la communication inter-services.

---

## Démarrage local

```bash
# depuis la racine du monorepo
cd apps/osint-service
pnpm start:dev
```

Le service écoute sur `http://localhost:3001`.

### Variable d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `OSINT_SERVICE_PORT` | Port d'écoute du service | `3001` |

---

## Endpoint

### `POST /osint/email`

Déclenche l'analyse OSINT d'une adresse email.

**Request**

```http
POST http://localhost:3001/osint/email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

| Champ | Type | Règle |
|---|---|---|
| `email` | `string` | Requis. Doit être une adresse email valide. |

**Response `200 OK`**

```json
{
  "email": "test@example.com",
  "domain": "example.com",
  "scannedAt": "2026-05-18T13:02:24.470Z",
  "durationMs": 1,
  "holehe": [
    { "platform": "twitter",   "exists": true,  "emailRecovery": true,  "rateLimit": false },
    { "platform": "instagram", "exists": true,  "emailRecovery": false, "rateLimit": false },
    { "platform": "github",    "exists": false, "emailRecovery": false, "rateLimit": false },
    { "platform": "spotify",   "exists": true,  "emailRecovery": true,  "rateLimit": false },
    { "platform": "linkedin",  "exists": false, "emailRecovery": false, "rateLimit": true  }
  ],
}
```

**Response `400 Bad Request`** — email invalide ou absent

```json
{
  "message": ["email must be an email"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Structure des données

### Résultat Holehe

| Champ | Type | Description |
|---|---|---|
| `platform` | `string` | Nom de la plateforme scannée |
| `exists` | `boolean` | L'email est enregistré sur cette plateforme |
| `emailRecovery` | `boolean` | L'email est utilisé comme adresse de récupération |
| `rateLimit` | `boolean` | La plateforme a retourné une limite de taux (résultat non fiable) |

> Les entrées avec `rateLimit: true` sont conservées dans la réponse mais **exclues du scoring** car non fiables.

---

## Architecture interne

```
src/
├── main.ts                          # Bootstrap NestJS, port 3001
├── app.module.ts                    # Racine : importe OsintModule
└── modules/osint/
    ├── osint.module.ts              # Déclare controller et service
    ├── osint.controller.ts          # Route POST /osint/email
    ├── osint.service.ts             # Logique d'analyse (mock → réel)
    └── dto/
        └── analyze-email.dto.ts     # Validation du payload entrant
```

**Flux d'une requête :**

```
POST /osint/email
      │
      ▼
ValidationPipe         ← rejette automatiquement les emails invalides (400)
      │
      ▼
OsintController        ← reçoit le DTO validé, délègue au service
      │
      ▼
OsintService.analyze() ← extrait le domaine, interroge Holehe
      │
      ▼
JSON 200               ← rapport structuré retourné au job-runner
```

---

## Communication inter-services

Le job-runner appelle ce service via HTTP. La variable d'environnement `OSINT_SERVICE_URL` configure l'URL cible :

| Contexte | Valeur |
|---|---|
| Local | `http://localhost:3001` |
| Docker | `http://osint-service-dev:3001` |

---

## Docker

Le service est inclus dans le `docker-compose.yml` sous les profils `osint-service-dev` et `osint-service-build`.

```bash
# lancer le service seul
docker compose up osint-service-dev

# rebuild avant démarrage
docker compose up osint-service-dev --build
```

En mode dev, le dossier `apps/osint-service/src` est monté en volume : les modifications sont prises en compte sans rebuild de l'image.

---

## Évolutions prévues

| Étape | Description |
|---|---|
| Intégration Holehe | Exécution du CLI Python, parsing des résultats, filtrage `rateLimit` |
| Gestion des erreurs | Timeout, service indisponible, retry |
| Tests unitaires | Parser Holehe, extraction de domaine |
