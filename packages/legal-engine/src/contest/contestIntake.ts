import type { LegalAudit, RuleInput } from "../types";
import type { ContestGround } from "./contestGrounds";
import { classifyContestGround } from "./contestGrounds";
import { estimateContestSuccess, type ContestSuccessEstimate } from "./contestSuccessEstimate";
import { legalRuleEngine } from "../engine/legalRuleEngine";
import { legalRules } from "../rules";
import { buildCaseFile, attachLegalAudit, type CaseFile } from "../case/caseFile";

export interface ContestIntakeAnswers {
  infractionDate: string;
  notificationDate?: string;
  ground?: ContestGround;
  fpsTopic?: "paiement" | "vehicule" | "document" | "notification" | "montant" | "autre";
  explanation: string;
  answers: Record<string, string>;
  documents: string[];
  extractedData?: Record<string, unknown>;
  documentEvidence?: Record<string, unknown>;
}

export interface ContestIntakeResult {
  ground: ReturnType<typeof classifyContestGround>;
  audit: LegalAudit;
  estimate: ContestSuccessEstimate;
  ruleInput: RuleInput;
  caseFile: CaseFile;
}

function yes(answers: Record<string, string>, key: string): boolean | undefined {
  const value = answers[key];
  if (value === "Oui") return true;
  if (value === "Non") return false;
  return undefined;
}

export function buildFpsRuleInput(input: ContestIntakeAnswers): RuleInput {
  const payment = yes(input.answers, "Paiement effectué ?");
  const paymentProof = yes(input.answers, "Justificatif ?");
  const paymentBefore = yes(input.answers, "Horodatage");
  const completeNotice = input.documents.includes("Avis FPS complet, recto et verso");
  const extractedData: Record<string, unknown> = {
    ...(input.extractedData ?? {}),
    noticeNotificationDate: input.notificationDate,
    paymentDeclared: payment,
    paymentProofDeclared: paymentProof,
    paymentBeforeInfraction: paymentBefore,
    completeNoticeDeclared: completeNotice,
    declaredGround: input.ground,
    fpsTopic: input.fpsTopic,
    userExplanation: input.explanation,
    contestAnswers: input.answers,
  };

  const documentEvidence: Record<string, unknown> = {
    ...(input.documentEvidence ?? {}),
    fpsNoticeComplete: completeNotice,
    paymentProof: input.documents.includes("Justificatif de paiement du stationnement"),
    subscriptionRight: input.documents.includes("Abonnement / droit"),
    registrationCertificate: input.documents.includes("Carte grise"),
    saleDocument: input.documents.includes("Cession / vente"),
    correspondence: input.documents.includes("Courrier"),
    photos: input.documents.includes("Photos"),
  };

  return {
    infractionDate: input.infractionDate,
    regime: "FPS",
    extractedData,
    documentEvidence,
    availableDocuments: input.documents,
  };
}

export function analyzeContestIntake(input: ContestIntakeAnswers): ContestIntakeResult {
  const ground = classifyContestGround({
    regime: "FPS",
    selectedGround: input.ground,
    userExplanation: input.explanation,
    extractedData: input.extractedData,
  });
  const caseFile = buildCaseFile({
    regime: "FPS",
    infractionDate: input.infractionDate,
    notificationDate: input.notificationDate,
    userExplanation: input.explanation,
    answers: input.answers,
    documents: input.documents,
    extractedData: input.extractedData,
    documentEvidence: input.documentEvidence,
    selectedGround: input.ground,
  });
  const ruleInput = { ...buildFpsRuleInput(input), caseFile };
  const audit = legalRuleEngine(ruleInput, legalRules);
  const finalCaseFile = attachLegalAudit(caseFile, audit);
  const explicitGroundFound = ground.primaryGround !== "UNDETERMINED";
  const estimate = estimateContestSuccess(audit, explicitGroundFound);
  return { ground, audit, estimate, ruleInput, caseFile: finalCaseFile };
}
