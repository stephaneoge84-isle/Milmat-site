import type { CaseDocument, CaseEvidence, CaseFact, CaseFile } from "./caseFile";

export type ConfrontationStatus =
  | "ESTABLISHED"
  | "DECLARED_ONLY"
  | "DOCUMENTED"
  | "CORROBORATED"
  | "CONTRADICTED"
  | "NOT_DEMONSTRATED"
  | "TO_VERIFY";

export interface EvidenceStatement {
  key:string;
  value:string;
  source:"USER_DECLARATION"|"DOCUMENT"|"EXTRACTION"|"ATTACHMENT_OCR";
  sourceId?:string;
  sourceLocator?:string;
}

export interface EvidenceConfrontation {
  key:string;
  userStatements:EvidenceStatement[];
  documentaryStatements:EvidenceStatement[];
  status:ConfrontationStatus;
  finding:string;
  nextAction?:string;
}

export interface EvidenceConfrontationResult {
  items:EvidenceConfrontation[];
  contradictions:string[];
  corroborations:string[];
  unresolved:string[];
  draftingFacts:string[];
  humanReviewRequired:boolean;
}

const normalize=(value:unknown):string=>String(value??"")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/\s+/g," ").trim();

const comparable=(a:unknown,b:unknown):boolean=>{
  const x=normalize(a),y=normalize(b);
  if(!x||!y)return false;
  if(x===y)return true;
  return x.includes(y)||y.includes(x);
};

const factKey=(fact:CaseFact):string=>fact.key;

function attachmentStatements(documents:CaseDocument[]):EvidenceStatement[]{
  const out:EvidenceStatement[]=[];
  for(const d of documents){
    if(d.source!=="USER_UPLOAD"||!d.extractedText)continue;
    out.push({
      key:d.role,
      value:d.extractedText,
      source:"ATTACHMENT_OCR",
      sourceId:d.id
    });
  }
  return out;
}

function relevantAttachmentText(factKeyValue:string,documents:CaseDocument[]):EvidenceStatement[]{
  const terms:Record<string,string[]> = {
    paymentDeclared:["paiement","payé","paye","ticket","stationnement"],
    paymentProof:["paiement","ticket","reçu","stationnement"],
    paymentTimestamp:["heure","date","paiement"],
    vehicleStatus:["cession","vente","vendu","véhicule","vehicule"],
    vehicleStatusProof:["cession","certificat","vente"],
    notificationDeclaration:["reçu","recu","notification","envoi","courrier"],
    notificationProof:["réception","reception","envoi","courrier","suivi"],
    documentContradiction:["avis","immatriculation","montant","mention"],
    amountProof:["montant","tarif","barème","bareme"]
  };
  const wanted=terms[factKeyValue]||[];
  return attachmentStatements(documents).filter(s=>{
    const text=normalize(s.value);
    return wanted.length===0 || wanted.some(t=>text.includes(normalize(t)));
  });
}

export function confrontCaseEvidence(caseFile:CaseFile):EvidenceConfrontationResult{
  const userFacts=caseFile.facts.filter(f=>f.source==="USER");
  const items:EvidenceConfrontation[]=[];
  const contradictions:string[]=[];
  const corroborations:string[]=[];
  const unresolved:string[]=[];
  const draftingFacts:string[]=[];

  for(const fact of userFacts){
    if(fact.key==="userExplanation")continue;
    const value=String(fact.value??"").trim();
    if(!value)continue;

    const documentary:EvidenceStatement[]=[];
    for(const e of caseFile.evidence){
      if(e.origin==="DOCUMENT"||e.origin==="EXTRACTION"){
        if(e.key===factKey(fact) || comparable(e.value,value)){
          documentary.push({
            key:e.key,value:String(e.value??""),
            source:e.origin,sourceId:e.sourceDocumentId,sourceLocator:e.sourceLocator
          });
        }
      }
    }
    documentary.push(...relevantAttachmentText(fact.key,caseFile.documents));

    let status:ConfrontationStatus="DECLARED_ONLY";
    let finding="La position de l'utilisateur est déclarée mais aucun élément documentaire correspondant n'est actuellement identifié.";
    let nextAction="Demander ou contrôler la pièce permettant d'étayer cette déclaration.";

    if(documentary.length){
      const direct=documentary.some(d=>d.key===fact.key);
      const textMatch=documentary.some(d=>comparable(d.value,value));
      const yesDeclaration=["paymentDeclared","paymentProof"].includes(fact.key)&&/^oui$/i.test(value);
      if((direct&&textMatch)||(yesDeclaration&&documentary.some(d=>d.source==="ATTACHMENT_OCR"))){
        status="CORROBORATED";
        finding="La déclaration utilisateur trouve un élément documentaire concordant.";
        corroborations.push(fact.key);
        draftingFacts.push(value);
        nextAction="Conserver la pièce source et vérifier sa portée juridique.";
      }else if(textMatch){
        status="DOCUMENTED";
        finding="Un élément documentaire semble correspondre à la déclaration ; la correspondance doit être vérifiée.";
        nextAction="Contrôler la pièce originale et son contexte.";
        draftingFacts.push(value);
      }else{
        status="TO_VERIFY";
        finding="Une pièce existe sur le même sujet mais ne permet pas encore d'établir la déclaration.";
      }
    }else{
      unresolved.push(fact.key);
    }

    items.push({
      key:fact.key,
      userStatements:[{
        key:fact.key,value,source:"USER_DECLARATION"
      }],
      documentaryStatements:documentary,
      status,finding,nextAction
    });
  }

  // Compare explicit documentary facts carrying the same semantic key.
  for(const item of items){
    if(item.documentaryStatements.length===0)continue;
    const user=item.userStatements[0]?.value;
    const conflicting=item.documentaryStatements.some(d=>{
      if(d.key!==item.key)return false;
      const doc=normalize(d.value);
      const usr=normalize(user);
      return Boolean(doc&&usr&&!comparable(doc,usr));
    });
    if(conflicting){
      item.status="CONTRADICTED";
      item.finding="La déclaration utilisateur paraît en contradiction avec un élément documentaire portant sur le même sujet.";
      contradictions.push(item.key);
      item.nextAction="Afficher les deux éléments, demander une vérification et ne pas rédiger ce point comme un fait établi.";
      draftingFacts.splice(draftingFacts.indexOf(user),1);
    }
  }

  return {
    items,
    contradictions,
    corroborations,
    unresolved,
    draftingFacts,
    humanReviewRequired:contradictions.length>0||items.some(i=>i.status==="TO_VERIFY")
  };
}
