import { describe, expect, it } from "vitest";
import { analyzeContestIntake } from "../src/contest/contestIntake";

describe("contest intake adapter", () => {
  it("maps a targeted FPS payment case into the deterministic engine", () => {
    const result = analyzeContestIntake({
      infractionDate: "2026-09-23",
      notificationDate: "2026-10-05",
      ground: "FPS",
      explanation: "Je disposais d'un droit de stationner.",
      answers: {
        "Paiement effectué ?": "Oui",
        "Justificatif ?": "Oui",
        "Horodatage": "Oui"
      },
      documents: ["Avis FPS complet, recto et verso", "Justificatif de paiement du stationnement"],
      fpsTopic: "paiement"
    });
    expect(result.ruleInput.regime).toBe("FPS");
    expect(result.caseFile.schemaVersion).toBe("1.0");
    expect(result.caseFile.regime).toBe("FPS");
    expect(result.caseFile.facts.some(f => f.key === "userExplanation")).toBe(true);
    expect(result.caseFile.audit).toBeDefined();
    expect(result.audit.applicableRules.some(r => r.id === "FPS-RAPO-003")).toBe(true);
    expect(result.ground.primaryGround).toBe("FPS");
    expect(result.estimate.solidite).toBeDefined();
    expect(result.estimate.percentage).toBeGreaterThan(0);
  });

  it("keeps an incomplete notice in a non-demonstrated state", () => {
    const result = analyzeContestIntake({
      infractionDate: "2026-09-23",
      ground: "FPS",
      explanation: "Je conteste l'avis.",
      answers: {},
      documents: []
    });
    expect(result.audit.checks.find(c => c.ruleId === "FPS-MENTIONS-001")?.status).toBe("NON_DEMONTRE");
  });
});


describe("FPS qualitative strength", () => {
  it("does not treat the estimate as a success probability", () => {
    const result = analyzeContestIntake({
      infractionDate: "2026-09-23",
      notificationDate: "2026-10-05",
      ground: "FPS",
      fpsTopic: "document",
      explanation: "Je conteste une incohérence précise.",
      answers: { "Incohérence": "Oui" },
      documents: ["Avis FPS complet, recto et verso"]
    });
    expect(["INCOHERENCE_APPARENTE", "A_COMPLETER", "FAVORABLE_A_EXAMEN"]).toContain(result.estimate.solidite);
  });
});
