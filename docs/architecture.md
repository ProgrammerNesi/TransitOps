# TransitOps Architecture

TransitOps is implemented as a modular monolith. Each business capability owns its controller, service, validation, and route registration while sharing a Prisma data-access layer.

## Modules

- Auth: login, refresh, logout, current user, JWT verification, RBAC.
- Users: staff account management for Fleet Managers.
- Vehicles: fleet registry and vehicle status machine.
- Drivers: driver profile, license compliance, and driver status machine.
- Trips: dispatch lifecycle and cross-entity validation.
- Maintenance: maintenance records and vehicle shop status synchronization.
- Fuel & Expense: fuel logs, expenses, and vehicle cost inputs.
- Reports: KPI aggregation, analytics, and CSV export.
- Notifications: in-app license-expiry alerts scaffold.

## Data Integrity

The core status changes are performed in Prisma transactions:

- Dispatch updates trip, vehicle, and driver together.
- Complete and cancel restore vehicle and driver availability.
- Opening maintenance moves the vehicle to `IN_SHOP`.
- Closing maintenance restores the vehicle unless retired.

The MySQL schema keeps uniqueness constraints for registration and license numbers and indexes the high-traffic reporting and lookup columns.
