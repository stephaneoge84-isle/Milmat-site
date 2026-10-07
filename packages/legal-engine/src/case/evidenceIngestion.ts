import type { CaseFile, CaseEvidence } from "./caseFile";

export interface ExtractedField {
  key: string;
  value: unknown;
  confidence: number;
  sourceLocator?: string;
}

export interface DocumentExtraction {
  documentId: string;
  documentType?: string;
  fields: ExtractedField[];
  warnings: string[];
}

export function applyDocumentExtraction(caseFile: CaseFile, extraction: DocumentExtraction): CaseFile {
  const timestamp = new Date().toISOString();
  const evidence: CaseEvidence[] = extraction.fields.map(field => ({
    key: field.key,
    value: field.value,
    origin: "EXTRACTION",
    status: field.confidence >= 0.95 ? "EXTRACTED" : "UNCERTAIN",
    sourceDocumentId: extraction.documentId,
    sourceLocator: field.sourceLocator,
    asOf: timestamp,
    note: field.confidence < 0.95 ? "Extraction à vérifier par l'utilisateur." : undefined,
  }));
  return {
    ...caseFile,
    updatedAt: timestamp,
    evidence: [...caseFile.evidence.filter(e => e.sourceDocumentId !== extraction.documentId), ...evidence],
    documents: caseFile.documents.map(d => d.id === extraction.documentId ? {...d, extracted: true, type: extraction.documentType ?? d.type} : d),
    humanReviewRequired: caseFile.humanReviewRequired || extraction.warnings.length > 0 || evidence.some(e => e.status === "UNCERTAIN"),
  };
}
