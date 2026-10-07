import type { LegalRule } from "../types";
import { evidence, check } from "./helpers";

const yes = (i: any, key: string) => (i.extractedData.contestAnswers ?? {})[key] === "Oui";

export const fpsRules: LegalRule[] = [
  {
    id:"FPS-MENTIONS-001", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Mentions obligatoires de l'avis de paiement FPS",
    description:"Contrôle séparé des deux parties de l'avis selon l'article R.2333-120-4.",
    legalReference:"CGCT art. R.2333-120-4", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919734",
    effectiveFrom:"2025-01-01", applicability:()=>true,
    requiredEvidence:["partie 1 complète","partie 2 complète","collectivité","autorité et coordonnées","agent","constat","véhicule","redevable/envoi","montant","fin FPS","signature","numéro avis","paiement","date limite","conséquence impayé","RAPO","coordonnées RAPO","délai et modalités RAPO","silence/rejet","tribunal","accès/rectification"],
    evaluate:i=>{
      const required=["fpsNoticePart1Complete","fpsNoticePart2Complete","fpsCollectivity","fpsAgentAuthority","fpsAgentId","infractionDateTime","infractionLocation","vehicleRegistration","vehicleBrand","fpsAmount","fpsEndTime","fpsSignature","fpsNoticeNumber","paymentServiceCoordinates","paymentMethods","paymentDeadline","nonPaymentConsequence","rapoMandatory","rapoAuthority","rapoDeadlineAndMethod","rapoSilenceRejection","tribunalAppealInfo","dataAccessRectification"];
      const missing=required.filter(k=>!evidence(i,k));
      return missing.length===0
        ? check("FPS-MENTIONS-001","PRESENT_CONFORME","Les mentions contrôlées des deux parties de l'avis sont retrouvées.",required,"Le contrôle formel est complet.")
        : check("FPS-MENTIONS-001","NON_DEMONTRE","Une ou plusieurs mentions de l'avis complet ne sont pas démontrées dans les éléments analysés.",required,"Une pièce partielle ne permet pas de conclure à l'absence de la mention.","Fournir l'avis complet et contrôler séparément ses deux parties.","YELLOW");
    },
    consequence:"Une absence dans la copie analysée n'établit pas à elle seule l'absence sur l'avis complet.", priority:170, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-AGENT-002", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Agent assermenté : identification et compétence",
    description:"L'avis identifie l'agent et son autorité ; l'assermentation est contrôlable dans le recueil prévu par le texte lorsqu'une procédure contentieuse met en cause la compétence.",
    legalReference:"CGCT art. R.2333-120-4 et R.2333-120-9", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039066466",
    effectiveFrom:"2020-01-01", applicability:()=>true,
    requiredEvidence:["autorité","numéro agent","preuve/recueil d'assermentation si compétence contestée"],
    evaluate:i=>{
      const authority=evidence(i,"fpsAgentAuthority"), id=evidence(i,"fpsAgentId");
      if(!authority||!id) return check("FPS-AGENT-002","NON_DEMONTRE","L'autorité ou l'identifiant de l'agent n'est pas démontré.","autorité et numéro d'identification","Ne pas conclure au défaut de serment à partir de cette seule absence.","Contrôler l'avis complet puis, si la compétence est mise en cause, demander les éléments communicables du recueil.","YELLOW");
      if(evidence(i,"agentOathVerified")===false) return check("FPS-AGENT-002","PRESENT_INCOHERENT","Un élément indique une difficulté concernant l'assermentation de l'agent.","preuve d'assermentation","Une vérification formelle est nécessaire avant toute conclusion.","Documenter précisément l'élément contradictoire.","ORANGE");
      return check("FPS-AGENT-002","PRESENT_CONFORME","L'autorité et le numéro d'identification sont présents ; aucune contradiction sur l'assermentation n'est établie.","autorité et numéro d'identification","La compétence reste vérifiable selon le mécanisme prévu par R.2333-120-9.");
    },
    consequence:"Le recueil de R.2333-120-9 n'est pas à traiter comme une pièce publique ordinaire.", priority:160, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-RAPO-003", version:2, status:"ACTIVE", regime:["FPS"],
    title:"RAPO obligatoire et recevabilité",
    description:"Le RAPO est obligatoire avant la juridiction et doit être exercé dans le mois suivant la notification.",
    legalReference:"CGCT art. L.2333-87 et R.2333-120-13", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030622745",
    effectiveFrom:"2018-01-01", applicability:()=>true,
    requiredEvidence:["notification","autorité RAPO","délai","modalités","pièces"],
    evaluate:i=>{
      const notification=evidence(i,"noticeNotificationDate"), authority=evidence(i,"rapoAuthority");
      const deadline=evidence(i,"rapoDeadlineAndMethod"), docs=evidence(i,"rapoRequiredDocuments");
      return notification&&authority&&deadline&&docs
        ? check("FPS-RAPO-003","PRESENT_CONFORME","Les éléments nécessaires à la préparation du RAPO sont renseignés.","notification, autorité, délai, modalités et pièces","Le dossier peut être préparé sous réserve de validation humaine.")
        : check("FPS-RAPO-003","NON_DEMONTRE","La recevabilité du RAPO n'est pas entièrement documentée.","notification, autorité, délai, modalités et pièces","Le délai ne doit pas être calculé sur une date supposée.","Établir la notification et vérifier l'autorité, les modalités et les pièces exigées.","ORANGE");
    },
    consequence:"Le RAPO doit précéder toute saisine de la juridiction compétente.", priority:180, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-PAIEMENT-004", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Paiement préalable et déduction",
    description:"Une redevance réglée dès le début du stationnement peut être déduite si les conditions de R.2333-120-5 sont réunies.",
    legalReference:"CGCT art. R.2333-120-5", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070633/LEGISCTA000030622719/2026-02-20",
    effectiveFrom:"2018-01-01", applicability:i=>i.extractedData.fpsTopic==="paiement",
    requiredEvidence:["justificatif de paiement","horodatage","validité du justificatif","durée maximale non expirée"],
    evaluate:i=>{
      const paid=yes(i,"Paiement effectué ?"), proof=yes(i,"Justificatif ?"), time=yes(i,"Horodatage"), proofDoc=Boolean(i.documentEvidence.paymentProof || i.extractedData.paymentProof);
      return paid&&proof&&time&&proofDoc
        ? check("FPS-PAIEMENT-004","A_VERIFIER","Le paiement préalable est déclaré et documenté ; ses conditions juridiques précises doivent être vérifiées.","justificatif, horodatage, validité, durée","La preuve doit être rapprochée de l'article R.2333-120-5.","Contrôler l'horodatage, le justificatif et l'expiration éventuelle de la durée maximale.","ORANGE")
        : check("FPS-PAIEMENT-004","NON_DEMONTRE","Le paiement préalable ou ses conditions de prise en compte ne sont pas suffisamment démontrés.","justificatif, horodatage, validité, durée","Ne pas déduire un droit à déduction d'une simple déclaration.","Fournir le justificatif et ses éléments d'horodatage.","YELLOW");
    },
    consequence:"Le droit à déduction dépend des conditions réglementaires, pas de la seule existence d'un paiement.", priority:150, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-REDEVABLE-005", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Qualité du redevable",
    description:"La personne tenue au paiement doit être déterminée selon les situations prévues par L.2333-87.",
    legalReference:"CGCT art. L.2333-87", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919622",
    effectiveFrom:"2025-01-01", applicability:i=>i.extractedData.fpsTopic==="vehicule",
    requiredEvidence:["titulaire carte grise","locataire/acquéreur le cas échéant","justificatif daté"],
    evaluate:i=>{
      const sale=yes(i,"Cession / vente"), proof=Boolean(i.documentEvidence.saleDocument), reg=Boolean(i.documentEvidence.registrationCertificate);
      return sale&&proof ? check("FPS-REDEVABLE-005","A_VERIFIER","Une cession/vente antérieure est déclarée et documentée ; son effet sur la qualité de redevable doit être juridiquement qualifié.","situation du redevable","La seule cession déclarée ne suffit pas à conclure.","Vérifier les dates, la qualité du titulaire et le régime applicable à la date du constat.","ORANGE")
        : reg ? check("FPS-REDEVABLE-005","NON_DEMONTRE","La carte grise est disponible mais la contestation de la qualité de redevable n'est pas établie.","situation du redevable","Identifier précisément la qualité contestée.","Produire les justificatifs datés de la situation du véhicule.","YELLOW")
        : check("FPS-REDEVABLE-005","NON_DEMONTRE","La qualité du redevable n'est pas suffisamment documentée.","situation du redevable","Aucune conclusion ne peut être tirée sans pièces.","Fournir carte grise et, selon le cas, contrat, cession ou justificatif pertinent.","YELLOW");
    },
    consequence:"La qualité de redevable doit être appréciée à la date du constat.", priority:130, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-DOCUMENT-006", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Incohérence entre mentions de l'avis",
    description:"Une contradiction entre deux mentions doit être démontrée sur le document complet.",
    legalReference:"CGCT art. R.2333-120-4", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919734",
    effectiveFrom:"2025-01-01", applicability:i=>i.extractedData.fpsTopic==="document",
    requiredEvidence:["avis complet","deux mentions contradictoires"],
    evaluate:i=>{
      const contradiction=yes(i,"Incohérence");
      return contradiction ? check("FPS-DOCUMENT-006","A_VERIFIER","Une contradiction est déclarée ; elle doit être reproduite et contrôlée sur l'avis complet.","avis complet et deux mentions","La contradiction déclarée n'est pas encore une irrégularité juridique.","Identifier les deux mentions, leur emplacement et leur effet juridique potentiel.","ORANGE")
        : check("FPS-DOCUMENT-006","NON_DEMONTRE","Aucune contradiction précise n'est démontrée.","avis complet et deux mentions","Une copie partielle ne permet pas d'exclure ou d'établir une contradiction.","Fournir l'avis complet et le point précis contesté.","YELLOW");
    },
    consequence:"Le moteur distingue contradiction factuelle et conséquence juridique.", priority:125, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-NOTIFICATION-007", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Notification et point de départ des délais",
    description:"Les délais sont calculés à partir de la notification pertinente, pas d'une date supposée.",
    legalReference:"CGCT art. L.2333-87 et R.2333-120-13", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030622745",
    effectiveFrom:"2018-01-01", applicability:i=>i.extractedData.fpsTopic==="notification",
    requiredEvidence:["mode de notification","date de notification","preuve de notification"],
    evaluate:i=>{
      const date=evidence(i,"noticeNotificationDate"), mode=evidence(i,"notificationMode"), proof=evidence(i,"notificationProof");
      return date&&mode&&proof ? check("FPS-NOTIFICATION-007","PRESENT_CONFORME","La notification est documentée par une date, un mode et un élément de preuve.","notification","Le délai peut être calculé à partir de cette notification.")
        : check("FPS-NOTIFICATION-007","NON_DEMONTRE","La notification n'est pas entièrement établie.","mode, date et preuve","La date imprimée sur l'avis n'est pas nécessairement la date de notification.","Documenter le mode et la date effective de notification.","ORANGE");
    },
    consequence:"Sans notification établie, le moteur ne présente pas une date limite comme certaine.", priority:165, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-MONTANT-008", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Montant et barème applicable",
    description:"Le montant du FPS doit être rapproché du barème de paiement immédiat et, le cas échéant, des sommes déductibles.",
    legalReference:"CGCT art. L.2333-87 et R.2333-120-5", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919622",
    effectiveFrom:"2018-01-01", applicability:i=>i.extractedData.fpsTopic==="montant",
    requiredEvidence:["montant FPS","zone","barème applicable","paiement déductible éventuel"],
    evaluate:i=>{
      const calc=yes(i,"Calcul"), prior=yes(i,"Paiement préalable");
      return calc||prior ? check("FPS-MONTANT-008","A_VERIFIER","Un élément de calcul ou de paiement préalable est déclaré et doit être rapproché du barème applicable.","montant, zone, barème, déduction","Aucune erreur de montant n'est présumée sans comparaison avec le barème.","Produire le barème applicable et le justificatif de paiement le cas échéant.","ORANGE")
        : check("FPS-MONTANT-008","NON_DEMONTRE","Aucun élément précis ne permet actuellement de contrôler le montant.","montant, zone, barème","Le montant affiché n'est pas présumé erroné.","Identifier la zone, le barème et le calcul contesté.","YELLOW");
    },
    consequence:"Le contrôle du montant nécessite le barème applicable à la zone et à la date.", priority:135, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-APPEAL-009", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Information sur le recours juridictionnel",
    description:"La seconde partie de l'avis doit informer sur le rejet implicite, le tribunal du stationnement payant et le délai de recours.",
    legalReference:"CGCT art. R.2333-120-4 et R.2333-120-33", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919734",
    effectiveFrom:"2025-01-01", applicability:i=>i.extractedData.fpsTopic==="document"||i.extractedData.fpsTopic==="notification",
    requiredEvidence:["silence vaut rejet","tribunal du stationnement payant","délai d'un mois","paiement préalable"],
    evaluate:i=>{
      const all=["rapoSilenceRejection","tribunalAppealInfo","tribunalAppealDeadline","tribunalPriorPayment"].every(k=>Boolean(evidence(i,k)));
      return all ? check("FPS-APPEAL-009","PRESENT_CONFORME","Les informations juridictionnelles sont retrouvées.","informations de recours","Le contrôle formel de ces mentions est satisfaisant.")
        : check("FPS-APPEAL-009","NON_DEMONTRE","Les informations de recours juridictionnel ne sont pas toutes démontrées.","rejet implicite, tribunal, délai, paiement préalable","Une copie partielle ne suffit pas à conclure à leur absence.","Contrôler la seconde partie de l'avis.","YELLOW");
    },
    consequence:"Les conditions de saisine juridictionnelle doivent rester distinctes du RAPO.", priority:120, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-DATA-010", version:2, status:"ACTIVE", regime:["FPS"],
    title:"Information sur les droits d'accès et de rectification",
    description:"Lorsque le traitement est automatisé, l'avis doit indiquer la possibilité d'exercer les droits d'accès et de rectification.",
    legalReference:"CGCT art. R.2333-120-4", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919734",
    effectiveFrom:"2025-01-01", applicability:i=>i.extractedData.fpsTopic==="document"||i.extractedData.fpsTopic==="notification",
    requiredEvidence:["mention accès et rectification"],
    evaluate:i=>evidence(i,"dataAccessRectification")
      ? check("FPS-DATA-010","PRESENT_CONFORME","La mention relative aux droits d'accès et de rectification est retrouvée.","mention accès et rectification","Condition formelle identifiée.")
      : check("FPS-DATA-010","NON_DEMONTRE","La mention relative aux droits d'accès et de rectification n'est pas démontrée.","mention accès et rectification","Ne pas conclure à son absence sur une copie partielle.","Contrôler la seconde partie de l'avis complet.","YELLOW"),
    consequence:"Le contrôle porte sur la présence de l'information lorsque le traitement est automatisé.", priority:110, verifiedAt:"2026-10-07"
  },
  {
    id:"FPS-DEADLINE-011", version:1, status:"ACTIVE", regime:["FPS"],
    title:"Calcul contrôlé des délais",
    description:"Les échéances sont calculées séparément pour le RAPO et le paiement, à partir de la notification établie.",
    legalReference:"CGCT art. R.2333-120-13 et L.2333-87 IV", officialSource:"Légifrance",
    officialUrl:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049919622",
    effectiveFrom:"2018-01-01", applicability:()=>true,
    requiredEvidence:["date de notification"],
    evaluate:i=>{
      const date=evidence(i,"noticeNotificationDate");
      return date ? check("FPS-DEADLINE-011","PRESENT_CONFORME","Une date de notification est renseignée pour permettre les calculs d'échéance.","date de notification","Le moteur calcule séparément RAPO et paiement.")
        : check("FPS-DEADLINE-011","NON_DEMONTRE","Aucune date de notification suffisamment établie pour calculer les échéances.","date de notification","Aucune échéance certaine ne doit être affichée.","Établir la notification avant calcul.","ORANGE");
    },
    consequence:"RAPO et paiement sont deux échéances distinctes.", priority:175, verifiedAt:"2026-10-07"
  }
];