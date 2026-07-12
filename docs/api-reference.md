# API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

## Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Users

- `GET /users`
- `POST /users`
- `PATCH /users/:id/status`

## Vehicles

- `GET /vehicles`
- `GET /vehicles/:id`
- `POST /vehicles`
- `PUT /vehicles/:id`
- `PATCH /vehicles/:id/status`
- `GET /vehicles/:id/cost-summary`

## Drivers

- `GET /drivers`
- `GET /drivers/:id`
- `POST /drivers`
- `PUT /drivers/:id`
- `PATCH /drivers/:id/status`
- `GET /drivers/expiring-licenses?days=30`

## Trips

- `GET /trips`
- `GET /trips/:id`
- `POST /trips`
- `POST /trips/:id/dispatch`
- `POST /trips/:id/complete`
- `POST /trips/:id/cancel`

## Maintenance

- `GET /maintenance`
- `POST /maintenance`
- `PATCH /maintenance/:id/close`

## Fuel And Expenses

- `GET /fuel-logs`
- `POST /fuel-logs`
- `GET /expenses`
- `POST /expenses`

## Reporting

- `GET /dashboard/kpis`
- `GET /reports/fuel-efficiency`
- `GET /reports/fleet-utilization`
- `GET /reports/operational-cost`
- `GET /reports/vehicle-roi`
- `GET /reports/export?report=fuel-efficiency`
