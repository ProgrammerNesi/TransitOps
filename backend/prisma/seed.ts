import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { DriverStatus, PrismaClient, UserRole, VehicleStatus } from "@prisma/client";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.example" });
console.log("DATABASE_URL =", process.env.DATABASE_URL);
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "fleet@transitops.local" },
      update: {},
      create: { email: "fleet@transitops.local", name: "Fleet Manager", role: UserRole.FLEET_MANAGER, passwordHash }
    }),
    prisma.user.upsert({
      where: { email: "dispatcher@transitops.local" },
      update: {},
      create: { email: "dispatcher@transitops.local", name: "Dispatcher Alex", role: UserRole.DRIVER, passwordHash }
    }),
    prisma.user.upsert({
      where: { email: "safety@transitops.local" },
      update: {},
      create: { email: "safety@transitops.local", name: "Safety Officer", role: UserRole.SAFETY_OFFICER, passwordHash }
    }),
    prisma.user.upsert({
      where: { email: "finance@transitops.local" },
      update: {},
      create: { email: "finance@transitops.local", name: "Financial Analyst", role: UserRole.FINANCIAL_ANALYST, passwordHash }
    })
  ]);

  const [van, truck, miniTruck] = await Promise.all([
    prisma.vehicle.upsert({
      where: { registrationNo: "VAN-05" },
      update: {},
      create: {
        registrationNo: "VAN-05",
        nameModel: "Tata Ace Van 05",
        type: "Van",
        maxLoadCapacity: 500,
        odometer: 42100,
        acquisitionCost: 850000,
        status: VehicleStatus.AVAILABLE,
        region: "North"
      }
    }),
    prisma.vehicle.upsert({
      where: { registrationNo: "TRK-12" },
      update: {},
      create: {
        registrationNo: "TRK-12",
        nameModel: "Ashok Leyland 12",
        type: "Truck",
        maxLoadCapacity: 3500,
        odometer: 98150,
        acquisitionCost: 2200000,
        status: VehicleStatus.AVAILABLE,
        region: "West"
      }
    }),
    prisma.vehicle.upsert({
      where: { registrationNo: "MINI-21" },
      update: {},
      create: {
        registrationNo: "MINI-21",
        nameModel: "Mahindra Bolero Pickup",
        type: "Mini-Truck",
        maxLoadCapacity: 1200,
        odometer: 63120,
        acquisitionCost: 1150000,
        status: VehicleStatus.IN_SHOP,
        region: "South"
      }
    })
  ]);

  const [alex, priya, rahul] = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNo: "DL-ALEX-1001" },
      update: {},
      create: {
        userId: users[1].id,
        name: "Alex Kumar",
        licenseNo: "DL-ALEX-1001",
        licenseCategory: "LMV",
        licenseExpiry: new Date("2028-06-30"),
        contactNumber: "+91-90000-10001",
        safetyScore: 96,
        status: DriverStatus.AVAILABLE
      }
    }),
    prisma.driver.upsert({
      where: { licenseNo: "DL-PRIYA-2042" },
      update: {},
      create: {
        name: "Priya Shah",
        licenseNo: "DL-PRIYA-2042",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2027-12-15"),
        contactNumber: "+91-90000-20420",
        safetyScore: 91,
        status: DriverStatus.AVAILABLE
      }
    }),
    prisma.driver.upsert({
      where: { licenseNo: "DL-RAHUL-3309" },
      update: {},
      create: {
        name: "Rahul Mehta",
        licenseNo: "DL-RAHUL-3309",
        licenseCategory: "LMV",
        licenseExpiry: new Date("2026-08-01"),
        contactNumber: "+91-90000-33090",
        safetyScore: 78,
        status: DriverStatus.OFF_DUTY
      }
    })
  ]);

  const completedTrip = await prisma.trip.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      vehicleId: truck.id,
      driverId: priya.id,
      source: "Mumbai Depot",
      destination: "Pune Hub",
      cargoWeight: 1800,
      plannedDistance: 150,
      actualDistance: 152,
      revenue: 18500,
      status: "COMPLETED",
      dispatchedAt: new Date("2026-07-01T09:00:00.000Z"),
      completedAt: new Date("2026-07-01T15:00:00.000Z")
    }
  });

  await prisma.fuelLog.createMany({
    data: [
      { id: "00000000-0000-0000-0000-000000000201", vehicleId: truck.id, tripId: completedTrip.id, liters: 38, cost: 3750, date: new Date("2026-07-01") },
      { id: "00000000-0000-0000-0000-000000000202", vehicleId: van.id, liters: 22, cost: 2150, date: new Date("2026-07-04") }
    ],
    skipDuplicates: true
  });

  await prisma.expense.createMany({
    data: [
      { id: "00000000-0000-0000-0000-000000000301", vehicleId: truck.id, category: "TOLL", amount: 850, date: new Date("2026-07-01"), notes: "Expressway toll" },
      { id: "00000000-0000-0000-0000-000000000302", vehicleId: van.id, category: "PARKING", amount: 200, date: new Date("2026-07-05"), notes: "Depot parking" }
    ],
    skipDuplicates: true
  });

  await prisma.maintenanceLog.createMany({
    data: [
      {
        id: "00000000-0000-0000-0000-000000000401",
        vehicleId: miniTruck.id,
        serviceType: "Oil change",
        cost: 4200,
        status: "OPEN",
        notes: "Scheduled service",
        startedAt: new Date("2026-07-10T08:00:00.000Z")
      }
    ],
    skipDuplicates: true
  });

  console.log({ users: users.length, vehicles: 3, drivers: [alex, priya, rahul].length });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
