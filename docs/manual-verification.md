# Manual Verification Checklist

Use this when you want to verify the project without automated tests.

## 1. Environment Check

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:5173`.

## 2. Login And Roles

Use password `Password123!` for every seeded account.

- Login as `fleet@transitops.local`; confirm Dashboard, Vehicles, Drivers, Trips, Maintenance, and Reports are visible.
- Login as `dispatcher@transitops.local`; confirm trip operations are visible but reports are hidden.
- Login as `safety@transitops.local`; confirm driver management is available.
- Login as `finance@transitops.local`; confirm reports are visible and write actions are not available.

## 3. Vehicle Registry

- Add a vehicle with a unique registration number.
- Try adding the same registration number again; the API should reject it.
- Retire an available vehicle; its status should change to `RETIRED`.

## 4. Driver Management

- Add a driver with a future license expiry date.
- Try adding the same license number again; the API should reject it.
- Login as Safety Officer and suspend/reinstate a driver.

## 5. Trip Lifecycle

- Create a draft trip using an available vehicle and available driver.
- Dispatch the trip; vehicle and driver should become `ON_TRIP`.
- Confirm that same vehicle and driver disappear from available trip selectors.
- Complete the trip with final odometer, actual distance, fuel, fuel cost, and revenue.
- Confirm vehicle and driver return to `AVAILABLE`.

## 6. Business Rule Checks

- Try creating a trip with cargo weight greater than vehicle capacity; it should fail.
- Try dispatching a trip with an unavailable vehicle or driver; it should fail.
- Try completing a trip with final odometer less than current odometer; it should fail.

## 7. Maintenance

- Open maintenance for an available vehicle.
- Confirm vehicle status changes to `IN_SHOP`.
- Confirm that vehicle is not available for trip dispatch.
- Close maintenance.
- Confirm vehicle status returns to `AVAILABLE`.

## 8. Reports

- Open Reports as Fleet Manager or Financial Analyst.
- Check Fuel Efficiency, Fleet Utilization, Operational Cost, and Vehicle ROI.
- Export CSV and confirm a CSV file downloads.

## 9. Dashboard

- Check KPI cards before and after dispatch/completion/maintenance.
- Use type, status, and region filters.
- Confirm values update after operational changes.
