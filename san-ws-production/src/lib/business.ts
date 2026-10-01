/**
 * SAN WS WORK SYSTEM — Centralized business calculations
 * Server is the authority. Never trust client-calculated values.
 */

export type PaymentRateRow = {
  effectiveFrom: Date;
  perMemberRate: number;
  status: string;
};

export function getExpectedContacts(
  vcfName: string,
  vcfList: { name: string; expectedContacts: number; status: string }[]
): number | null {
  const vcf = vcfList.find(
    (v) => v.name === vcfName && v.status === "ACTIVE"
  );
  return vcf ? vcf.expectedContacts : null;
}

export function calculateSuccessRate(
  membersAdded: number,
  expectedContacts: number
): number | null {
  if (expectedContacts <= 0) return null;
  if (membersAdded < 0) return null;
  return membersAdded / expectedContacts;
}

/**
 * Latest ACTIVE rate where effectiveFrom <= operationDate.
 * If multiple share the same date, returns null (duplicate active rate).
 */
export function getApplicablePaymentRate(
  operationDate: Date,
  rates: PaymentRateRow[]
): { rate: number } | { error: string } {
  const active = rates.filter((r) => r.status === "ACTIVE");
  const applicable = active.filter(
    (r) => startOfDay(r.effectiveFrom) <= startOfDay(operationDate)
  );
  if (applicable.length === 0) {
    return { error: "RATE NOT CONFIGURED FOR DATE" };
  }
  // Find max effectiveFrom
  let maxDate = applicable[0].effectiveFrom;
  for (const r of applicable) {
    if (startOfDay(r.effectiveFrom) > startOfDay(maxDate)) {
      maxDate = r.effectiveFrom;
    }
  }
  const atMax = applicable.filter(
    (r) => startOfDay(r.effectiveFrom).getTime() === startOfDay(maxDate).getTime()
  );
  if (atMax.length > 1) {
    return { error: "DUPLICATE ACTIVE PAYMENT RATE" };
  }
  return { rate: atMax[0].perMemberRate };
}

export function calculateWorkAmount(
  membersAdded: number,
  perMemberRate: number
): number {
  if (membersAdded < 0) return 0;
  return Math.round(membersAdded * perMemberRate * 100) / 100;
}

export function membersExceedExpected(
  membersAdded: number,
  expectedContacts: number
): boolean {
  return membersAdded > expectedContacts;
}

export function isBelowTarget(
  membersAdded: number,
  status: string,
  target: number
): boolean {
  return status === "VALID" && membersAdded > 0 && membersAdded < target;
}

export function isMeetingTarget(
  membersAdded: number,
  status: string,
  target: number
): boolean {
  return status === "VALID" && membersAdded >= target;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatKes(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
