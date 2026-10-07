import type { LegalAudit } from "../types";
import type { CaseFile } from "../case/caseFile";

export interface AIDraftRequest {
  caseFile: CaseFile;
  audit: LegalAudit;
  draftText: string;
}

export interface AIDraftReview {
  accepted: boolean;
  humanReviewRequired: true;
  violations: string[];
}

const forbiddenConclusion = /\b(PV nul|avis nul|radar illégal|agent non assermenté|incompétent)\b/i;

export function reviewAIDraft(request: AIDraftRequest): AIDraftReview {
  const violations: string[] = [];
  if (forbiddenConclusion.test(request.draftText)) violations.push("Le projet emploie une conclusion juridique catégorique non portée par le moteur.");
  if (request.draftText.length < 80) violations.push("Projet trop court pour être contrôlé.");
  if (request.audit.anomalies.length === 0 && /irrégularité certaine|annulation certaine/i.test(request.draftText)) {
    violations.push("Le projet transforme l'absence d'anomalie détectée en certitude juridique.");
  }
  return { accepted: violations.length === 0, humanReviewRequired: true, violations };
}
