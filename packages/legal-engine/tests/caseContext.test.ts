import { describe, expect, it } from "vitest";
import { qualifyCaseContext } from "../src/case/qualifyCaseContext";

describe("case context qualification", () => {
  it("flags a majorée received without the initial notice", () => {
    const result = qualifyCaseContext({
      userExplanation: "Je reçois une amende majorée sans avis initial.",
      currentDocumentType: "AMENDE_FORFAITAIRE_MAJORÉE",
      initialNoticeReception: "NOT_RECEIVED",
      specificRequests: "Je souhaite savoir sur quelle base la majoration a été appliquée.",
    });
    expect(result.situation).toBe("MAJORATION_WITHOUT_INITIAL_NOTICE");
    expect(result.requiresReceptionCheck).toBe(true);
    expect(result.generatedRequests.length).toBeGreaterThan(0);
  });

  it("does not infer non-receipt when the user is unsure", () => {
    const result = qualifyCaseContext({
      userExplanation: "Je ne sais plus si j'avais reçu le premier avis.",
      currentDocumentType: "AMENDE_FORFAITAIRE_MAJORÉE",
      initialNoticeReception: "UNSURE",
    });
    expect(result.situation).toBe("UNCERTAIN");
    expect(result.factsToClarify).toContain("Whether an initial notice was actually received");
  });
});
