# 🚛 TransitOps

**Smart Transport Operations Platform** — a fleet-management monorepo built for the Odoo Hackathon. Manage vehicles, drivers, trips, maintenance, fuel & expenses, and reporting from a single role-aware API.

![Project Status](https://img.shields.io/badge/status-in%20development-yellow.svg)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20Prisma-blue.svg)
![Database](https://img.shields.io/badge/database-MySQL%208-orange.svg)

## Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Entity Lifecycles](#entity-lifecycles)
- [API Reference](#api-reference)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

## Architecture

TransitOps is a **modular monolith**: one Express application where each business capability (vehicles, drivers, trips, …) owns its own routes, Zod schemas, and service layer, all sharing a single Prisma data-access layer over MySQL.

```mermaid
flowchart LR
    subgraph Client
        FE["React + Vite frontend<br/>(port 5173)"]
    end

    subgraph API["Express API — port 4000"]
        direction TB
        MW["Middleware pipeline<br/>helmet · CORS · JSON body · morgan<br/>rate-limit (auth routes)"]
        AUTH_MW["requireAuth / requireRoles<br/>(JWT access token)"]

        subgraph Modules
            direction LR
            M_AUTH["auth"]
            M_USERS["users"]
            M_VEH["vehicles"]
            M_DRV["drivers"]
            M_TRIP["trips"]
            M_MNT["maintenance"]
            M_FUEL["fuel-expense"]
            M_RPT["reports /<br/>dashboard"]
            M_NTF["notifications"]
        end

        ERR["error middleware<br/>(HttpError → JSON)"]
    end

    PRISMA["Prisma Client"]
    DB[("MySQL 8<br/>transitops")]

    FE -- "REST /api/* + Bearer JWT" --> MW
    MW --> AUTH_MW --> Modules
    Modules --> ERR
    Modules --> PRISMA --> DB
```

**Key design points**

- **JWT auth with refresh rotation** — short-lived access tokens (15 min) + refresh tokens (7 d), signed with separate secrets; `requireRoles(...)` gates per-route RBAC.
- **Transactional state machines** — dispatching a trip updates the trip, vehicle, and driver atomically; completing/cancelling restores availability; opening maintenance flips the vehicle to `IN_SHOP`.
- **Validation at the edge** — every request body/query/param is parsed with Zod before it reaches a service.
- **Audit trail** — mutations record before/after JSON snapshots in `audit_logs`.
- **Env validation** — the server refuses to boot unless all required env vars pass the Zod schema in `backend/src/config/env.ts`.

## Database Schema

Eight Prisma models on MySQL (see [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)):

```mermaid
erDiagram
    users {
        string id PK "uuid"
        string email UK
        string password_hash
        string name
        enum role "FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST"
        boolean is_active
        datetime created_at
    }

    drivers {
        string id PK "uuid"
        string user_id FK, UK "nullable"
        string name
        string license_no UK
        string license_category
        date license_expiry
        string contact_number "nullable"
        decimal safety_score "default 100.0"
        enum status "AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED"
        datetime created_at
    }

    vehicles {
        string id PK "uuid"
        string registration_no UK
        string name_model
        string type
        decimal max_load_capacity
        decimal odometer
        decimal acquisition_cost
        enum status "AVAILABLE | ON_TRIP | IN_SHOP | RETIRED"
        string region "nullable"
        datetime created_at
    }

    trips {
        string id PK "uuid"
        string vehicle_id FK
        string driver_id FK
        string source
        string destination
        decimal cargo_weight
        decimal planned_distance
        decimal actual_distance "nullable"
        decimal revenue "nullable"
        enum status "DRAFT | DISPATCHED | COMPLETED | CANCELLED"
        datetime dispatched_at "nullable"
        datetime completed_at "nullable"
        datetime cancelled_at "nullable"
    }

    maintenance_logs {
        string id PK "uuid"
        string vehicle_id FK
        string service_type
        decimal cost
        enum status "OPEN | CLOSED"
        text notes "nullable"
        datetime started_at
        datetime closed_at "nullable"
    }

    fuel_logs {
        string id PK "uuid"
        string vehicle_id FK
        string trip_id FK "nullable"
        decimal liters
        decimal cost
        date date
    }

    expenses {
        string id PK "uuid"
        string vehicle_id FK
        enum category "TOLL | PARKING | PERMIT | REPAIR | MISC"
        decimal amount
        date date
        text notes "nullable"
    }

    audit_logs {
        string id PK "uuid"
        string actor_id FK "nullable"
        string entity_type
        string entity_id
        string action
        json before_json "nullable"
        json after_json "nullable"
        text reason "nullable"
    }

    users |o--o| drivers : "optional account link"
    users ||--o{ audit_logs : "acts as"
    drivers ||--o{ trips : "drives"
    vehicles ||--o{ trips : "assigned to"
    vehicles ||--o{ maintenance_logs : "serviced by"
    vehicles ||--o{ fuel_logs : "fuels"
    vehicles ||--o{ expenses : "incurs"
    trips |o--o{ fuel_logs : "logs fuel for"
```

Uniqueness is enforced on vehicle `registration_no`, driver `license_no`, and user `email`; hot lookup/report columns (`status`, `license_expiry`, dates, foreign keys) are indexed.

## Entity Lifecycles

```mermaid
stateDiagram-v2
    direction LR
    state "Trip" as T {
        [*] --> DRAFT
        DRAFT --> DISPATCHED : dispatch
        DISPATCHED --> COMPLETED : complete
        DISPATCHED --> CANCELLED : cancel
        DRAFT --> CANCELLED : cancel
    }
```

```mermaid
stateDiagram-v2
    direction LR
    state "Vehicle" as V {
        [*] --> AVAILABLE
        AVAILABLE --> ON_TRIP : trip dispatched
        ON_TRIP --> AVAILABLE : trip completed / cancelled
        AVAILABLE --> IN_SHOP : maintenance opened
        IN_SHOP --> AVAILABLE : maintenance closed
        AVAILABLE --> RETIRED : retire
    }
```

Dispatch validates that the vehicle and driver are both `AVAILABLE`, cargo weight fits `max_load_capacity`, and the driver's license is not expired — then updates all three records in one Prisma transaction.

## API Reference

All routes are prefixed with `/api` and (except login/refresh) require `Authorization: Bearer <access token>`. Full request/response details live in [`docs/api-reference.md`](docs/api-reference.md).

| Module | Endpoint | Roles |
|---|---|---|
| **Auth** | `POST /auth/login` · `POST /auth/refresh` | public (rate-limited) |
| | `POST /auth/logout` · `GET /auth/me` | any authenticated |
| **Users** | `GET /users` · `POST /users` · `PATCH /users/:id/status` | Fleet Manager |
| **Vehicles** | `GET /vehicles` · `GET /vehicles/:id` | any authenticated |
| | `POST /vehicles` · `PUT /vehicles/:id` · `PATCH /vehicles/:id/status` | Fleet Manager |
| | `GET /vehicles/:id/cost-summary` | Fleet Manager, Financial Analyst |
| **Drivers** | `GET /drivers` · `GET /drivers/:id` | any authenticated |
| | `GET /drivers/expiring-licenses` | Safety Officer, Fleet Manager |
| | `POST /drivers` · `PUT /drivers/:id` | Fleet Manager, Safety Officer |
| | `PATCH /drivers/:id/status` | Safety Officer |
| **Trips** | `GET /trips` · `GET /trips/:id` | any authenticated |
| | `POST /trips` · `POST /trips/:id/dispatch` · `POST /trips/:id/complete` | Driver, Fleet Manager |
| | `POST /trips/:id/cancel` | Fleet Manager |
| **Maintenance** | `GET /maintenance` | any authenticated |
| | `POST /maintenance` · `PATCH /maintenance/:id/close` | Fleet Manager |
| **Fuel & Expenses** | `GET /fuel-logs` · `GET /expenses` | any authenticated |
| | `POST /fuel-logs` · `POST /expenses` | Fleet Manager, Driver |
| **Dashboard** | `GET /dashboard/kpis` | any authenticated |
| **Reports** | `GET /reports/fuel-efficiency` · `/fleet-utilization` · `/operational-cost` · `/vehicle-roi` · `/export` (CSV) | Fleet Manager, Financial Analyst |
| **Notifications** | `GET /notifications` (license-expiry alerts) | any authenticated |

## Role-Based Access Control

| Capability | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|:---:|:---:|:---:|:---:|
| Manage staff accounts | ✅ | — | — | — |
| Create / edit vehicles | ✅ | — | — | — |
| Vehicle cost summary | ✅ | — | — | ✅ |
| Create / edit drivers | ✅ | — | ✅ | — |
| Suspend / reinstate drivers | — | — | ✅ | — |
| Create, dispatch, complete trips | ✅ | ✅ | — | — |
| Cancel trips | ✅ | — | — | — |
| Open / close maintenance | ✅ | — | — | — |
| Log fuel & expenses | ✅ | ✅ | — | — |
| Reports & CSV export | ✅ | — | — | ✅ |

## Getting Started

### Prerequisites

- Node.js ≥ 20 and npm
- MySQL 8 (local install **or** the provided Docker container)

### 1. Clone & install

```bash
git clone https://github.com/ProgrammerNesi/TransitOps.git
cd TransitOps
npm install          # installs backend + frontend workspaces
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, and set long random strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 16 chars — the server validates this at boot).

> **Using the Docker MySQL?** It maps container port 3306 to host **3307**, so point your `DATABASE_URL` at `localhost:3307`:
> `mysql://transitops:transitops@localhost:3307/transitops`

### 3. Start the database (Docker option)

```bash
docker compose -f infra/docker-compose.yml up -d mysql
```

### 4. Migrate & seed

```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:seed       # demo users + sample fleet data
```

### 5. Run

```bash
npm run dev           # backend (4000) + frontend (5173) concurrently
```

- API: `http://localhost:4000/api` — health check at `GET /health`
- Frontend: `http://localhost:5173`

### Demo logins

Seeded accounts (password for all: `Password123!`):

| Role | Email |
|---|---|
| Fleet Manager | `fleet@transitops.local` |
| Driver / Dispatcher | `dispatcher@transitops.local` |
| Safety Officer | `safety@transitops.local` |
| Financial Analyst | `finance@transitops.local` |

### Full Docker stack

```bash
docker compose -f infra/docker-compose.yml up --build
```

Brings up MySQL (host port 3307), the backend (4000), and the frontend served on port 5173.

## Project Structure

```
TransitOps/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 8 models, 6 enums (MySQL)
│   │   └── seed.ts              # demo users + sample data
│   └── src/
│       ├── app.ts               # Express app: middleware + route mounting
│       ├── server.ts            # boot + graceful shutdown
│       ├── config/env.ts        # Zod-validated environment
│       ├── common/              # auth (JWT/RBAC), validation, errors, audit
│       ├── lib/                 # prisma client, pino logger
│       └── modules/             # one folder per domain:
│           ├── auth/            #   routes + zod schemas + service
│           ├── users/
│           ├── vehicles/
│           ├── drivers/
│           ├── trips/
│           ├── maintenance/
│           ├── fuel-expense/
│           ├── reports/         # dashboard KPIs + analytics + CSV export
│           └── notifications/
├── frontend/                    # React 19 + Vite (initial scaffold)
├── infra/docker-compose.yml     # mysql + backend + frontend
└── docs/                        # architecture, API reference, runbook
```

> **Note:** the frontend is currently the Vite starter scaffold; the backend contains the full domain implementation.

## Documentation

- [Architecture](docs/architecture.md) — module breakdown and data-integrity rules
- [API Reference](docs/api-reference.md) — request/response details per endpoint
- [Runbook](docs/runbook.md) — operational procedures
- [Manual Verification](docs/manual-verification.md) — QA checklist
- [Implementation Checklist](docs/implementation-checklist.md)
- [Contributing](Contribution.md)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript |
| Backend | Node.js, Express 4, TypeScript (ESM) |
| Database | MySQL 8 via Prisma ORM |
| Auth | JWT (access + refresh) · bcrypt · role-based middleware |
| Validation | Zod (requests **and** environment) |
| Security | helmet, CORS allow-list, rate limiting on auth |
| Observability | morgan (HTTP), pino (app logs), DB audit trail |
| Infra | Docker Compose, npm workspaces |
