import type { LegalRule } from "../types";
import { evidence, check } from "./helpers";

export const parkingRules: LegalRule[] = [
  {
    id: "STATIONNEMENT-NATURE-001",
    version: 1,
    status: "ACTIVE",
    regime: ["STATIONNEMENT_CONTRAVENTION"],
    title: "Nature précise de l'infraction de stationnement",
    description: "L'analyse doit identifier l'infraction et le texte réglementaire invoqué avant de conclure sur sa régularité.",
    legalReference: "Code de la route, chapitre VII, articles R.417-1 à R.417-13",
    officialSource: "Légifrance",
    officialUrl: "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006074228/",
    effectiveFrom: "2018-01-01",
    applicability: () => true,
    requiredEvidence: ["nature de l'infraction", "référence réglementaire"],
    evaluate: (i) => {
      const nature = evidence(i, "parkingOffenceNature");
      const reference = evidence(i, "parkingLegalReference");
      return nature && reference
        ? check("STATIONNEMENT-NATURE-001", "PRESENT_CONFORME", "La nature de l'infraction et sa référence réglementaire sont identifiées.", ["nature de l'infraction", "référence réglementaire"], "Le point est documenté.")
        : check("STATIONNEMENT-NATURE-001", "NON_DEMONTRE", "La nature précise de l'infraction et/ou sa référence réglementaire n'est pas suffisamment démontrée par les éléments disponibles.", ["nature de l'infraction", "référence réglementaire"], "Impossible de qualifier précisément la règle applicable à partir des seules pièces disponibles.", "Identifier la qualification exacte de l'infraction et le texte réglementaire mentionné sur l'avis ou le PV.", "YELLOW");
    },
    consequence: "La règle applicable dépend de la qualification exacte du stationnement.",
    priority: 120,
    verifiedAt: "2026-10-07"
  },
  {
    id: "STATIONNEMENT-CONSTAT-002",
    version: 1,
    status: "ACTIVE",
    regime: ["STATIONNEMENT_CONTRAVENTION"],
    title: "Éléments matériels du constat",
    description: "Le dossier doit permettre de distinguer ce qui a été constaté de ce qui manque dans le document remis à l'usager.",
    legalReference: "Code de procédure pénale art. 537",
    officialSource: "Légifrance",
    officialUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006576893",
    effectiveFrom: "2005-04-01",
    applicability: () => true,
    requiredEvidence: ["date et heure du constat", "lieu du constat", "description du comportement ou de la situation"],
    evaluate: (i) => {
      const dateTime = evidence(i, "infractionDateTime");
      const location = evidence(i, "infractionLocation");
      const description = evidence(i, "parkingObservation");
      return dateTime && location && description
        ? check("STATIONNEMENT-CONSTAT-002", "PRESENT_CONFORME", "Les principaux éléments matériels du constat sont présents.", ["date et heure du constat", "lieu du constat", "description du comportement ou de la situation"], "Les éléments sont documentés dans les pièces disponibles.")
        : check("STATIONNEMENT-CONSTAT-002", "NON_DEMONTRE", "Un ou plusieurs éléments matériels du constat ne sont pas retrouvés dans les données analysées.", ["date et heure du constat", "lieu du constat", "description du comportement ou de la situation"], "L'absence d'une donnée dans le document fourni ne permet pas, à elle seule, de conclure à une irrégularité du PV.", "Vérifier le PV, l'avis complet et les éventuelles pièces associées pour identifier les éléments du constat.", "YELLOW");
    },
    consequence: "Une donnée manquante doit être vérifiée avant toute conclusion sur la preuve.",
    priority: 110,
    verifiedAt: "2026-10-07"
  },
  {
    id: "STATIONNEMENT-AGENT-003",
    version: 1,
    status: "ACTIVE",
    regime: ["STATIONNEMENT_CONTRAVENTION"],
    title: "Qualité et compétence de l'agent",
    description: "La compétence de la personne ayant constaté la contravention doit pouvoir être vérifiée lorsqu'elle est contestée.",
    legalReference: "Code de la route art. L.130-4",
    officialSource: "Légifrance",
    officialUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045072417",
    effectiveFrom: "2022-01-26",
    applicability: () => true,
    requiredEvidence: ["qualité/catégorie de l'agent"],
    evaluate: (i) => evidence(i, "agentCompetence") === true
      ? check("STATIONNEMENT-AGENT-003", "PRESENT_CONFORME", "La compétence de l'agent est indiquée comme établie.", ["qualité/catégorie de l'agent"], "Condition satisfaite.")
      : check("STATIONNEMENT-AGENT-003", "NON_DEMONTRE", "La compétence de l'agent n'est pas démontrée par les pièces disponibles.", ["qualité/catégorie de l'agent"], "Une information absente de l'avis ne suffit pas à établir l'incompétence de l'agent.", "Vérifier la qualité de l'agent et le texte fondant sa compétence pour l'infraction concernée.", "YELLOW"),
    consequence: "Ne pas conclure à l'incompétence sans élément juridique précis.",
    priority: 100,
    verifiedAt: "2026-10-07"
  }
];
