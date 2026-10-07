import {
  CaseContext,
  CaseQualification,
  CurrentDocumentType,
  InitialNoticeReception,
} from "../types/caseContext";

export function qualifyCaseContext(context: CaseContext): CaseQualification {
  const requiresReceptionCheck =
    context.initialNoticeReception !== "RECEIVED" ||
    context.currentDocumentType === "AMENDE_FORFAITAIRE_MAJORÉE" ||
    context.currentDocumentType === "LETTRE_RAPPEL";

  let situation: CaseQualification["situation"] = "UNCERTAIN";

  if (context.currentDocumentType === "FPS") {
    situation = "FPS";
  } else if (
    context.currentDocumentType === "LETTRE_RAPPEL"
  ) {
    situation = "REMINDER";
  } else if (
    context.currentDocumentType === "AMENDE_FORFAITAIRE_MAJORÉE" &&
    context.initialNoticeReception === "NOT_RECEIVED"
  ) {
    situation = "MAJORATION_WITHOUT_INITIAL_NOTICE";
  } else if (
    context.currentDocumentType === "AVIS_CONTRAVENTION" &&
    context.initialNoticeReception === "RECEIVED"
  ) {
    situation = "INITIAL_NOTICE";
  } else if (context.currentDocumentType === "AUTRE") {
    situation = "OTHER";
  }

  const factsToClarify: string[] = [];
  if (context.initialNoticeReception === "NOT_RECEIVED") {
    factsToClarify.push("Date and circumstances of the first document actually received");
    factsToClarify.push("Address known to the administration at the relevant dates");
  }
  if (context.initialNoticeReception === "UNSURE") {
    factsToClarify.push("Whether an initial notice was actually received");
  }
  if (!context.dateCurrentDocumentReceived) {
    factsToClarify.push("Date the current document was actually received");
  }

  const generatedRequests: string[] = [];
  if (requiresReceptionCheck) {
    generatedRequests.push(
      "Demander, lorsque pertinent, la date d'envoi, le type d'envoi et les éléments permettant d'établir la notification du document antérieur."
    );
  }

  return {
    situation,
    requiresReceptionCheck,
    narrativePriority:
      context.userExplanation.trim().length > 0 ||
      context.specificRequests?.trim().length
        ? "HIGH"
        : "MEDIUM",
    factsToClarify,
    generatedRequests,
  };
}
