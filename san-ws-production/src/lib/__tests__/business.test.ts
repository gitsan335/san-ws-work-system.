import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSuccessRate,
  getApplicablePaymentRate,
  calculateWorkAmount,
  membersExceedExpected,
  isBelowTarget,
  isMeetingTarget,
} from "../business";

describe("Success Rate", () => {
  it("calculates 70% for 35/50", () => {
    assert.equal(calculateSuccessRate(35, 50), 0.7);
  });
  it("calculates 0 for 0 members", () => {
    assert.equal(calculateSuccessRate(0, 100), 0);
  });
  it("returns null for zero expected", () => {
    assert.equal(calculateSuccessRate(10, 0), null);
  });
});

describe("Payment Rate Lookup", () => {
  const rates = [
    { effectiveFrom: new Date("2025-01-01"), perMemberRate: 2.0, status: "ACTIVE" },
    { effectiveFrom: new Date("2025-09-01"), perMemberRate: 2.5, status: "ACTIVE" },
  ];

  it("uses 2.00 before Sep 2025", () => {
    const r = getApplicablePaymentRate(new Date("2025-08-15"), rates);
    assert.ok("rate" in r);
    if ("rate" in r) assert.equal(r.rate, 2.0);
  });

  it("uses 2.50 after Sep 2025", () => {
    const r = getApplicablePaymentRate(new Date("2025-09-10"), rates);
    assert.ok("rate" in r);
    if ("rate" in r) assert.equal(r.rate, 2.5);
  });

  it("errors when no rate", () => {
    const r = getApplicablePaymentRate(new Date("2020-01-01"), rates);
    assert.ok("error" in r);
  });

  it("detects duplicate active rate dates", () => {
    const dup = [
      ...rates,
      { effectiveFrom: new Date("2025-09-01"), perMemberRate: 3.0, status: "ACTIVE" },
    ];
    const r = getApplicablePaymentRate(new Date("2025-09-10"), dup);
    assert.ok("error" in r);
    if ("error" in r) assert.match(r.error, /DUPLICATE/);
  });
});

describe("Work Amount", () => {
  it("35 * 2.00 = 70", () => {
    assert.equal(calculateWorkAmount(35, 2.0), 70);
  });
  it("160 * 2.50 = 400", () => {
    assert.equal(calculateWorkAmount(160, 2.5), 400);
  });
  it("0 members = 0", () => {
    assert.equal(calculateWorkAmount(0, 2.5), 0);
  });
});

describe("Target & Exceed", () => {
  it("flags members exceed expected", () => {
    assert.equal(membersExceedExpected(60, 50), true);
    assert.equal(membersExceedExpected(50, 50), false);
  });
  it("below target", () => {
    assert.equal(isBelowTarget(22, "VALID", 30), true);
    assert.equal(isBelowTarget(30, "VALID", 30), false);
    assert.equal(isBelowTarget(0, "INVALID", 30), false);
  });
  it("meeting target", () => {
    assert.equal(isMeetingTarget(35, "VALID", 30), true);
  });
});

console.log("All business logic tests defined.");
