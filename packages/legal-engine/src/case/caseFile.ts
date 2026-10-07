import type { CaseContext, LegalAudit, Regime, RuleInput } from "../types";
import type { ContestGround } from "../contest/contestGrounds";

export type CaseEvidenceOrigin = "USER_DECLARATION" | "DOCUMENT" | "EXTRACTION" | "LEGAL_ENGINE" | "ADMINISTRATION" | "UNKNOWN";
export type CaseEvidenceStatus = "DECLARED" | "EXTRACTED" | "VERIFIED" | "CONTRADICTED" | "MISSING" | "UNCERTAIN";

export interface CaseEvidence {
  key: string;
  value: unknown;
  origin: CaseEvidenceOrigin;
  status: CaseEvidenceStatus;
  sourceDocumentId?: string;
  sourceLocator?: string;
  asOf?: string;
  note?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type?: string;
  available: boolean;
  uploaded: boolean;
  extracted: boolean;
  hash?: string;
  addedAt: string;
}

export interface CaseFact {
  key: string;
  value: unknown;
  source: "USER" | "DOCUMENT" | "EXTRACTION" | "ENGINE";
  confidence: "DECLARED" | "EXTRACTED" | "VERIFIED" | "UNCERTAIN";
}

export interface CaseGround {
  code: ContestGround | "UNDETERMINED";
  label: string;
  source: "USER" | "ENGINE";
}

export interface CaseAssessment {
  status: "CONFORME" | "NON_DEMONTRE" | "INCOHERENCE_APPARENTE" | "A_VERIFIER" | "IRREGULARITE_POTENTIELLE";
  blockers: string[];
  nextActions: string[];
}

export interface CaseRevision {
  revision: number;
  createdAt: string;
  reason: string;
  ruleVersionDate: string;
  snapshotHash?: string;
}

export interface CaseFile {
  schemaVersion: "1.0";
  caseId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  regime: Regime;
  infractionDate: string;
  notificationDate?: string;
  caseContext?: CaseContext;
  facts: CaseFact[];
  evidence: CaseEvidence[];
  documents: CaseDocument[];
  grounds: CaseGround[];
  audit?: LegalAudit;
  assessment?: CaseAssessment;
  generatedRequests: string[];
  humanReviewRequired: boolean;
  revisions: CaseRevision[];
}

export interface CaseFileInput {
  caseId?: string;
  regime: Regime;
  infractionDate: string;
  notificationDate?: string;
  caseContext?: CaseContext;
  userExplanation?: string;
  answers?: Record<string, string>;
  documents?: string[];
  extractedData?: Record<string, unknown>;
  documentEvidence?: Record<string, unknown>;
  selectedGround?: ContestGround;
}

const now = () => new Date().toISOString();

function evidenceStatus(origin: CaseEvidenceOrigin, value: unknown): CaseEvidenceStatus {
  if (value === undefined || value === null || value === "") return "MISSING";
  if (origin === "EXTRACTION") return "EXTRACTED";
  if (origin === "DOCUMENT") return "VERIFIED";
  if (origin === "LEGAL_ENGINE") return "VERIFIED";
  return "DECLARED";
}

export function buildCaseFile(input: CaseFileInput): CaseFile {
  const timestamp = now();
  const caseId = input.caseId ?? `case-${input.infractionDate}-${Date.now()}`;
  const facts: CaseFact[] = [];
  const evidence: CaseEvidence[] = [];

  if (input.userExplanation) facts.push({ key: "userExplanation", value: input.userExplanation, source: "USER", confidence: "DECLARED" });
  for (const [key, value] of Object.entries(input.answers ?? {})) {
    facts.push({ key, value, source: "USER", confidence: "DECLARED" });
  }
  for (const [key, value] of Object.entries(input.extractedData ?? {})) {
    evidence.push({ key, value, origin: "EXTRACTION", status: evidenceStatus("EXTRACTION", value), asOf: timestamp });
  }
  for (const [key, value] of Object.entries(input.documentEvidence ?? {})) {
    evidence.push({ key, value, origin: "DOCUMENT", status: evidenceStatus("DOCUMENT", value), asOf: timestamp });
  }
  for (const [key, value] of Object.entries(input.answers ?? {})) {
    evidence.push({ key, value, origin: "USER_DECLARATION", status: evidenceStatus("USER_DECLARATION", value), asOf: timestamp });
  }

  const documents = (input.documents ?? []).map((name, index) => ({
    id: `doc-${index + 1}`,
    name,
    available: true,
    uploaded: false,
    extracted: false,
    addedAt: timestamp,
  }));

  const ground = input.selectedGround
    ? [{ code: input.selectedGround, label: input.selectedGround, source: "USER" as const }]
    : [{ code: "UNDETERMINED" as const, label: "Non déterminé", source: "ENGINE" as const }];

  return {
    schemaVersion: "1.0",
    caseId,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    regime: input.regime,
    infractionDate: input.infractionDate,
    notificationDate: input.notificationDate,
    caseContext: input.caseContext,
    facts,
    evidence,
    documents,
    grounds: ground,
    generatedRequests: [],
    humanReviewRequired: false,
    revisions: [{ revision: 1, createdAt: timestamp, reason: "Initialisation du dossier", ruleVersionDate: input.infractionDate }],
  };
}

export function buildRuleInputFromCase(caseFile: CaseFile): RuleInput {
  const extractedData: Record<string, unknown> = {};
  const documentEvidence: Record<string, unknown> = {};
  for (const item of caseFile.evidence) {
    if (item.origin === "DOCUMENT" || item.status === "VERIFIED") documentEvidence[item.key] = item.value;
    else extractedData[item.key] = item.value;
  }
  return {
    infractionDate: caseFile.infractionDate,
    regime: caseFile.regime,
    extractedData,
    documentEvidence,
    availableDocuments: caseFile.documents.filter(d => d.available).map(d => d.name),
    caseContext: caseFile.caseContext,
    caseFile,
  };
}

export function attachLegalAudit(caseFile: CaseFile, audit: LegalAudit): CaseFile {
  const timestamp = now();
  const humanReviewRequired = Boolean(audit.anomalies.length || audit.checks.some(c => c.status === "A_VERIFIER" || c.status === "PRESENT_INCOHERENT"));
  return {
    ...caseFile,
    updatedAt: timestamp,
    revision: caseFile.revision + 1,
    audit,
    assessment: {
      status: audit.anomalies.length ? "INCOHERENCE_APPARENTE" : audit.checks.some(c => c.status === "A_VERIFIER") ? "A_VERIFIER" : audit.checks.some(c => c.status === "NON_DEMONTRE") ? "NON_DEMONTRE" : "CONFORME",
      blockers: audit.anomalies.map(a => a.finding),
      nextActions: audit.requests,
    },
    generatedRequests: audit.requests,
    humanReviewRequired: caseFile.humanReviewRequired || humanReviewRequired,
    revisions: [...caseFile.revisions, {
      revision: caseFile.revision + 1,
      createdAt: timestamp,
      reason: "Audit juridique déterministe",
      ruleVersionDate: audit.legalVersionDate,
    }],
  };
}

export function assertCaseFileIntegrity(caseFile: CaseFile): void {
  if (!caseFile.caseId || !caseFile.infractionDate || !caseFile.regime) throw new Error("CASE incomplet");
  if (caseFile.revision < 1 || caseFile.revisions.length < 1) throw new Error("Historique CASE invalide");
  if (caseFile.humanReviewRequired && !caseFile.audit) throw new Error("Revue humaine requise sans audit associé");
}
