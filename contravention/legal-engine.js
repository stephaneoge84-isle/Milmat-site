export function analyzeFpsIntake(input) {
  const answers = input.answers || {};
  const docs = input.documents || [];
  const completeNotice = docs.includes("Avis FPS complet");
  const hasPaymentProof = docs.includes("Justificatif de paiement");
  const checks = [];
  const push = (id,status,risk,finding,request,required) => checks.push({ruleId:id,status,risk,finding,request,requiredEvidence:required});

  push("FPS-MENTIONS-001", completeNotice ? "PRESENT_CONFORME" : "NON_DEMONTRE",
    completeNotice ? "INFO" : "YELLOW",
    completeNotice ? "L'avis FPS complet est déclaré disponible." : "L'avis complet n'est pas disponible dans les pièces déclarées ; son absence de la copie fournie ne permet pas de conclure à une absence de mention.",
    completeNotice ? "" : "Fournir l'avis FPS complet, notamment la seconde partie « Modalités de paiement et contestation ».",
    ["collectivité","autorité","agent","date/heure/lieu","véhicule","redevable","montant","fin FPS","avis"]);

  push("FPS-AGENT-002", "NON_DEMONTRE", "YELLOW",
    "L'autorité et l'identifiant de l'agent doivent être contrôlés sur l'avis complet ; l'interface ne les déduit pas d'une copie partielle.",
    "Vérifier l'autorité et le numéro d'identification sur l'avis complet.",
    ["autorité dont relève l'agent","numéro d'identification de l'agent"]);

  const notification = input.notificationDate;
  push("FPS-RAPO-003", notification ? "A_VERIFIER" : "NON_DEMONTRE",
    "ORANGE",
    notification ? "La date de notification est renseignée, mais l'autorité destinataire du RAPO doit encore être contrôlée." : "La date effective de notification n'est pas établie.",
    "Vérifier la date de notification, l'autorité compétente et les modalités de saisine du RAPO.",
    ["date de notification","entité compétente pour le RAPO","modalités de saisine"]);

  const ground=input.ground;
  if (ground==="paiement") {
    const paid=answers["Paiement effectué ?"]==="Oui";
    const proof=answers["Justificatif ?"]==="Oui" && hasPaymentProof;
    const before=answers["Horodatage"]==="Oui";
    push("FPS-PAIEMENT-004", paid && proof && before ? "PRESENT_CONFORME" : "A_VERIFIER",
      paid && proof && before ? "INFO" : "ORANGE",
      paid && proof && before ? "Un paiement antérieur au constat est déclaré et documenté." : "Le paiement ou ses conditions de prise en compte ne sont pas suffisamment démontrés.",
      paid && proof && before ? "Vérifier néanmoins les conditions exactes de déduction prévues par le CGCT." : "Vérifier le justificatif, son horodatage et les conditions de déduction prévues par le CGCT.",
      ["preuve du paiement","horodatage","conditions de prise en compte"]);
  }

  if (ground==="vehicule") {
    const sale=answers["Cession / vente"]==="Oui" && docs.includes("Cession / vente");
    push("FPS-REDEVABLE-005", sale ? "A_VERIFIER" : "NON_DEMONTRE", "ORANGE",
      sale ? "Une cession est déclarée et documentée ; son effet sur la qualité de redevable doit être vérifié." : "La situation du redevable n'est pas suffisamment établie.",
      "Vérifier la qualité de redevable et les justificatifs datés à la date du constat.",
      ["situation du redevable","justificatif daté"]);
  }

  if (ground==="document") {
    const contradiction=answers["Incohérence"]==="Oui";
    push("FPS-DOCUMENT-005", contradiction ? "A_VERIFIER" : "NON_DEMONTRE",
      contradiction ? "ORANGE" : "YELLOW",
      contradiction ? "Une incohérence entre mentions est déclarée ; elle doit être contrôlée sur l'avis complet." : "Aucune incohérence précise n'est encore démontrée.",
      "Identifier la mention contestée et contrôler le texte applicable sur l'avis complet.",
      ["avis complet","mention précisément contestée"]);
  }

  if (ground==="notification") {
    push("FPS-NOTIFICATION-006", notification ? "PRESENT_CONFORME" : "A_VERIFIER",
      notification ? "INFO" : "ORANGE",
      notification ? "La date de réception est renseignée." : "La notification doit être documentée.",
      notification ? "Vérifier la pièce établissant cette date." : "Fournir tout élément permettant d'établir la notification et sa date.",
      ["preuve de notification"]);
  }

  if (ground==="montant") {
    const prior=answers["Paiement préalable"]==="Oui";
    const calc=answers["Calcul"]==="Oui";
    push("FPS-MONTANT-008", prior||calc ? "A_VERIFIER" : "NON_DEMONTRE",
      prior||calc ? "ORANGE" : "YELLOW",
      prior||calc ? "Un élément de calcul ou un paiement préalable est déclaré." : "Aucun élément précis de contestation du montant n'est encore démontré.",
      "Vérifier le barème applicable et la prise en compte éventuelle d'un paiement préalable.",
      ["élément de calcul","preuve de paiement préalable"]);
  }

  const unresolved=checks.filter(c=>c.status==="NON_DEMONTRE"||c.status==="A_VERIFIER");
  const incoherent=checks.filter(c=>c.status==="PRESENT_INCOHERENT");
  const serious=ground && ground!=="autre" && ground!=="undefined" || incoherent.length>0;
  const solidite = incoherent.length ? "INCOHÉRENCE APPARENTE" : serious && unresolved.length ? "À COMPLÉTER" : serious ? "FAVORABLE À L'EXAMEN" : unresolved.length ? "À COMPLÉTER" : "AUCUN MOYEN IDENTIFIÉ";

  return {
    checks,
    solidite,
    decision: unresolved.length ? "CONTINUE_WITH_CAUTION" : serious ? "CONTINUE" : "STOP_AND_REVIEW",
    blockers: unresolved.map(c=>c.finding),
    ground,
    completeNotice,
    hasPaymentProof
  };
}
