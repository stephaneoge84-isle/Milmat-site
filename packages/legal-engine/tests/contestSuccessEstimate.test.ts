import { describe, expect, it } from "vitest";
import { estimateContestSuccess } from "../src/contest/contestSuccessEstimate";
import type { LegalAudit } from "../src/types";

const audit = (checks: any[]): LegalAudit => ({
  legalVersionDate: "2026-09-23",
  applicableRules: [],
  checks,
  missingEvidence: [],
  anomalies: [],
  requests: [],
  confidence: 1
});

describe("contest success estimate", () => {
  it("returns 0% when every relevant control is compliant and no ground exists", () => {
    const result = estimateContestSuccess(audit([
      { ruleId: "A", status: "PRESENT_CONFORME", risk: "INFO", finding: "conforme", requiredEvidence: [], consequence: "ok" }
    ]));
    expect(result.percentage).toBe(0);
    expect(result.decision).toBe("STOP_AND_REVIEW");
  });

  it("raises the estimate when an apparent inconsistency exists", () => {
    const result = estimateContestSuccess(audit([
      { ruleId: "A", status: "PRESENT_INCOHERENT", risk: "RED", finding: "incohérence", requiredEvidence: [], consequence: "review" }
    ]));
    expect(result.percentage).toBeGreaterThan(0);
    expect(result.decision).toBe("CONTINUE_WITH_CAUTION");
  });

  it("can reflect an explicit contest ground even without a formal anomaly", () => {
    const result = estimateContestSuccess(audit([
      { ruleId: "A", status: "PRESENT_CONFORME", risk: "INFO", finding: "conforme", requiredEvidence: [], consequence: "ok" }
    ]), true);
    expect(result.percentage).toBeGreaterThan(0);
  });
});
