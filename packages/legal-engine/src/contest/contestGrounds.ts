import type { Regime } from "../types";

export type ContestGround =
  | "REALITY_OF_INFRACTION"
  | "IDENTITY_OR_DRIVER"
  | "VEHICLE_SOLD_TRANSFERRED"
  | "VEHICLE_STOLEN_DESTROYED"
  | "PLATE_OR_IDENTITY_FRAUD"
  | "PROCEDURAL_REGULARITY"
  | "NOTIFICATION_OR_MAJORATION"
  | "RADAR_OR_MEASUREMENT"
  | "PARKING"
  | "FPS"
  | "OTHER"
  | "UNDETERMINED";

export interface ContestGroundInput {
  regime: Regime;
  userExplanation: string;
  selectedGround?: ContestGround;
  extractedData?: Record<string, unknown>;
  caseFacts?: Record<string, unknown>;
}

export interface ContestGroundResult {
  primaryGround: ContestGround;
  secondaryGrounds: ContestGround[];
  questions: string[];
  documentsToRequest: string[];
  procedureHints: string[];
  requiresHumanReview: boolean;
}

const includesAny = (text: string, words: string[]) =>
  words.some(word => text.toLowerCase().includes(word));

export function classifyContestGround(input: ContestGroundInput): ContestGroundResult {
  if (input.selectedGround) {
    return buildResult(input.selectedGround, input.regime);
  }

  const text = input.userExplanation.toLowerCase();

  if (input.regime === "FPS") return buildResult("FPS", input.regime);
  if (includesAny(text, ["vendu", "cédé", "cession"])) return buildResult("VEHICLE_SOLD_TRANSFERRED", input.regime);
  if (includesAny(text, ["volé", "vol", "détruit"])) return buildResult("VEHICLE_STOLEN_DESTROYED", input.regime);
  if (includesAny(text, ["usurpation", "fausse plaque", "plaque usurpée", "identité"])) return buildResult("PLATE_OR_IDENTITY_FRAUD", input.regime);
  if (includesAny(text, ["pas moi", "je ne conduisais pas", "autre conducteur", "conducteur"])) return buildResult("IDENTITY_OR_DRIVER", input.regime);
  if (includesAny(text, ["radar", "vitesse", "cinémomètre", "mesure"])) return buildResult("RADAR_OR_MEASUREMENT", input.regime);
  if (includesAny(text, ["majorée", "majoration", "avis initial", "jamais reçu"])) return buildResult("NOTIFICATION_OR_MAJORATION", input.regime);
  if (includesAny(text, ["stationnement", "garé", "parking"])) {
    return buildResult("PARKING", input.regime);
  }
  if (includesAny(text, ["pv", "procès-verbal", "agent", "irrégulier", "irrégularité"])) {
    return buildResult("PROCEDURAL_REGULARITY", input.regime);
  }

  return buildResult("UNDETERMINED", input.regime);
}

function buildResult(primaryGround: ContestGround, regime: Regime): ContestGroundResult {
  const common = {
    primaryGround,
    secondaryGrounds: [] as ContestGround[],
    questions: [] as string[],
    documentsToRequest: [] as string[],
    procedureHints: [] as string[],
    requiresHumanReview: false,
  };

  switch (primaryGround) {
    case "REALITY_OF_INFRACTION":
      common.questions.push("Quels faits précis vous conduisent à contester l'infraction ?");
      break;
    case "IDENTITY_OR_DRIVER":
      common.questions.push("Qui conduisait ou qui était responsable du véhicule à la date des faits ?");
      common.documentsToRequest.push("Tout justificatif permettant d'établir l'identité ou la situation du conducteur.");
      break;
    case "VEHICLE_SOLD_TRANSFERRED":
      common.documentsToRequest.push("Certificat ou déclaration de cession et tout justificatif daté de la cession.");
      break;
    case "VEHICLE_STOLEN_DESTROYED":
      common.documentsToRequest.push("Récépissé de plainte, justificatif de destruction ou document équivalent selon le cas.");
      break;
    case "PLATE_OR_IDENTITY_FRAUD":
      common.documentsToRequest.push("Récépissé de plainte et documents permettant d'établir l'usurpation.");
      break;
    case "PROCEDURAL_REGULARITY":
      common.questions.push("Quel élément du PV ou de la procédure souhaitez-vous faire vérifier ?");
      common.requiresHumanReview = true;
      break;
    case "NOTIFICATION_OR_MAJORATION":
      common.questions.push("Quel document avez-vous réellement reçu et avez-vous reçu l'avis initial ?");
      common.documentsToRequest.push("Avis reçu, lettre de rappel, enveloppes ou courriers conservés et justificatifs d'adresse utiles.");
      break;
    case "RADAR_OR_MEASUREMENT":
      common.questions.push("Contestez-vous la réalité de la vitesse, l'identification du véhicule, la mesure ou la procédure de contrôle ?");
      common.documentsToRequest.push("Avis complet et, si disponible, tout document relatif au véhicule ou au conducteur.");
      common.procedureHints.push("Vérifier séparément la question d'une éventuelle consignation.");
      common.requiresHumanReview = true;
      break;
    case "PARKING":
      common.questions.push("S'agit-il d'une contravention de stationnement ou d'un forfait post-stationnement (FPS) ?");
      break;
    case "FPS":
      common.procedureHints.push("Vérifier le RAPO et les règles propres au FPS.");
      break;
    case "OTHER":
      common.questions.push("Décrivez précisément le motif de contestation.");
      common.requiresHumanReview = true;
      break;
    case "UNDETERMINED":
      common.questions.push("Quel est le motif principal pour lequel vous souhaitez contester ?");
      common.requiresHumanReview = true;
      break;
  }

  if (regime === "UNKNOWN") common.requiresHumanReview = true;
  return common;
}
