# Reine Univers Business

Monorepo e-commerce viande fraîche :

- **Front** — Nuxt 3 (`apps/web`)
- **API** — NestJS (`apps/api`)
- **DB** — PostgreSQL + Prisma

## Prérequis

- Node.js 20+
- Docker (pour PostgreSQL)

## Démarrage local

```bash
# 1. Base de données
npm run db:up

# 2. Dépendances (si besoin)
npm install

# 3. Migrations + seed catalogue
npm run db:migrate
npm run db:seed

# 4. API + front
npm run dev
```

- Front : http://localhost:3000  
- API : http://localhost:3001  

Postgres écoute sur le port **5433** (voir `docker-compose.yml`).

## Scripts utiles

| Script | Description |
|--------|-------------|
| `npm run dev` | API + Nuxt en parallèle |
| `npm run dev:api` | Nest uniquement |
| `npm run dev:web` | Nuxt uniquement |
| `npm run db:up` | Démarre Postgres |
| `npm run db:seed` | Remplit le catalogue |
| `npm run build` | Build API + front |

## Variables d’environnement

`apps/api/.env` :

```
DATABASE_URL=postgresql://reine:reine@localhost:5433/reine_univers?schema=public
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

`apps/web/.env` :

```
NUXT_PUBLIC_API_URL=http://localhost:3001
```
