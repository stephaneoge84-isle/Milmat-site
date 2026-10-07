import { describe, expect, it } from "vitest";
import { legalRuleEngine } from "../src";
import { legalRules } from "../src/rules";

describe("parking rules", () => {
  const base = {
    infractionDate: "2026-10-07",
    regime: "STATIONNEMENT_CONTRAVENTION" as const,
    extractedData: {},
    documentEvidence: {},
    availableDocuments: []
  };

  it("qualifies an ordinary parking case without inventing missing facts", () => {
    const audit = legalRuleEngine(base, legalRules);
    expect(audit.applicableRules.some(r => r.id === "STATIONNEMENT-NATURE-001")).toBe(true);
    expect(audit.checks.find(c => c.ruleId === "STATIONNEMENT-NATURE-001")?.status).toBe("NON_DEMONTRE");
  });

  it("recognizes a documented parking offence", () => {
    const audit = legalRuleEngine({
      ...base,
      extractedData: {
        parkingOffenceNature: "stationnement très gênant",
        parkingLegalReference: "R.417-11",
        infractionDateTime: "2026-10-01 10:30",
        infractionLocation: "rue exemple",
        parkingObservation: "véhicule stationné sur emplacement interdit",
        agentCompetence: true
      }
    }, legalRules);

    expect(audit.checks.find(c => c.ruleId === "STATIONNEMENT-NATURE-001")?.status).toBe("PRESENT_CONFORME");
    expect(audit.checks.find(c => c.ruleId === "STATIONNEMENT-CONSTAT-002")?.status).toBe("PRESENT_CONFORME");
    expect(audit.checks.find(c => c.ruleId === "STATIONNEMENT-AGENT-003")?.status).toBe("PRESENT_CONFORME");
  });

  it("does not turn a missing observation into proof that the observation never existed", () => {
    const audit = legalRuleEngine({
      ...base,
      extractedData: {
        parkingOffenceNature: "stationnement gênant",
        parkingLegalReference: "R.417-10"
      }
    }, legalRules);

    const constat = audit.checks.find(c => c.ruleId === "STATIONNEMENT-CONSTAT-002");
    expect(constat?.status).toBe("NON_DEMONTRE");
    expect(constat?.finding.toLowerCase()).toContain("ne sont pas retrouvés");
  });
});
