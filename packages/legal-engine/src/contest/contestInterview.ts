import type { ContestGround } from "./contestGrounds";
import type { FpsTopic } from "../case/caseFile";

export type InterviewQuestionType="CHOICE"|"TEXT"|"DATE"|"DOCUMENT";
export interface ContestInterviewQuestion{
  id:string;
  type:InterviewQuestionType;
  label:string;
  prompt:string;
  required:boolean;
  evidenceKeys:string[];
  why:string;
}
export interface ContestInterviewPlan{
  version:"1.0";
  ground:ContestGround;
  topic?:FpsTopic;
  questions:ContestInterviewQuestion[];
}

const q=(id:string,type:InterviewQuestionType,prompt:string,required:boolean,evidenceKeys:string[],why:string):ContestInterviewQuestion=>({
  id,type,label:id,prompt,required,evidenceKeys,why
});

export function buildContestInterviewPlan(input:{
  regime:"FPS"|"PARKING"|"RADAR"|"DIRECT_VERBALIZATION"|"AMENDE_FORFAITAIRE_MAJORÉE";
  ground:ContestGround;
  topic?:FpsTopic;
  explanation?:string;
}):ContestInterviewPlan{
  const questions:ContestInterviewQuestion[]=[];

  // These questions establish the user's factual account before any legal argument is drafted.
  questions.push(q("FACTS_ACCOUNT","TEXT",
    "Décrivez, avec vos propres mots, ce qui s'est passé le jour des faits. Ne cherchez pas à utiliser un vocabulaire juridique.",
    true,["userExplanation"],"Établir le récit factuel de l'utilisateur sans le transformer en preuve."));

  if(input.regime==="FPS"){
    questions.push(q("FPS_SITUATION","CHOICE",
      "Quelle est la situation que vous contestez principalement ?",
      true,["fpsTopic"],"Déterminer le sous-dossier FPS à instruire."));

    if(input.topic==="paiement"||/payé|paye|paiement|ticket|horodateur|application/i.test(input.explanation||"")){
      questions.push(q("FPS_PAYMENT","CHOICE",
        "Avez-vous payé le stationnement avant ou pendant la période concernée ?",
        true,["paymentDeclared"],"Une contestation fondée sur un paiement doit être distinguée d'une simple déclaration."));

      questions.push(q("FPS_PAYMENT_PROOF","DOCUMENT",
        "Disposez-vous du justificatif de paiement (ticket, reçu ou justificatif numérique) ?",
        true,["paymentProof"],"Le justificatif permet de confronter l'heure, la durée et le montant au constat."));

      questions.push(q("FPS_PAYMENT_TIME","DATE",
        "Quelle est l'heure indiquée sur votre justificatif de paiement, si elle est disponible ?",
        false,["paymentTimestamp"],"L'horodatage est nécessaire pour vérifier les conditions de déduction du paiement antérieur."));
    }

    if(input.topic==="vehicule"||/vendu|cédé|cession|volé|vol|détruit|usurp|plaque/i.test(input.explanation||"")){
      questions.push(q("FPS_VEHICLE_STATUS","TEXT",
        "Quelle était votre situation vis-à-vis du véhicule à la date du constat ?",
        true,["vehicleStatus"],"Qualifier la situation du redevable au moment des faits."));

      questions.push(q("FPS_VEHICLE_PROOF","DOCUMENT",
        "Avez-vous un document daté permettant d'établir cette situation ?",
        false,["vehicleStatusProof"],"La déclaration doit être distinguée de la pièce qui permet de l'étayer."));
    }

    if(input.topic==="document"||/avis|document|mention|erreur|incohérence|incoherent|immatriculation|montant/i.test(input.explanation||"")){
      questions.push(q("FPS_DOCUMENT_CONTRADICTION","TEXT",
        "Quelle mention de l'avis vous paraît erronée ou incohérente ? Indiquez si possible les deux informations qui se contredisent.",
        true,["documentContradiction"],"Identifier une incohérence concrète plutôt qu'une impression générale."));
    }

    if(input.topic==="notification"||/reçu|recu|notification|envoi|courrier|jamais reçu|jamais recu|délai|delai/i.test(input.explanation||"")){
      questions.push(q("FPS_NOTIFICATION_ACCOUNT","TEXT",
        "Quand et comment dites-vous avoir reçu l'avis ?",
        true,["notificationDeclaration"],"La déclaration de réception doit être distinguée de la preuve documentaire de notification."));
      questions.push(q("FPS_NOTIFICATION_PROOF","DOCUMENT",
        "Disposez-vous de l'enveloppe, d'un suivi postal, d'un courriel ou d'un autre élément permettant d'établir la réception ?",
        false,["notificationProof"],"Établir le mode et la date de notification sans confondre envoi et réception."));
    }

    if(input.topic==="montant"||/montant|33 ?€|barème|bareme|tarif/i.test(input.explanation||"")){
      questions.push(q("FPS_AMOUNT_REASON","TEXT",
        "Pourquoi contestez-vous le montant du FPS ?",
        true,["amountReason"],"Identifier s'il s'agit d'un paiement antérieur, d'un barème, d'une erreur de calcul ou d'un autre motif."));
      questions.push(q("FPS_AMOUNT_PROOF","DOCUMENT",
        "Avez-vous un document ou un élément permettant de vérifier le montant applicable ?",
        false,["amountProof"],"Le montant doit être confronté aux éléments documentaires et au barème applicable."));
    }

    // Always ask this before drafting: it captures facts not anticipated by the selected topic.
    questions.push(q("FPS_OTHER_FACT","TEXT",
      "Y a-t-il un autre élément important que vous souhaitez faire connaître avant que nous rédigions la contestation ?",
      false,["additionalFacts"],"Éviter qu'un moyen pertinent soit perdu parce qu'il ne correspondait pas au motif initial."));
  }

  return {
    version:"1.0",
    ground:input.ground,
    topic:input.topic,
    questions
  };
}
