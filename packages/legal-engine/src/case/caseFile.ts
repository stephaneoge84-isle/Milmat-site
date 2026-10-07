import type { CaseContext, LegalAudit, Regime } from "../types";

export type CaseEvidenceOrigin =
  | "USER_DECLARATION"
  | "DOCUMENT"
  | "EXTRACTION"
  | "LEGAL_ENGINE"
  | "ADMINISTRATION"
  | "UNKNOWN";

export type CaseEvidenceStatus =
  | "DECLARED"
  | "EXTRACTED"
  | "VERIFIED"
  | "CONTRADICTED"
  | "MISSING"
  | "UNCERTAIN";

export interface CaseEvidence {
  key: string;
  label: string;
  value?: unknown;
  origin: CaseEvidenceOrigin;
  status: CaseEvidenceStatus;
  sourceDocument?: string;
  notes?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type?: string;
  available: boolean;
  uploaded: boolean;
  notes?: string;
}

export interface CaseFact {
  key: string;
  value: string;
  origin: "USER_DECLARATION" | "DOCUMENT" | "EXTRACTION" | "ADMINISTRATION";
  certainty: "CERTAIN" | "UNCERTAIN";
}

export interface CaseGround {
  code: string;
  label: string;
  selected: boolean;
  userDeclared: boolean;
}

export interface CaseFile {
  schemaVersion: "1.0";
  caseId: string;
  createdAt: string;
  updatedAt: string;

  regime: Regime;
  infractionDate?: string;
  notificationDate?: string;

  facts: CaseFact[];
  userNarrative: string;
  uncertainties: string[];

  documents: CaseDocument[];
  evidence: CaseEvidence[];
  grounds: CaseGround[];

  legalAudit?: LegalAudit;
  generatedRequests: string[];
  humanReviewRequired: boolean;
}

export interface CaseFileInput {
  caseId?: string;
  createdAt?: string;
  updatedAt?: string;
  regime: Regime;
  infractionDate?: string;
  notificationDate?: string;
  userExplanation: string;
  answers?: Record<string, string>;
  documents?: string[];
  extractedData?: Record<string, unknown>;
  documentEvidence?: Record<string, unknown>;
  selectedGround?: string;
  caseContext?: CaseContext;
}

const nowIso = () => new Date().toISOString();

export function buildCaseFile(input: CaseFileInput): CaseFile {
  const now = nowIso();
  const answers = input.answers ?? {};
  const documents = input.documents ?? [];
  const extractedData = input.extractedData ?? {};
  const documentEvidence = input.documentEvidence ?? {};

  const facts: CaseFact[] = [
    {
      key: "userExplanation",
      value: input.userExplanation,
      origin: "USER_DECLARATION",
      certainty: "CERTAIN",
    },
    ...Object.entries(answers)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => ({
        key,
        value,
        origin: "USER_DECLARATION" as const,
        certainty: value === "Je ne sais pas" ? "UNCERTAIN" as const : "CERTAIN" as const,
      })),
  ];

  const evidence: CaseEvidence[] = [
    ...Object.entries(extractedData).map(([key, value]) => ({
      key,
      label: key,
      value,
      origin: "EXTRACTION" as const,
      status: value === undefined || value === "" ? "UNCERTAIN" as const : "EXTRACTED" as const,
    })),
    ...Object.entries(documentEvidence).map(([key, value]) => ({
      key,
      label: key,
      value,
      origin: "DOCUMENT" as const,
      status: value === true ? "VERIFIED" as const : value === false ? "MISSING" as const : "UNCERTAIN" as const,
    })),
  ];

  const grounds: CaseGround[] = input.selectedGround
    ? [{
        code: input.selectedGround,
        label: input.selectedGround,
        selected: true,
        userDeclared: true,
      }]
    : [];

  return {
    schemaVersion: "1.0",
    caseId: input.caseId ?? `CASE-${input.infractionDate ?? "UNKNOWN"}-${now.replace(/\\D/g, "").slice(0, 14)}`,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    regime: input.regime,
    infractionDate: input.infractionDate,
    notificationDate: input.notificationDate,
    facts,
    userNarrative: input.userExplanation,
    uncertainties: input.caseContext?.userUncertainties ?? [],
    documents: documents.map((name, index) => ({
      id: `DOC-${index + 1}`,
      name,
      available: true,
      uploaded: false,
    })),
    evidence,
    grounds,
    generatedRequests: [],
    humanReviewRequired: input.caseContext?.currentDocumentType === "UNKNOWN",
  };
}

export function attachLegalAudit(caseFile: CaseFile, audit: LegalAudit): CaseFile {
  return {
    ...caseFile,
    updatedAt: nowIso(),
    legalAudit: audit,
    generatedRequests: [...new Set(audit.requests)],
    humanReviewRequired:
      caseFile.humanReviewRequired ||
      audit.anomalies.length > 0 ||
      audit.checks.some(c => c.status === "A_VERIFIER"),
  };
}
