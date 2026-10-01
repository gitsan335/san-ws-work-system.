import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SAN WS WORK SYSTEM...");

  // Clear existing (dev only)
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.vcfType.deleteMany();
  await prisma.paymentRate.deleteMany();
  await prisma.expenseType.deleteMany();
  await prisma.setting.deleteMany();

  const adminHash = await bcrypt.hash("Admin@ChangeMe1", 12);
  const workerHash = await bcrypt.hash("Worker@123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@sanws.local",
      passwordHash: adminHash,
      name: "System Admin",
      role: "ADMIN",
      active: true,
    },
  });

  const workerUsers = await Promise.all(
    [
      { email: "james@sanws.local", name: "James Otieno" },
      { email: "faith@sanws.local", name: "Faith Wanjiku" },
      { email: "brian@sanws.local", name: "Brian Ochieng" },
      { email: "grace@sanws.local", name: "Grace Akinyi" },
      { email: "daniel@sanws.local", name: "Daniel Kamau" },
    ].map((w) =>
      prisma.user.create({
        data: {
          email: w.email,
          passwordHash: workerHash,
          name: w.name,
          role: "WORKER",
          active: true,
          worker: { create: { status: "ACTIVE" } },
        },
        include: { worker: true },
      })
    )
  );

  const sellers = await Promise.all(
    ["Kevin Mutua", "Lucy Auma", "George Odhiambo", "Rose Nasimiyu", "Joseph Karanja"].map(
      (name) => prisma.seller.create({ data: { name, status: "ACTIVE" } })
    )
  );

  const vcf50 = await prisma.vcfType.create({
    data: { name: "50ctc", expectedContacts: 50, status: "ACTIVE" },
  });
  const vcf100 = await prisma.vcfType.create({
    data: { name: "100ctc", expectedContacts: 100, status: "ACTIVE" },
  });
  const vcf200 = await prisma.vcfType.create({
    data: { name: "200ctc", expectedContacts: 200, status: "ACTIVE" },
  });

  await prisma.paymentRate.create({
    data: {
      effectiveFrom: new Date("2025-01-01"),
      perMemberRate: 2.0,
      status: "ACTIVE",
    },
  });
  await prisma.paymentRate.create({
    data: {
      effectiveFrom: new Date("2025-09-01"),
      perMemberRate: 2.5,
      status: "ACTIVE",
    },
  });

  for (const name of [
    "Referral",
    "Data",
    "Communication",
    "Airtime",
    "Internet",
    "Transport",
    "Other",
  ]) {
    await prisma.expenseType.create({ data: { name, status: "ACTIVE" } });
  }

  await prisma.setting.createMany({
    data: [
      { key: "TARGET_MEMBERS", value: "30" },
      { key: "MIN_SUCCESS_RATE", value: "0.40" },
    ],
  });

  // 5 demo operations
  const ops = [
    {
      date: new Date("2025-08-15"),
      groupId: "G001",
      groupCreationDate: new Date("2025-07-01"),
      status: "VALID",
      membersAdded: 35,
      expectedContacts: 50,
      successRate: 0.7,
      applicableRate: 2.0,
      workAmount: 70,
      workerId: workerUsers[0].worker!.id,
      sellerId: sellers[0].id,
      vcfTypeId: vcf50.id,
    },
    {
      date: new Date("2025-09-10"),
      groupId: "G002",
      groupCreationDate: new Date("2024-03-10"),
      status: "INVALID",
      membersAdded: 0,
      expectedContacts: 100,
      successRate: 0,
      applicableRate: 2.5,
      workAmount: 0,
      workerId: workerUsers[2].worker!.id,
      sellerId: sellers[2].id,
      vcfTypeId: vcf100.id,
    },
    {
      date: new Date("2025-09-12"),
      groupId: "G003",
      groupCreationDate: new Date("2025-06-15"),
      status: "VALID",
      membersAdded: 22,
      expectedContacts: 100,
      successRate: 0.22,
      applicableRate: 2.5,
      workAmount: 55,
      workerId: workerUsers[1].worker!.id,
      sellerId: sellers[1].id,
      vcfTypeId: vcf100.id,
    },
    {
      date: new Date("2025-09-15"),
      groupId: "G004",
      groupCreationDate: new Date("2025-05-01"),
      status: "VALID",
      membersAdded: 30,
      expectedContacts: 50,
      successRate: 0.6,
      applicableRate: 2.5,
      workAmount: 75,
      workerId: workerUsers[4].worker!.id,
      sellerId: sellers[4].id,
      vcfTypeId: vcf50.id,
    },
    {
      date: new Date("2025-09-20"),
      groupId: "G005",
      groupCreationDate: new Date("2025-09-01"),
      status: "VALID",
      membersAdded: 160,
      expectedContacts: 200,
      successRate: 0.8,
      applicableRate: 2.5,
      workAmount: 400,
      workerId: workerUsers[3].worker!.id,
      sellerId: sellers[3].id,
      vcfTypeId: vcf200.id,
    },
  ];

  for (const op of ops) {
    await prisma.operation.create({
      data: { ...op, isDemo: true, notes: "DEMO DATA — DELETE BEFORE PRODUCTION" },
    });
  }

  const dataType = await prisma.expenseType.findFirst({ where: { name: "Data" } });
  const airtimeType = await prisma.expenseType.findFirst({ where: { name: "Airtime" } });
  if (dataType) {
    await prisma.expense.create({
      data: {
        date: new Date("2025-09-10"),
        expenseTypeId: dataType.id,
        description: "Data bundles for workers",
        amount: 500,
        groupId: "G002",
        workerId: workerUsers[2].worker!.id,
        reference: "MPESA-001",
      },
    });
  }
  if (airtimeType) {
    await prisma.expense.create({
      data: {
        date: new Date("2025-09-12"),
        expenseTypeId: airtimeType.id,
        description: "Worker airtime top-up",
        amount: 200,
        groupId: "G003",
        workerId: workerUsers[1].worker!.id,
        reference: "MPESA-002",
      },
    });
  }

  // Sample pending task for James
  await prisma.task.create({
    data: {
      groupId: "G006",
      date: new Date(),
      status: "PENDING",
      workerId: workerUsers[0].worker!.id,
      vcfTypeId: vcf50.id,
      notes: "Demo pending task — complete via worker portal",
    },
  });

  console.log("Seed complete.");
  console.log("Admin: admin@sanws.local / Admin@ChangeMe1");
  console.log("Worker: james@sanws.local / Worker@123 (and other workers)");
  console.log("DEMO DATA — DELETE BEFORE PRODUCTION");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
