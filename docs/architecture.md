# Architecture MailScope — Communication inter-services

## Vue d'ensemble

MailScope est une application en microservices. Le frontend ne parle qu'au **gateway**. Aucun microservice interne n'est exposé directement au navigateur.

```
Browser (Vite React)
        │  HTTP  (port 3000)
        ▼
    GATEWAY           ← point d'entrée unique, JWT obligatoire
    /api/v1/...
        │
        ├── auth-service         (port 3002)  PostgreSQL
        ├── investigations-service (port 3003) PostgreSQL + BullMQ
        │                                          │
        │                                     BullMQ (Redis)
        │                                          │
        │                                     job-runner  (worker sans port HTTP)
        │                                          │ HTTP
        │                                     osint-service  (port 3001)
        │                                          │
        │                                     ┌────┴─────────────────┐
        │                                     Holehe (Python)     XposedOrNot API
        │                                                          (api.xposedornot.com)
        └── health check → auth-service, osint-service, investigations-service
```

---

## Services

| Service | Port | Rôle | Base de données |
|---------|------|------|-----------------|
| `gateway` | 3000 | Point d'entrée public — proxy JWT, expose `/api/v1` | — |
| `auth-service` | 3002 | Register / Login / Profil | PostgreSQL |
| `investigations-service` | 3003 | CRUD investigations, publication BullMQ | PostgreSQL |
| `osint-service` | 3001 | Analyse OSINT (Holehe + XposedOrNot) | — |
| `job-runner` | — | Worker BullMQ — consomme la queue `email-analysis` | — |
| `front` | 5173 (dev) | Interface React | — |

---

## Flux complet d'une investigation

### 1. Authentification

```
Browser
  POST /api/v1/auth/login  { email, password }
        │
        ▼
    GATEWAY  (aucune validation ici — transmet directement)
        │  POST http://auth-service:3002/auth/login
        ▼
    auth-service  (bcryptjs compare, signe JWT)
        │  { access_token, user }
        ▼
    GATEWAY → Browser
```

Le JWT est stocké en `localStorage`. Toutes les requêtes suivantes l'envoient dans `Authorization: Bearer <token>`.

---

### 2. Création d'une investigation

```
Browser
  POST /api/v1/investigations  { email }   + Bearer JWT
        │
        ▼
    GATEWAY  (JwtAuthGuard → décode le JWT)
        │  POST http://investigations-service:3003/investigations
        │  Headers: x-user-id, x-user-email, x-user-role
        ▼
    investigations-service
        ├── crée Investigation { status: PENDING } en PostgreSQL
        └── publie job dans BullMQ queue "email-analysis"
               { investigationId, email }
        │
        ▼
    GATEWAY → Browser  { id, status: "PENDING", ... }
```

---

### 3. Traitement asynchrone (job-runner)

```
    BullMQ (Redis)  ──► job-runner (worker)
                              │
                              │ PATCH http://investigations-service:3003/investigations/:id/status
                              │       { status: "PROCESSING" }
                              │
                              │ POST http://osint-service:3001/osint/email  { email }
                              │
                              ▼
                        osint-service
                              ├── spawn Python → holehe_runner.py (120+ modules)
                              │     → résultats Holehe (exists, emailRecovery, rateLimit)
                              │
                              └── fetch https://api.xposedornot.com/v1/breach-analytics?email=...
                                    → fuites de données (breach, domain, passwordRisk, ...)
                              │
                              ▼
                        { holehe: [...], xon: [...] }
                              │
                              ▼
                        job-runner  (reçoit le résultat OSINT)
                              ├── computeScore(holehe, xon)  via @mailscope/utils
                              │
                              │ PATCH http://investigations-service:3003/investigations/:id/status
                              │       { status: "COMPLETED", result: { holehe, xon, score, ... } }
                              ▼
                        investigations-service → sauvegarde dans PostgreSQL (champ result JSONB)
```

En cas d'erreur : `status: "FAILED"` + `errorMessage` stockés. BullMQ effectue des retries automatiques.

---

### 4. Polling du statut par le frontend

Le dashboard interroge le statut toutes les **1200 ms** pendant l'analyse :

```
Browser  GET /api/v1/investigations/:id   + Bearer JWT
        │
        ▼
    GATEWAY → investigations-service
        │  retourne { status, result, ... }
        ▼
    Browser  met à jour la barre de progression et le terminal
             PENDING     → 10 %
             PROCESSING  → 45 % (animation pulse)
             COMPLETED   → 100 %
             FAILED      → arrêt
```

---

### 5. Lecture d'un rapport

```
Browser  GET /api/v1/investigations/:id   + Bearer JWT
        │
        ▼
    GATEWAY → investigations-service
        │  { status: "COMPLETED", result: { holehe, xon, score } }
        ▼
    Browser  affiche InvestigationReport
             ├── score + niveau de risque
             ├── HOLEHE — PLATFORMS  (comptes trouvés, recovery, rateLimit)
             ├── XPOSEDORNOT — DATA BREACHES  (fuites, records, passwordRisk)
             ├── RISK FACTORS  (raisons du score)
             └── RECOMMENDATIONS
```

---

### 6. Health check

```
Browser  GET /api/v1/health  (toutes les 30 s, sans auth)
        │
        ▼
    GATEWAY  (@nestjs/terminus)
        ├── pingCheck("auth-service",           http://auth-service:3002/health)
        ├── pingCheck("osint-service",          http://osint-service:3001/health)
        └── pingCheck("investigations-service", http://investigations-service:3003/health)
        │
        ▼
    { status: "ok"|"error", details: { "auth-service": {...}, ... } }
        │
        ▼
    Dashboard → idle terminal affiche ONLINE / OFFLINE par service
                XposedOrNot est une API externe → toujours affiché ONLINE (EXTERNAL)
```

---

## Sécurité inter-services

Le gateway est le seul service exposé publiquement. Les microservices internes ne valident **pas** le JWT — ils font confiance aux headers transmis par le gateway :

| Header | Valeur | Utilisé par |
|--------|--------|-------------|
| `x-user-id` | UUID de l'utilisateur | investigations-service, auth-service |
| `x-user-email` | Email de l'utilisateur | investigations-service |
| `x-user-role` | Rôle (`USER`/`ADMIN`) | investigations-service |

Ces headers ne sont jamais accessibles depuis le navigateur — ils sont ajoutés côté gateway après validation du JWT.

---

## Scoring (`@mailscope/utils`)

Package partagé importé par le **job-runner** uniquement. Fonction pure, sans dépendances NestJS.

```
computeScore(holehe[], xon[]) → { value: 0-100, level, reasons[], recommendations[] }

Holehe
  +8 par compte trouvé (exists && !rateLimit)   max 40 pts
  +5 par compte avec emailRecovery              max 15 pts

XposedOrNot
  +8 par fuite de données                       max 40 pts
  +5 par fuite avec passwordRisk = "High"       max 15 pts

Niveaux : LOW (0-30) · MEDIUM (31-60) · HIGH (61-85) · CRITICAL (86-100)
```

---

## Réseau Docker

En mode Docker, les services communiquent sur le réseau interne `mailscope-network` via leurs noms de service Docker Compose :

| Variable d'env | Valeur Docker |
|----------------|---------------|
| `AUTH_SERVICE_URL` | `http://auth-service-dev:3002` |
| `OSINT_SERVICE_URL` | `http://osint-service-dev:3001` |
| `INVESTIGATIONS_SERVICE_URL` | `http://investigations-service-dev:3003` |
| `REDIS_HOST` | `redis` |
| `REDIS_PORT` | `6379` |
