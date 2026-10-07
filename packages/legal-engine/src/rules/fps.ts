import type { LegalRule } from "../types";
import { evidence, check } from "./helpers";

export const fpsRules: LegalRule[] = [
  {
    id: "FPS-MENTIONS-001",
    version: 1,
    status: "ACTIVE",
    regime: ["FPS"],
    title: "Mentions obligatoires de l'avis de paiement FPS",
    description: "L'avis doit comporter les principales mentions réglementaires permettant d'identifier la collectivité, l'agent, le constat, le véhicule, le redevable, le montant et l'envoi.",
    legalReference: "CGCT art. R.2333-120-4",
    officialSource: "Légifrance",
    officialUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919564",
    effectiveFrom: "2025-01-01",
    applicability: () => true,
    requiredEvidence: [
      "collectivité",
      "autorité dont relève l'agent",
      "numéro d'identification de l'agent",
      "date/heure/lieu du constat",
      "immatriculation et marque",
      "date d'envoi",
      "identité et adresse du redevable",
      "montant du FPS",
      "heure de fin d'effet du FPS",
      "signature ou mention « Signé »",
      "numéro de l'avis"
    ],
    evaluate: (i) => {
      const required = [
        "fpsCollectivity",
        "fpsAgentAuthority",
        "fpsAgentId",
        "infractionDateTime",
        "infractionLocation",
        "vehicleRegistration",
        "vehicleBrand",
        "noticeSendDate",
        "liableIdentityAddress",
        "fpsAmount",
        "fpsEndTime",
        "fpsSignature",
        "fpsNoticeNumber"
      ];
      const missing = required.filter(k => !evidence(i, k));
      return missing.length === 0
        ? check("FPS-MENTIONS-001", "PRESENT_CONFORME", "Les principales mentions réglementaires de l'avis FPS sont retrouvées dans les éléments analysés.", required, "Le contrôle formel des mentions identifiées est satisfaisant.")
        : check("FPS-MENTIONS-001", "NON_DEMONTRE", "Une ou plusieurs mentions réglementaires ne sont pas retrouvées dans le document analysé.", required, "Une image ou un scan incomplet ne permet pas de conclure que la mention manque sur l'avis complet.", "Fournir l'avis complet, notamment sa seconde partie et son verso le cas échéant, afin de contrôler toutes les mentions.", "YELLOW");
    },
    consequence: "Un contrôle formel doit porter sur l'avis complet, pas seulement sur une photographie partielle.",
    priority: 140,
    verifiedAt: "2026-10-07"
  },
  {
    id: "FPS-AGENT-002",
    version: 1,
    status: "ACTIVE",
    regime: ["FPS"],
    title: "Identification de l'agent assermenté",
    description: "L'avis doit comporter l'autorité dont relève l'agent et son numéro d'identification. Le serment de l'agent est une condition d'exercice, mais son absence de preuve dans l'avis ne permet pas à elle seule de conclure à un défaut de serment.",
    legalReference: "CGCT art. R.2333-120-4 et R.2333-120-9",
    officialSource: "Légifrance",
    officialUrl: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070633/LEGISCTA000030622707/2026-08-05",
    effectiveFrom: "2020-01-01",
    applicability: () => true,
    requiredEvidence: ["autorité dont relève l'agent", "numéro d'identification de l'agent"],
    evaluate: (i) => {
      const authority = evidence(i, "fpsAgentAuthority");
      const id = evidence(i, "fpsAgentId");
      return authority && id
        ? check("FPS-AGENT-002", "PRESENT_CONFORME", "L'autorité et le numéro d'identification de l'agent sont présents.", ["autorité dont relève l'agent", "numéro d'identification de l'agent"], "Le contrôle des mentions d'identification est satisfaisant.")
        : check("FPS-AGENT-002", "NON_DEMONTRE", "L'autorité ou le numéro d'identification de l'agent n'est pas retrouvé dans les pièces analysées.", ["autorité dont relève l'agent", "numéro d'identification de l'agent"], "L'absence dans une copie partielle ne suffit pas à établir une irrégularité.", "Vérifier l'avis complet et, si la compétence est réellement contestée, examiner les éléments communicables prévus par les textes.", "YELLOW");
    },
    consequence: "Ne pas conclure au défaut de serment ou de compétence à partir d'une simple absence sur la copie.",
    priority: 130,
    verifiedAt: "2026-10-07"
  },
  {
    id: "FPS-RAPO-003",
    version: 1,
    status: "ACTIVE",
    regime: ["FPS"],
    title: "Recours administratif préalable obligatoire",
    description: "La contestation de l'avis de paiement passe par un RAPO auprès de l'entité dont relève l'agent, dans le délai légal.",
    legalReference: "CGCT art. L.2333-87 et R.2333-120-13",
    officialSource: "Légifrance",
    officialUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919622",
    effectiveFrom: "2025-01-01",
    applicability: () => true,
    requiredEvidence: ["date de notification", "entité compétente pour le RAPO"],
    evaluate: (i) => {
      const notification = evidence(i, "noticeNotificationDate");
      const authority = evidence(i, "rapoAuthority");
      return notification && authority
        ? check("FPS-RAPO-003", "PRESENT_CONFORME", "La date de notification et l'autorité destinataire du RAPO sont identifiées.", ["date de notification", "entité compétente pour le RAPO"], "Le délai d'un mois pourra être calculé à partir de la date de notification.")
        : check("FPS-RAPO-003", "NON_DEMONTRE", "Les éléments nécessaires au calcul et à l'adressage du RAPO ne sont pas tous disponibles.", ["date de notification", "entité compétente pour le RAPO"], "Le délai ne doit pas être calculé à partir de la seule date imprimée sur l'avis sans déterminer son mode de notification.", "Préciser le mode de notification et vérifier les coordonnées du service chargé du RAPO.", "ORANGE");
    },
    consequence: "Le délai du RAPO est d'un mois à compter de la notification de l'avis.",
    priority: 150,
    verifiedAt: "2026-10-07"
  }
];
