# Local Runbook

## Start Local Database

```bash
docker compose -f infra/docker-compose.yml up mysql -d
```

## Apply Schema

```bash
npm run db:generate
npm run db:migrate
```

## Seed Demo Data

```bash
npm run db:seed
```

## Start Development Servers

```bash
npm run dev
```

## Health Check

```bash
curl http://localhost:4000/health
```
