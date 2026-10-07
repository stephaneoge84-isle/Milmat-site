import type { LegalAudit, RiskLevel, RuleCheck } from "../types";

export interface ContestSuccessEstimate {
  /** @deprecated Kept for backward compatibility; UI must not present this as probability. */
  percentage: number;
  solidite: "FAVORABLE_A_EXAMEN" | "A_COMPLETER" | "INCOHERENCE_APPARENTE" | "AUCUN_MOYEN_IDENTIFIE";
  level: "VERY_LOW" | "LOW" | "MODERATE" | "HIGH";
  decision: "CONTINUE" | "CONTINUE_WITH_CAUTION" | "STOP_AND_REVIEW";
  basis: string[];
  blockers: string[];
  disclaimer: string;
}

function hasSeriousGround(checks: RuleCheck[]): boolean {
  return checks.some(c =>
    c.status === "PRESENT_INCOHERENT" ||
    (c.status === "A_VERIFIER" && (c.risk === "RED" || c.risk === "ORANGE"))
  );
}

/**
 * This is an internal case-strength estimate, not a prediction of an authority's decision.
 * The percentage is retained only for backward compatibility and is not a probability of success.
 * The authoritative UI-facing result is the qualitative `solidite` field.
 */
export function estimateContestSuccess(audit: LegalAudit, explicitGroundFound = false): ContestSuccessEstimate {
  const relevant = audit.checks.filter(c => c.status !== "NON_APPLICABLE");
  const seriousGround = hasSeriousGround(relevant) || explicitGroundFound;
  const unresolved = relevant.filter(c =>
    c.status === "NON_DEMONTRE" || c.status === "A_VERIFIER"
  );
  const incoherent = relevant.filter(c => c.status === "PRESENT_INCOHERENT");

  // A fully compliant, fully demonstrated case with no contestable ground is scored at 0%.
  if (!seriousGround && unresolved.length === 0 && incoherent.length === 0) {
    return {
      percentage: 0,
      solidite: "AUCUN_MOYEN_IDENTIFIE",
      level: "VERY_LOW",
      decision: "STOP_AND_REVIEW",
      basis: ["Tous les contrôles pertinents disponibles sont conformes.", "Aucun moyen de contestation sérieux n'est identifié."],
      blockers: [],
      disclaimer: "Estimation technique du dossier sur la base des éléments fournis ; elle ne préjuge pas de la décision de l'autorité compétente."
    };
  }

  let percentage = 10;
  if (seriousGround) percentage += 45;
  if (incoherent.length > 0) percentage += Math.min(30, incoherent.length * 15);
  if (unresolved.length > 0) percentage += Math.min(20, unresolved.length * 5);

  percentage = Math.min(90, percentage);

  const level = percentage >= 70 ? "HIGH" : percentage >= 40 ? "MODERATE" : percentage >= 20 ? "LOW" : "VERY_LOW";
  const decision = percentage >= 40 ? "CONTINUE" : "CONTINUE_WITH_CAUTION";

  const solidite = incoherent.length > 0
    ? "INCOHERENCE_APPARENTE"
    : unresolved.length > 0
      ? "A_COMPLETER"
      : "FAVORABLE_A_EXAMEN";

  return {
    percentage,
    solidite,
    level,
    decision,
    basis: [
      seriousGround ? "Un moyen de contestation sérieux ou une incohérence a été identifié." : "Aucun moyen décisif n'est actuellement établi.",
      incoherent.length ? `${incoherent.length} incohérence(s) apparente(s) nécessitent une exploitation juridique.` : "Aucune incohérence formelle certaine n'est identifiée.",
      unresolved.length ? `${unresolved.length} point(s) restent à démontrer ou vérifier.` : "Les éléments pertinents sont suffisamment documentés."
    ],
    blockers: unresolved.map(c => c.finding),
    disclaimer: "Estimation technique du dossier sur la base des éléments fournis ; elle ne constitue ni une probabilité scientifique, ni une garantie de succès. Seule l'autorité compétente décide de la suite donnée au recours."
  };
}
