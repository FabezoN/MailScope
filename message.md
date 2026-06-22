# 📧 MailScope — Cahier des charges

> Plateforme d'investigation OSINT d'adresses email : analyse asynchrone, scoring de risque et rapports détaillés.

---

## 📑 Sommaire

| #  | Section | #  | Section |
|----|---------|----|---------|
| 1  | [Authentification](#1-authentification) | 9  | [Historique utilisateur](#9-historique-utilisateur) |
| 2  | [Analyse d'une adresse email](#2-analyse-dune-adresse-email) | 10 | [Dashboard](#10-dashboard) |
| 3  | [Traitement asynchrone](#3-traitement-asynchrone) | 11 | [Interface front](#11-interface-front) |
| 4  | [OSINT email](#4-osint-email) | 12 | [Sécurité](#12-sécurité) |
| 5  | [Holehe](#5-holehe) | 13 | [DevOps](#13-devops) |
| 6  | [Scoring de risque](#6-scoring-de-risque) | 14 | [Tests](#14-tests) |
| 7  | [Rapport d'investigation](#7-rapport-dinvestigation) | 15 | [Documentation](#15-documentation) |
| 8  | [Historique utilisateur](#8-historique-utilisateur) | 🎯 | [MVP prioritaire](#-mvp-prioritaire) |

---

## 1. Authentification

**👤 L'utilisateur peut :**

- Créer un compte
- Se connecter
- Recevoir un **JWT**
- Accéder à son espace personnel
- Avoir un rôle : `USER` ou `ADMIN`

**🛡️ L'admin peut :**

- Voir toutes les investigations
- Gérer les utilisateurs
- Consulter les erreurs système

---

## 2. Analyse d'une adresse email

L'utilisateur saisit une adresse email. Le système doit :

- ✅ Valider le format de l'email
- 🗂️ Créer une investigation
- ⏳ Mettre le statut à `PENDING`
- 📨 Envoyer un job dans une queue **BullMQ**
- 💬 Afficher à l'utilisateur que l'analyse est en cours

**Statuts possibles :**

```ts
enum InvestigationStatus {
  PENDING,
  PROCESSING,
  COMPLETED,
  FAILED,
}
```

---

## 3. Traitement asynchrone

Le **job-runner** récupère l'investigation et doit :

1. Passer le statut à `PROCESSING`
2. Appeler le microservice **OSINT**
3. Récupérer les résultats **Holehe**
4. Calculer le score de risque
5. Générer un rapport
6. Sauvegarder le rapport en base
7. Passer le statut à `COMPLETED`

> ⚠️ **En cas d'erreur :**
> - Retry automatique
> - Stockage de l'erreur
> - Statut `FAILED`

---

## 4. OSINT email

Le microservice OSINT expose :

```http
POST /osint/email
```

**Payload :**

```json
{
  "email": "test@example.com"
}
```

**Il doit retourner :**

- Les comptes détectés via **Holehe**
- Les plateformes trouvées
- Le domaine de l'email

---

## 5. Holehe

Le système doit détecter si l'email est utilisé sur des plateformes publiques.

**Exemple de résultat attendu :**

```json
{
  "platform": "twitter",
  "exists": true,
  "emailRecovery": true,
  "rateLimit": false
}
```

**Fonctionnalités :**

- [ ] Exécuter Holehe
- [ ] Parser les résultats
- [ ] Ignorer les résultats non fiables
- [ ] Gérer les erreurs
- [ ] Tester le parser

---

## 6. Scoring de risque

Le système génère un score entre **0 et 100**.

**Critères :**

- Nombre de comptes publics trouvés
- Nombre de plateformes différentes

**Niveaux :**

| Niveau | Score | Indicateur |
|--------|-------|:----------:|
| `LOW` | 0 – 30 | 🟢 |
| `MEDIUM` | 31 – 60 | 🟡 |
| `HIGH` | 61 – 85 | 🟠 |
| `CRITICAL` | 86 – 100 | 🔴 |

**Le score doit retourner :**

- Le niveau de risque
- Les raisons du score
- Les recommandations

---

## 7. Rapport d'investigation

Chaque investigation possède un rapport clair contenant :

- 📧 Email analysé
- 🌐 Domaine extrait
- 📊 Score global
- 🚦 Niveau de risque
- 👥 Comptes trouvés
- 🧩 Plateformes détectées
- 💡 Recommandations
- 📅 Date de création
- ⏱️ Durée du scan
- ✔️ Statut final

---

## 8. Historique utilisateur

L'utilisateur peut :

- Voir ses anciennes investigations
- Filtrer par statut
- Ouvrir un rapport
- Relancer une analyse
- Supprimer une investigation

---

## 9. Historique utilisateur

L'utilisateur peut :

- Voir ses anciennes investigations
- Filtrer par statut
- Ouvrir un rapport
- Relancer une analyse
- Supprimer une investigation

---

## 10. Dashboard

Le dashboard affiche :

- 📈 Nombre total d'analyses
- 🔄 Analyses en cours
- ✅ Analyses terminées
- ❌ Analyses échouées
- 🎯 Score moyen
- 🕘 Dernières investigations
- 🚨 Alertes critiques

---

## 11. Interface front

**Pages à prévoir :**

| Route | Description |
|-------|-------------|
| `/login` | Connexion |
| `/register` | Inscription |
| `/dashboard` | Tableau de bord |
| `/investigations` | Liste des investigations |
| `/investigations/:id` | Détail d'un rapport |

**Composants :**

- Formulaire d'analyse email
- Tableau d'historique
- Badge de statut
- Carte de score
- Détail Holehe
- Recommandations
- Loader pendant l'analyse

---

## 12. Sécurité

L'application doit intégrer :

- 🧱 Validation des DTO
- 🔑 Protection JWT
- 👤 Rôles `USER` / `ADMIN`
- 🚦 Rate limiting sur les scans
- 🧼 Sanitization des entrées utilisateur
- 🚫 Aucune clé API exposée côté front
- 🤫 Aucun secret dans les logs
- 🗝️ Variables sensibles dans `.env`
- 🌍 CORS configuré proprement

---

## 13. DevOps

**Le projet doit fournir :**

- `docker-compose.yml`
- Conteneur API
- Conteneur front
- Conteneur job-runner
- Conteneur osint-service
- PostgreSQL
- Redis
- Health checks

**Services attendus :**

| Service | Rôle |
|---------|------|
| `api` | API principale |
| `front` | Interface utilisateur |
| `job-runner` | Traitement asynchrone |
| `osint-service` | Microservice OSINT |
| `postgres` | Base de données |
| `redis` | Cache & queue BullMQ |

---

## 14. Tests

**✅ Tests unitaires obligatoires :**

- Auth
- Création investigation
- Changement de statut
- Scoring
- Parsing Holehe

**🔬 Tests e2e recommandés :**

- Register / login
- Création scan
- Récupération rapport
- Accès interdit sans token

---

## 15. Documentation

**À prévoir dans `/docs` :**

- `architecture.md`
- `api.md`
- `osint-service.md`
- `scoring.md`
- `devops.md`
- `security.md`

**Le `README` doit contenir :**

- Présentation du projet
- Stack technique
- Installation locale
- Lancement Docker
- Variables `.env`
- Commandes utiles
- Architecture
- Endpoints principaux

---

## 🎯 MVP prioritaire

> Pour commencer, le MVP doit contenir :

- [ ] Register / login
- [ ] Création d'une investigation email
- [ ] Queue BullMQ `email-analysis`
- [ ] Job-runner qui traite l'analyse
- [ ] OSINT service avec endpoint `/osint/email`
- [ ] Scoring simple
- [ ] Sauvegarde du rapport
- [ ] Endpoint pour récupérer le rapport
- [ ] Front avec login, dashboard et page rapport
- [ ] Docker avec PostgreSQL + Redis
