export type InitialNoticeReception = "RECEIVED" | "NOT_RECEIVED" | "UNSURE";
export type CurrentDocumentType =
  | "AVIS_CONTRAVENTION"
  | "AMENDE_FORFAITAIRE_MAJORÉE"
  | "LETTRE_RAPPEL"
  | "FPS"
  | "AUTRE"
  | "UNKNOWN";

export interface CaseContext {
  /** Free-form facts supplied by the user before the legal audit. */
  userExplanation: string;

  /** What the user actually received, not what the system assumes they received. */
  currentDocumentType: CurrentDocumentType;

  /** Whether the original notice was received by the user. */
  initialNoticeReception: InitialNoticeReception;

  /** Optional dates supplied by the user. */
  dateCurrentDocumentReceived?: string;
  dateInitialNoticeReceived?: string;

  /** User can explain why the initial notice may not have been received. */
  nonReceptionExplanation?: string;

  /** Other letters, reminders, payment demands or administrative contacts. */
  priorCorrespondence?: string;

  /** Facts the user explicitly wants the final request to address. */
  specificRequests?: string;

  /** Optional contextual facts that may alter qualification without being legal conclusions. */
  contextualFacts?: string[];

  /** Files/documents the user says they possess but has not necessarily uploaded. */
  documentsHeld?: string[];

  /** Preserve uncertainty instead of forcing binary answers. */
  userUncertainties?: string[];
}

export interface CaseQualification {
  situation: "INITIAL_NOTICE" | "MAJORATION_WITHOUT_INITIAL_NOTICE" | "REMINDER" | "FPS" | "OTHER" | "UNCERTAIN";
  requiresReceptionCheck: boolean;
  narrativePriority: "LOW" | "MEDIUM" | "HIGH";
  factsToClarify: string[];
  generatedRequests: string[];
}
