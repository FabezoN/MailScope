# API Reference — Frontend

Toutes les requêtes passent par le **gateway** sur `http://localhost:3000/api/v1`.

Un Swagger interactif est disponible en dev : `http://localhost:3000/api/docs`

---

## Authentification

Les endpoints d'investigation nécessitent un **token JWT** passé en header :

```
Authorization: Bearer <access_token>
```

Le token est obtenu au login/register et doit être stocké côté client (localStorage, cookie, etc.).

---

## Auth

### Créer un compte

```
POST /api/v1/auth/register
```

**Body**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

| Champ | Type | Contrainte |
|---|---|---|
| `email` | string | format email valide |
| `password` | string | 8 caractères minimum |

**Réponse 201**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**Erreurs**
| Code | Raison |
|---|---|
| 400 | Champ manquant ou format invalide |
| 409 | Email déjà utilisé |

---

### Se connecter

```
POST /api/v1/auth/login
```

**Body**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse 200**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**Erreurs**
| Code | Raison |
|---|---|
| 400 | Champ manquant ou format invalide |
| 401 | Identifiants incorrects |

---

## Investigations

> Tous les endpoints ci-dessous requièrent le header `Authorization: Bearer <token>`.

### Lancer une investigation

```
POST /api/v1/investigations
```

**Body**
```json
{
  "email": "cible@gmail.com"
}
```

| Champ | Type | Contrainte |
|---|---|---|
| `email` | string | format email valide |

**Réponse 201** — L'investigation est créée immédiatement en statut `PENDING`. Le traitement est asynchrone : l'analyse OSINT est effectuée en arrière-plan par le job runner.

```json
{
  "id": "275e9a5d-7200-4131-9ca9-30d73828a80d",
  "email": "cible@gmail.com",
  "userId": "uuid-utilisateur",
  "status": "PENDING",
  "result": null,
  "errorMessage": null,
  "createdAt": "2026-06-22T09:41:39.999Z",
  "updatedAt": "2026-06-22T09:41:39.999Z"
}
```

**Erreurs**
| Code | Raison |
|---|---|
| 400 | Email invalide |
| 401 | Token manquant ou expiré |

---

### Lister ses investigations

```
GET /api/v1/investigations
GET /api/v1/investigations?status=COMPLETED
```

**Query params (optionnel)**

| Param | Type | Valeurs possibles |
|---|---|---|
| `status` | string | `PENDING` · `PROCESSING` · `COMPLETED` · `FAILED` |

**Réponse 200**
```json
[
  {
    "id": "275e9a5d-7200-4131-9ca9-30d73828a80d",
    "email": "cible@gmail.com",
    "userId": "uuid-utilisateur",
    "status": "COMPLETED",
    "result": { ... },
    "errorMessage": null,
    "createdAt": "2026-06-22T09:41:39.999Z",
    "updatedAt": "2026-06-22T09:41:40.090Z"
  }
]
```

---

### Récupérer une investigation

```
GET /api/v1/investigations/:id
```

**Réponse 200** — Retourne l'investigation complète avec son résultat une fois terminée.

```json
{
  "id": "275e9a5d-7200-4131-9ca9-30d73828a80d",
  "email": "cible@gmail.com",
  "userId": "uuid-utilisateur",
  "status": "COMPLETED",
  "result": {
    "email": "cible@gmail.com",
    "domain": "gmail.com",
    "scannedAt": "2026-06-22T09:41:40.083Z",
    "durationMs": 29,
    "score": {
      "value": 54,
      "level": "MEDIUM",
      "reasons": [
        "3 compte(s) public(s) détecté(s) : twitter, instagram, spotify",
        "Email utilisé comme récupération sur : twitter, spotify"
      ],
      "recommendations": [
        "Limitez la réutilisation de cet email sur des plateformes publiques",
        "Désactivez la récupération par email sur les plateformes non critiques"
      ]
    },
    "holehe": [
      { "platform": "twitter",   "exists": true,  "emailRecovery": true,  "rateLimit": false },
      { "platform": "instagram", "exists": true,  "emailRecovery": false, "rateLimit": false },
      { "platform": "github",    "exists": false, "emailRecovery": false, "rateLimit": false },
      { "platform": "spotify",   "exists": true,  "emailRecovery": true,  "rateLimit": false },
      { "platform": "linkedin",  "exists": false, "emailRecovery": false, "rateLimit": true  }
    ]
  },
  "errorMessage": null,
  "createdAt": "2026-06-22T09:41:39.999Z",
  "updatedAt": "2026-06-22T09:41:40.090Z"
}
```

**Erreurs**
| Code | Raison |
|---|---|
| 401 | Token manquant ou expiré |
| 404 | Investigation introuvable ou n'appartient pas à l'utilisateur |

---

### Relancer une investigation

```
POST /api/v1/investigations/:id/retry
```

Remet l'investigation à `PENDING` et relance l'analyse. Utilisable uniquement si le statut est `COMPLETED` ou `FAILED`.

**Réponse 201** — L'investigation remise à zéro.

```json
{
  "id": "275e9a5d-7200-4131-9ca9-30d73828a80d",
  "email": "cible@gmail.com",
  "status": "PENDING",
  "result": null,
  "errorMessage": null,
  ...
}
```

**Erreurs**
| Code | Raison |
|---|---|
| 400 | Investigation déjà `PENDING` ou `PROCESSING` |
| 404 | Investigation introuvable |

---

### Supprimer une investigation

```
DELETE /api/v1/investigations/:id
```

**Réponse 204** — Pas de body.

**Erreurs**
| Code | Raison |
|---|---|
| 401 | Token manquant ou expiré |
| 404 | Investigation introuvable |

---

## Cycle de vie d'une investigation

```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED
```

| Statut | Description |
|---|---|
| `PENDING` | En attente de traitement par le job runner |
| `PROCESSING` | Analyse OSINT en cours |
| `COMPLETED` | Terminée — `result` contient le rapport complet |
| `FAILED` | Erreur — `errorMessage` contient la raison |

Le traitement est asynchrone. Après un `POST /investigations`, il faut **poller** `GET /investigations/:id` jusqu'à ce que le statut soit `COMPLETED` ou `FAILED`. En pratique l'analyse prend moins d'une seconde.

---

## Structure du résultat (`result`)

Disponible uniquement quand `status === "COMPLETED"`.

| Champ | Type | Description |
|---|---|---|
| `email` | string | Email analysé |
| `domain` | string | Domaine extrait de l'email |
| `scannedAt` | ISO 8601 | Date/heure de l'analyse |
| `durationMs` | number | Durée de l'analyse en ms |
| `score.value` | number (0–100) | Score de risque global |
| `score.level` | string | `LOW` · `MEDIUM` · `HIGH` · `CRITICAL` |
| `score.reasons` | string[] | Facteurs ayant contribué au score |
| `score.recommendations` | string[] | Actions recommandées |
| `holehe` | array | Présence sur plateformes (voir ci-dessous) |

**Entrée `holehe`**

| Champ | Type | Description |
|---|---|---|
| `platform` | string | Nom de la plateforme |
| `exists` | boolean | Compte trouvé avec cet email |
| `emailRecovery` | boolean | Email utilisé comme récupération |
| `rateLimit` | boolean | Résultat incertain (rate limit atteint) |

---

## Niveaux de risque

| Level | Score | Signification |
|---|---|---|
| `LOW` | 0 – 30 | Faible exposition |
| `MEDIUM` | 31 – 60 | Exposition modérée |
| `HIGH` | 61 – 85 | Exposition importante |
| `CRITICAL` | 86 – 100 | Exposition critique |
