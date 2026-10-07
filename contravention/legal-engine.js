export function analyzeFpsIntake(input) {
  const answers = input.answers || {};
  const docs = input.documents || [];
  const completeNotice = docs.includes("Avis FPS complet, recto et verso");
  const hasPaymentProof = docs.includes("Justificatif de paiement du stationnement");
  const hasPaymentRight = docs.includes("Abonnement / droit");
  const checks = [];
  const push = (id,status,risk,finding,request,required) => checks.push({ruleId:id,status,risk,finding,request,requiredEvidence:required});
  const requiredMentions = ["collectivité","autorité","agent","date/heure/lieu","véhicule","redevable","montant","fin FPS","avis"];
  push("FPS-MENTIONS-001", completeNotice ? "PRESENT_CONFORME" : "NON_DEMONTRE",
    completeNotice ? "INFO" : "YELLOW",
    completeNotice ? "L'avis complet est déclaré disponible." : "L'avis complet n'est pas déclaré disponible ; l'absence d'une mention sur une copie partielle n'établit pas son absence.",
    completeNotice ? "" : "Fournir l'avis FPS complet, notamment la seconde partie « Modalités de paiement et contestation ».",
    requiredMentions);
  push("FPS-AGENT-002", "PRESENT_CONFORME", "INFO",
    "L'autorité et l'identifiant de l'agent sont présents sur les éléments connus du dossier FPS.",
    "", ["autorité dont relève l'agent","numéro d'identification de l'agent"]);
  const notification = input.notificationDate;
  push("FPS-RAPO-003", notification ? "PRESENT_CONFORME" : "NON_DEMONTRE",
    notification ? "INFO" : "ORANGE",
    notification ? "La date de notification a été renseignée ; le délai doit être calculé à partir de la notification." : "La date effective de notification n'est pas établie.",
    notification ? "" : "Préciser la date et le mode de notification et vérifier l'autorité compétente pour le RAPO.",
    ["date de notification","entité compétente pour le RAPO"]);

  const ground=input.ground;
  if (ground==="paiement") {
    const paid=answers["Paiement effectué ?"]==="Oui";
    const proof=answers["Justificatif ?"]==="Oui" && hasPaymentProof;
    const before=answers["Horodatage"]==="Oui";
    push("FPS-PAIEMENT-004", proof && paid && before ? "PRESENT_CONFORME" : "A_VERIFIER",
      proof && paid && before ? "INFO" : "ORANGE",
      proof && paid && before ? "Un paiement antérieur au constat est déclaré et documenté." : "Le paiement ou ses conditions de prise en compte ne sont pas suffisamment démontrés.",
      proof && paid && before ? "" : "Vérifier le justificatif, son horodatage et les conditions de déduction prévues par le CGCT.",
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
    push("FPS-DOCUMENT-006", contradiction ? "A_VERIFIER" : "NON_DEMONTRE",
      contradiction ? "ORANGE" : "YELLOW",
      contradiction ? "Une incohérence entre mentions est déclarée et doit être contrôlée sur l'avis complet." : "Aucune incohérence précise n'est encore établie.",
      "Identifier la mention contestée et contrôler le texte applicable sur l'avis complet.",
      ["avis complet","mention précisément contestée"]);
  }
  if (ground==="notification") {
    push("FPS-NOTIFICATION-007", notification ? "PRESENT_CONFORME" : "A_VERIFIER",
      notification ? "INFO" : "ORANGE",
      notification ? "La date de réception est renseignée." : "La notification doit être documentée.",
      notification ? "" : "Fournir tout élément permettant d'établir la notification et sa date.",
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
  let score=10;
  const serious=ground && ground!=="autre" && ground!=="undefined" || incoherent.length;
  if (serious) score+=45;
  score=Math.min(90,score+Math.min(30,incoherent.length*15)+Math.min(20,unresolved.length*5));
  if (!ground) score=0;
  const level=score>=70?"HIGH":score>=40?"MODERATE":score>=20?"LOW":"VERY_LOW";
  const decision=score>=40?"CONTINUE":score>0?"CONTINUE_WITH_CAUTION":"STOP_AND_REVIEW";
  return {checks,score,level,decision,ground,completeNotice,hasPaymentProof,hasPaymentRight};
}
