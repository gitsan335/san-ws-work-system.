"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  calculateSuccessRate,
  getApplicablePaymentRate,
  calculateWorkAmount,
} from "@/lib/business";

export async function createTask(formData: FormData) {
  await requireAuth("ADMIN");
  const workerId = String(formData.get("workerId") || "");
  const groupId = String(formData.get("groupId") || "").trim();
  const vcfTypeId = String(formData.get("vcfTypeId") || "");
  const dateStr = String(formData.get("date") || "");
  const notes = String(formData.get("notes") || "");

  if (!workerId || !groupId || !vcfTypeId || !dateStr) {
    return { error: "Worker, Group ID, VCF Type and Date are required" };
  }

  const existing = await prisma.operation.findFirst({ where: { groupId } });
  const pendingDup = await prisma.task.findFirst({
    where: { groupId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  if (existing || pendingDup) {
    return { error: "DUPLICATE GROUP ID — CHECK RECORD" };
  }

  await prisma.task.create({
    data: {
      workerId,
      groupId,
      vcfTypeId,
      date: new Date(dateStr),
      status: "PENDING",
      notes: notes || null,
    },
  });

  await prisma.auditLog.create({
    data: { action: "TASK_CREATED", entityType: "Task", newValue: groupId },
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/worker/tasks");
  return { ok: true };
}

export async function submitTaskResult(formData: FormData) {
  const session = await requireAuth("WORKER");
  const taskId = String(formData.get("taskId") || "");
  const membersRaw = String(formData.get("membersAdded") || "");
  const status = String(formData.get("status") || "VALID");
  const sellerId = String(formData.get("sellerId") || "");
  const groupCreationDate = String(formData.get("groupCreationDate") || "");

  const membersAdded = parseInt(membersRaw, 10);
  if (!taskId || Number.isNaN(membersAdded) || membersAdded < 0) {
    return { error: "Valid Members Added is required (whole number ≥ 0)" };
  }
  if (!["VALID", "INVALID"].includes(status)) {
    return { error: "Status must be VALID or INVALID" };
  }
  if (!sellerId) {
    return { error: "Seller is required" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { vcfType: true, worker: true },
  });
  if (!task) return { error: "Task not found" };
  if (task.workerId !== session.workerId) {
    return { error: "You can only submit your own tasks" };
  }
  if (task.status === "COMPLETED") {
    return { error: "This task is already completed" };
  }

  const expectedContacts = task.vcfType.expectedContacts;
  const successRate = calculateSuccessRate(membersAdded, expectedContacts);
  if (successRate === null) {
    return { error: "Unable to calculate success rate" };
  }

  const rates = await prisma.paymentRate.findMany();
  const rateResult = getApplicablePaymentRate(
    task.date,
    rates.map((r) => ({
      effectiveFrom: r.effectiveFrom,
      perMemberRate: r.perMemberRate,
      status: r.status,
    }))
  );
  if ("error" in rateResult) {
    return { error: rateResult.error };
  }

  const workAmount = calculateWorkAmount(membersAdded, rateResult.rate);

  await prisma.$transaction(async (tx) => {
    await tx.operation.create({
      data: {
        date: task.date,
        groupId: task.groupId,
        groupCreationDate: groupCreationDate
          ? new Date(groupCreationDate)
          : null,
        status,
        membersAdded,
        expectedContacts,
        successRate,
        applicableRate: rateResult.rate,
        workAmount,
        workerId: task.workerId,
        sellerId,
        vcfTypeId: task.vcfTypeId,
        taskId: task.id,
        notes: membersAdded > expectedContacts
          ? "REVIEW: MEMBERS EXCEED EXPECTED VCF CONTACTS"
          : null,
      },
    });
    await tx.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED" },
    });
    await tx.auditLog.create({
      data: {
        userId: session.id,
        action: "TASK_SUBMITTED",
        entityType: "Task",
        entityId: task.id,
        newValue: JSON.stringify({ membersAdded, workAmount }),
      },
    });
  });

  revalidatePath("/worker/tasks");
  revalidatePath("/worker/results");
  revalidatePath("/worker/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/operations");
  return { ok: true, workAmount, successRate };
}

export async function createExpense(formData: FormData) {
  await requireAuth("ADMIN");
  const date = String(formData.get("date") || "");
  const expenseTypeId = String(formData.get("expenseTypeId") || "");
  const description = String(formData.get("description") || "").trim();
  const amount = parseFloat(String(formData.get("amount") || ""));
  const groupId = String(formData.get("groupId") || "").trim() || null;
  const workerId = String(formData.get("workerId") || "") || null;
  const reference = String(formData.get("reference") || "").trim() || null;

  if (!date || !expenseTypeId || !description || Number.isNaN(amount)) {
    return { error: "Date, type, description and amount are required" };
  }
  if (amount < 0) return { error: "Amount cannot be negative" };

  await prisma.expense.create({
    data: {
      date: new Date(date),
      expenseTypeId,
      description,
      amount,
      groupId,
      workerId,
      reference,
    },
  });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
