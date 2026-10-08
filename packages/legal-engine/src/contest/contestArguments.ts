import type { LegalAudit } from "../types";
import type { ContestGround } from "./contestGrounds";
import type { EvidenceConfrontationResult } from "../case/evidenceConfrontation";
import type { CaseFile } from "../case/caseFile";

export type ContestArgumentStatus="SUPPORTED"|"PARTIALLY_SUPPORTED"|"NOT_DEMONSTRATED"|"CONTRADICTED"|"TO_VERIFY";
export interface ContestArgument {
 id:string; title:string; ground:ContestGround; status:ContestArgumentStatus;
 factualBasis:string[]; evidenceKeys:string[]; legalBasis:string[];
 administrationRequest?:string; draftingInstruction:string; priority:number; humanReviewRequired:boolean;
}
export interface ContestArgumentsResult {
 arguments:ContestArgument[]; selectedArguments:ContestArgument[]; blockedArguments:ContestArgument[];
 requests:string[]; humanReviewRequired:boolean;
}

export function buildContestArguments(caseFile:CaseFile,audit:LegalAudit,confrontation:EvidenceConfrontationResult):ContestArgumentsResult{
 const args:ContestArgument[]=[]; const topic=caseFile.fpsTopic;
 const primary=(caseFile.grounds[0]?.code??"UNDETERMINED") as ContestGround;
 if(topic==="paiement"){
  const items=confrontation.items.filter(x=>x.key.toLowerCase().includes("payment"));
  const contradicted=items.some(x=>x.status==="CONTRADICTED");
  const supported=items.some(x=>["CORROBORATED","DOCUMENTED"].includes(x.status));
  const unresolved=items.some(x=>["DECLARED_ONLY","TO_VERIFY"].includes(x.status));
  const status:ContestArgumentStatus=contradicted?"CONTRADICTED":supported&&!unresolved?"SUPPORTED":supported?"PARTIALLY_SUPPORTED":"NOT_DEMONSTRATED";
  args.push({id:"FPS-PAYMENT-01",title:"Paiement ou droit au stationnement à vérifier",ground:primary==="UNDETERMINED"?"FPS":primary,status,
   factualBasis:items.map(x=>x.finding),evidenceKeys:items.flatMap(x=>x.documentaryStatements.map(d=>d.sourceId).filter(Boolean) as string[]),
   legalBasis:["CGCT, art. L.2333-87","CGCT, art. R.2333-120-5"],
   administrationRequest:"Demander la prise en compte du paiement ou, à défaut, la justification précise du rejet de ce paiement au regard des conditions légales.",
   draftingInstruction:status==="CONTRADICTED"?"Ne pas présenter le paiement comme établi ; exposer la contradiction et demander vérification.":"Présenter uniquement les faits corroborés par les pièces et demander l'examen du paiement.",
   priority:1,humanReviewRequired:status==="CONTRADICTED"||status==="TO_VERIFY"});
 }
 for(const check of audit.checks){
  if(check.status==="PRESENT_INCOHERENT"||check.status==="A_VERIFIER"){
   args.push({id:"LEGAL-"+check.ruleId,title:check.finding,ground:primary,status:"TO_VERIFY",factualBasis:[check.finding],evidenceKeys:[],legalBasis:[check.ruleId],administrationRequest:check.request,
    draftingInstruction:"Ne pas qualifier l'irrégularité comme acquise ; demander la vérification ou la justification correspondante.",priority:check.risk==="RED"?1:2,humanReviewRequired:true});
  } else if(check.status==="NON_DEMONTRE"){
   args.push({id:"LEGAL-"+check.ruleId,title:check.finding,ground:primary,status:"NOT_DEMONSTRATED",factualBasis:[check.finding],evidenceKeys:[],legalBasis:[check.ruleId],administrationRequest:check.request,
    draftingInstruction:"Formuler une demande de justification plutôt qu'une affirmation d'irrégularité.",priority:3,humanReviewRequired:false});
  }
 }
 const map=new Map<string,ContestArgument>(); for(const a of args)map.set(a.id,a);
 const all=[...map.values()].sort((a,b)=>a.priority-b.priority);
 const selected=all.filter(a=>a.status==="SUPPORTED"||a.status==="PARTIALLY_SUPPORTED"||a.status==="TO_VERIFY");
 const blocked=all.filter(a=>a.status==="CONTRADICTED");
 return {arguments:all,selectedArguments:selected,blockedArguments:blocked,requests:selected.map(a=>a.administrationRequest).filter(Boolean) as string[],
  humanReviewRequired:caseFile.humanReviewRequired||confrontation.humanReviewRequired||all.some(a=>a.humanReviewRequired)};
}
