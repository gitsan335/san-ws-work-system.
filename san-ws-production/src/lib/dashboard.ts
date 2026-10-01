import { prisma } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeekMon(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}
function endOfWeekSun(d: Date) {
  const s = startOfWeekMon(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export async function getPeriodStats(from: Date, to: Date) {
  const ops = await prisma.operation.findMany({
    where: { date: { gte: from, lte: to } },
  });
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from, lte: to } },
  });

  const groups = ops.length;
  const members = ops.reduce((s, o) => s + o.membersAdded, 0);
  const valid = ops.filter((o) => o.status === "VALID").length;
  const invalid = ops.filter((o) => o.status === "INVALID").length;
  const rates = ops.map((o) => o.successRate);
  const avgSuccess =
    rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
  const workAmount = ops.reduce((s, o) => s + o.workAmount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return { groups, members, valid, invalid, avgSuccess, workAmount, expenseTotal };
}

export async function getDashboardData() {
  const now = new Date();
  const [today, week, month, allOps, allExpenses, workers, sellers, vcfs, settings] =
    await Promise.all([
      getPeriodStats(startOfDay(now), endOfDay(now)),
      getPeriodStats(startOfWeekMon(now), endOfWeekSun(now)),
      getPeriodStats(startOfMonth(now), endOfMonth(now)),
      prisma.operation.findMany({
        include: { worker: { include: { user: true } }, seller: true, vcfType: true },
      }),
      prisma.expense.findMany({ include: { expenseType: true } }),
      prisma.worker.findMany({
        where: { status: "ACTIVE" },
        include: { user: true, operations: true },
      }),
      prisma.seller.findMany({ include: { operations: true } }),
      prisma.vcfType.findMany({ include: { operations: true } }),
      prisma.setting.findMany(),
    ]);

  const target = Number(settings.find((s) => s.key === "TARGET_MEMBERS")?.value || 30);
  const minSuccess = Number(settings.find((s) => s.key === "MIN_SUCCESS_RATE")?.value || 0.4);

  const totalGroups = allOps.length;
  const validGroups = allOps.filter((o) => o.status === "VALID").length;
  const invalidGroups = allOps.filter((o) => o.status === "INVALID").length;
  const avgMembers = totalGroups > 0 ? allOps.reduce((s, o) => s + o.membersAdded, 0) / totalGroups : 0;
  const avgSuccessAll = totalGroups > 0 ? allOps.reduce((s, o) => s + o.successRate, 0) / totalGroups : 0;
  const meetTarget = allOps.filter((o) => o.status === "VALID" && o.membersAdded >= target).length;
  const belowTarget = allOps.filter((o) => o.status === "VALID" && o.membersAdded > 0 && o.membersAdded < target).length;

  const workerPerf = workers.map((w) => {
    const ops = w.operations;
    return {
      name: w.user.name,
      groups: ops.length,
      members: ops.reduce((s, o) => s + o.membersAdded, 0),
      avgSuccess: ops.length > 0 ? ops.reduce((s, o) => s + o.successRate, 0) / ops.length : null,
      valid: ops.filter((o) => o.status === "VALID").length,
      invalid: ops.filter((o) => o.status === "INVALID").length,
    };
  });

  const sellerPerf = sellers.map((s) => {
    const ops = s.operations;
    const valid = ops.filter((o) => o.status === "VALID").length;
    return {
      name: s.name,
      groups: ops.length,
      valid,
      invalid: ops.filter((o) => o.status === "INVALID").length,
      validity: ops.length > 0 ? valid / ops.length : null,
      avgMembers: ops.length > 0 ? ops.reduce((a, o) => a + o.membersAdded, 0) / ops.length : null,
      avgSuccess: ops.length > 0 ? ops.reduce((a, o) => a + o.successRate, 0) / ops.length : null,
    };
  });

  const vcfPerf = vcfs.map((v) => {
    const ops = v.operations;
    return {
      name: v.name,
      expected: v.expectedContacts,
      groups: ops.length,
      members: ops.reduce((s, o) => s + o.membersAdded, 0),
      avgSuccess: ops.length > 0 ? ops.reduce((s, o) => s + o.successRate, 0) / ops.length : null,
    };
  });

  const expenseByType: Record<string, number> = {};
  for (const e of allExpenses) {
    const t = e.expenseType.name;
    expenseByType[t] = (expenseByType[t] || 0) + e.amount;
  }

  const alerts: string[] = [];
  const groupIds = allOps.map((o) => o.groupId);
  if (groupIds.filter((id, i) => groupIds.indexOf(id) !== i).length)
    alerts.push("DUPLICATE GROUP ID — CHECK RECORD");
  if (belowTarget > 0) alerts.push("GROUPS BELOW TARGET");
  if (allOps.some((o) => o.successRate < minSuccess && o.membersAdded > 0))
    alerts.push("VERY LOW SUCCESS RATE");
  if (allOps.some((o) => o.membersAdded > o.expectedContacts))
    alerts.push("MEMBERS EXCEED EXPECTED VCF CONTACTS");
  if (allExpenses.some((e) => e.amount < 0)) alerts.push("INVALID EXPENSE AMOUNT");

  return {
    today, week, month,
    groupPerf: { totalGroups, validGroups, invalidGroups, validityRate: totalGroups > 0 ? validGroups / totalGroups : null, avgMembers, avgSuccessAll, meetTarget, belowTarget },
    workerPerf, sellerPerf, vcfPerf, expenseByType,
    totalWork: allOps.reduce((s, o) => s + o.workAmount, 0),
    totalExpenses: allExpenses.reduce((s, e) => s + e.amount, 0),
    totalMembers: allOps.reduce((s, o) => s + o.membersAdded, 0),
    alerts: alerts.length ? alerts : ["NO CURRENT ALERTS"],
  };
}
