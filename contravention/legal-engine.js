function addMonths(value,months){
  const d=new Date(value+"T00:00:00"); const day=d.getDate(); d.setMonth(d.getMonth()+months);
  if(d.getDate()!==day)d.setDate(0);
  return d.toISOString().slice(0,10);
}
export function calculateFpsDeadline(kind,notificationDate){
  if(!notificationDate)return null;
  return {kind,notificationDate,deadlineDate:addMonths(notificationDate,kind==="RAPO"?1:3),
    rule:kind==="RAPO"?"CGCT art. R.2333-120-13":"CGCT art. L.2333-87 IV"};
}
const hasEvidence=(data,key)=>{const v=data?.[key];return v!==undefined&&v!==null&&v!==""&&!(typeof v==="string"&&["à contrôler","a controler","à documenter","a documenter"].includes(v.trim().toLowerCase()))};
export function analyzeFpsIntake(input){
  const answers=input.answers||{},docs=input.documents||[],checks=[],data=input.extractedData||{};
  const complete=docs.includes("Avis FPS complet")||docs.includes("Avis FPS complet, recto et verso");
  const has=key=>hasEvidence(data,key);
  const push=(id,status,risk,finding,request,required)=>checks.push({ruleId:id,status,risk,finding,request,requiredEvidence:required});
  const first=["fpsNoticePart1Complete","fpsCollectivity","fpsAgentAuthority","fpsAgentId","infractionDateTime","infractionLocation","vehicleRegistration","vehicleBrand","fpsAmount","fpsEndTime","fpsSignature","fpsNoticeNumber"];
  const second=["fpsNoticePart2Complete","paymentServiceCoordinates","paymentMethods","paymentDeadline","nonPaymentConsequence","rapoMandatory","rapoAuthority","rapoDeadlineAndMethod","rapoSilenceRejection","tribunalAppealInfo","dataAccessRectification"];
  const missing=[...first,...second].filter(k=>!has(k));
  push("FPS-MENTIONS-001",missing.length===0?"PRESENT_CONFORME":"NON_DEMONTRE",missing.length===0?"INFO":"YELLOW",
    missing.length===0?"Les deux parties de l'avis sont documentées par des éléments extraits.":"L'avis n'est pas suffisamment documenté par des éléments extraits ; une copie partielle ne permet pas de conclure à l'absence de mentions.",
    missing.length===0?"":"Fournir l'avis complet et contrôler séparément les deux parties.",["partie 1","partie 2","mentions réglementaires"]);
  const agentOk=has("fpsAgentAuthority")&&has("fpsAgentId");
  push("FPS-AGENT-002",agentOk?"PRESENT_CONFORME":"NON_DEMONTRE","YELLOW",
    agentOk?"Autorité et identifiant de l'agent retrouvés dans les éléments extraits.":"Autorité ou identifiant de l'agent non démontré.",
    "Ne pas conclure au défaut de serment ; si la compétence est contestée, vérifier le mécanisme de R.2333-120-9.",["autorité","identifiant","assermentation si compétence contestée"]);
  const notif=has("noticeNotificationDate");
  const rapoOk=notif&&has("rapoAuthority")&&has("rapoDeadlineAndMethod")&&has("rapoRequiredDocuments");
  push("FPS-RAPO-003",rapoOk?"PRESENT_CONFORME":"NON_DEMONTRE",rapoOk?"INFO":"ORANGE",
    rapoOk?"Notification et éléments essentiels du RAPO retrouvés dans le document extrait.":"La notification ou les modalités essentielles du RAPO ne sont pas démontrées par la pièce analysée.",
    "La date saisie manuellement ne vaut pas preuve de notification.",["notification","autorité RAPO","délai","modalités","pièces"]);
  const ground=input.ground;
  if(ground==="paiement"){
    const paid=answers["Paiement effectué ?"]==="Oui",proof=answers["Justificatif ?"]==="Oui"&&docs.includes("Justificatif de paiement"),before=answers["Horodatage"]==="Oui";
    push("FPS-PAIEMENT-004",paid&&proof&&before?"A_VERIFIER":"NON_DEMONTRE","ORANGE",
      paid&&proof&&before?"Paiement préalable déclaré et documenté ; conditions de déduction à vérifier.":"Paiement préalable insuffisamment démontré.",
      "Vérifier le justificatif, son horodatage et les conditions de R.2333-120-5.",["justificatif","horodatage","durée maximale"]);
  }
  if(ground==="vehicule"){
    const sale=answers["Cession / vente"]==="Oui"&&docs.includes("Cession / vente");
    push("FPS-REDEVABLE-005",sale?"A_VERIFIER":"NON_DEMONTRE","ORANGE",sale?"Cession déclarée et documentée ; qualité de redevable à qualifier.":"Qualité de redevable insuffisamment documentée.",
      "Vérifier les dates et la qualité du redevable à la date du constat.",["situation du redevable","justificatif daté"]);
  }
  if(ground==="document"){
    const contradiction=answers["Incohérence"]==="Oui";
    push("FPS-DOCUMENT-006",contradiction?"A_VERIFIER":"NON_DEMONTRE",contradiction?"ORANGE":"YELLOW",
      contradiction?"Une contradiction est déclarée ; elle doit être reproduite et contrôlée.":"Aucune contradiction précise n'est démontrée.",
      "Fournir l'avis complet et identifier les deux mentions.",["avis complet","deux mentions"]);
  }
  if(ground==="notification"){
    push("FPS-NOTIFICATION-007",notif?"PRESENT_CONFORME":"NON_DEMONTRE",notif?"INFO":"ORANGE",
      notif?"Une date de notification est extraite du document ; sa preuve et son calcul doivent encore être vérifiés.":"La date effective de notification n'est pas établie par le document.",
      "Documenter le mode et la date effective de notification ; ne pas assimiler la date d'envoi à la notification.",["mode","date","preuve"]);
  }
  if(ground==="montant"){
    const prior=answers["Paiement préalable"]==="Oui",calc=answers["Calcul"]==="Oui";
    push("FPS-MONTANT-008",prior||calc?"A_VERIFIER":"NON_DEMONTRE",prior||calc?"ORANGE":"YELLOW",
      prior||calc?"Un élément de calcul ou de paiement préalable est déclaré.":"Aucun élément précis de calcul n'est démontré.",
      "Comparer au barème applicable à la zone et à la date.",["montant","zone","barème"]);
  }
  const deadlineRapo=calculateFpsDeadline("RAPO",input.notificationDate),deadlinePayment=calculateFpsDeadline("PAIEMENT",input.notificationDate);
  push("FPS-DEADLINE-011",notif?"PRESENT_CONFORME":"NON_DEMONTRE",notif?"INFO":"ORANGE",
    notif?"Une notification est extraite du document pour permettre un calcul ; contrôler la date avant utilisation.":"Aucune notification extraite suffisamment établie pour calculer les échéances.",
    "Une date de notification saisie manuellement produit uniquement un calcul indicatif.",["date de notification"]);
  const unresolved=checks.filter(c=>c.status==="NON_DEMONTRE"||c.status==="A_VERIFIER");
  const incoherent=checks.filter(c=>c.status==="PRESENT_INCOHERENT");
  const serious=(ground&&ground!=="autre")||incoherent.length>0;
  const solidite=incoherent.length?"INCOHÉRENCE APPARENTE":serious&&unresolved.length?"À COMPLÉTER":serious?"FAVORABLE À L'EXAMEN":unresolved.length?"À COMPLÉTER":"AUCUN MOYEN IDENTIFIÉ";
  return {checks,solidite,decision:unresolved.length?"CONTINUE_WITH_CAUTION":serious?"CONTINUE":"STOP_AND_REVIEW",blockers:unresolved.map(c=>c.finding),ground,completeNotice:complete,hasPaymentProof:docs.includes("Justificatif de paiement"),deadlines:{rapo:deadlineRapo,payment:deadlinePayment}};
}