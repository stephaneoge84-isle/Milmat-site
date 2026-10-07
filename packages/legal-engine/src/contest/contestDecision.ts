import type { Regime } from "../types";

export type ContestAction = "CONTEST" | "DESIGNATE_DRIVER" | "REQUEST_INFORMATION" | "RAPO_FPS" | "NO_CONTEST";

export interface ContestDecision {
  action: ContestAction;
  paymentWarning: "DO_NOT_PAY" | "CHECK_BEFORE_PAYMENT" | "NO_GENERAL_PAYMENT_WARNING";
  consignment: "NONE" | "MAY_BE_REQUIRED" | "REQUIRED_BY_CASE";
  reason: string;
  proceduralRoute: "ANTAI_ONLINE" | "OMP_POSTAL" | "RAPO" | "OTHER" | "UNDETERMINED";
}

export function determineContestDecision(
  regime: Regime,
  wantsToContest: boolean,
  radarDetected: boolean,
  caseFacts: Record<string, unknown> = {},
): ContestDecision {
  if (!wantsToContest) return {
    action: "NO_CONTEST",
    paymentWarning: "NO_GENERAL_PAYMENT_WARNING",
    consignment: "NONE",
    reason: "Aucune contestation n'est demandée.",
    proceduralRoute: "OTHER",
  };

  if (regime === "FPS") return {
    action: "RAPO_FPS",
    paymentWarning: "CHECK_BEFORE_PAYMENT",
    consignment: "NONE",
    reason: "Le FPS relève d'une procédure distincte : le parcours doit être déterminé à partir de l'avis de paiement et du RAPO.",
    proceduralRoute: "RAPO",
  };

  if (radarDetected || caseFacts.requiresConsignment === true) return {
    action: "CONTEST",
    paymentWarning: "DO_NOT_PAY",
    consignment: "REQUIRED_BY_CASE",
    reason: "La contestation ne doit pas être confondue avec le paiement. Une consignation peut être exigée selon le motif et la nature de l'infraction.",
    proceduralRoute: "ANTAI_ONLINE",
  };

  return {
    action: "CONTEST",
    paymentWarning: "DO_NOT_PAY",
    consignment: "NONE",
    reason: "Le paiement de l'amende forfaitaire vaut reconnaissance de l'infraction. Le parcours de contestation doit être engagé sans payer l'amende, sous réserve des règles particulières applicables au dossier.",
    proceduralRoute: "ANTAI_ONLINE",
  };
}
