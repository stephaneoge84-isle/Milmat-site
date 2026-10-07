import { describe, expect, it } from "vitest";
import { legalRuleEngine } from "../src";
import { legalRules } from "../src/rules";

describe("FPS rules", () => {
  const base = {
    infractionDate: "2026-09-23",
    regime: "FPS" as const,
    extractedData: {},
    documentEvidence: {},
    availableDocuments: []
  };

  it("recognizes the FPS regime", () => {
    const audit = legalRuleEngine(base, legalRules);
    expect(audit.applicableRules.some(r => r.id === "FPS-MENTIONS-001")).toBe(true);
  });

  it("recognizes a structurally complete FPS", () => {
    const audit = legalRuleEngine({
      ...base,
      extractedData: {
        fpsCollectivity: "AIX EN PROVENCE",
        fpsAgentAuthority: "MAIRIE D'AIX-EN-PROVENCE",
        fpsAgentId: "16",
        infractionDateTime: "2026-09-23 15:53",
        infractionLocation: "12 RUE DE LA POUDRIERE, 13100 AIX-EN-PROVENCE",
        vehicleRegistration: "EC-274-LF",
        vehicleBrand: "Volkswagen",
        noticeSendDate: "2026-09-29",
        liableIdentityAddress: "M OGÉ STÉPHANE, 137 AVENUE DE LA LIBERATION, 84800 L'ISLE SUR LA SORGUE",
        fpsAmount: 33,
        fpsEndTime: "19:00",
        fpsSignature: "Signé",
        fpsNoticeNumber: "21130001700012 26 1 266 016 088",
        noticeNotificationDate: "2026-10-05",
        rapoAuthority: "AIX EN PROVENCE",
        fpsNoticePart1Complete: true,
        fpsNoticePart2Complete: true,
        paymentServiceCoordinates: "service paiement",
        paymentMethods: "moyens indiqués",
        paymentDeadline: "2027-01-05",
        nonPaymentConsequence: "titre exécutoire majoré",
        rapoMandatory: true,
        rapoDeadlineAndMethod: "un mois / modalités indiquées",
        rapoSilenceRejection: true,
        tribunalAppealInfo: "tribunal du stationnement payant",
        dataAccessRectification: true,
        rapoRequiredDocuments: true,
        notificationMode: "postal",
        notificationProof: "élément de notification",
        tribunalAppealDeadline: "un mois",
        tribunalPriorPayment: true
      }
    }, legalRules);

    expect(audit.checks.find(c => c.ruleId === "FPS-MENTIONS-001")?.status).toBe("PRESENT_CONFORME");
    expect(audit.checks.find(c => c.ruleId === "FPS-AGENT-002")?.status).toBe("PRESENT_CONFORME");
    expect(audit.checks.find(c => c.ruleId === "FPS-RAPO-003")?.status).toBe("PRESENT_CONFORME");
  });

  it("does not infer that a missing field is absent from the complete notice", () => {
    const audit = legalRuleEngine(base, legalRules);
    expect(audit.checks.find(c => c.ruleId === "FPS-MENTIONS-001")?.status).toBe("NON_DEMONTRE");
  });
});
