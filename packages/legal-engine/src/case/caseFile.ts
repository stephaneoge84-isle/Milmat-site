import type { CaseContext, LegalAudit, Regime, RuleInput } from "../types";
import type { ContestGround } from "../contest/contestGrounds";
export type FpsTopic="paiement"|"vehicule"|"document"|"notification"|"montant"|"autre";
export type CaseEvidenceOrigin="USER_DECLARATION"|"DOCUMENT"|"EXTRACTION"|"LEGAL_ENGINE"|"ADMINISTRATION"|"UNKNOWN";
export type CaseEvidenceStatus="DECLARED"|"EXTRACTED"|"VERIFIED"|"CONTRADICTED"|"MISSING"|"UNCERTAIN";
export interface CaseEvidence{key:string;value:unknown;origin:CaseEvidenceOrigin;status:CaseEvidenceStatus;sourceDocumentId?:string;sourceLocator?:string;asOf?:string;note?:string}
export interface CaseDocument{id:string;name:string;type?:string;available:boolean;uploaded:boolean;extracted:boolean;hash?:string;addedAt:string}
export interface CaseFact{key:string;value:unknown;source:"USER"|"DOCUMENT"|"EXTRACTION"|"ENGINE";confidence:"DECLARED"|"EXTRACTED"|"VERIFIED"|"UNCERTAIN"}
export interface CaseGround{code:ContestGround|"UNDETERMINED";label:string;source:"USER"|"ENGINE"}
export interface CaseAssessment{status:"CONFORME"|"NON_DEMONTRE"|"INCOHERENCE_APPARENTE"|"A_VERIFIER"|"IRREGULARITE_POTENTIELLE";blockers:string[];nextActions:string[]}
export interface CaseRevision{revision:number;createdAt:string;reason:string;ruleVersionDate:string;snapshotHash?:string}
export interface CaseFile{schemaVersion:"1.0";caseId:string;revision:number;createdAt:string;updatedAt:string;regime:Regime;infractionDate:string;notificationDate?:string;fpsTopic?:FpsTopic;caseContext?:CaseContext;facts:CaseFact[];evidence:CaseEvidence[];documents:CaseDocument[];grounds:CaseGround[];audit?:LegalAudit;assessment?:CaseAssessment;generatedRequests:string[];humanReviewRequired:boolean;revisions:CaseRevision[]}
export interface CaseFileInput{caseId?:string;regime:Regime;infractionDate:string;notificationDate?:string;fpsTopic?:FpsTopic;caseContext?:CaseContext;userExplanation?:string;answers?:Record<string,string>;documents?:string[];extractedData?:Record<string,unknown>;documentEvidence?:Record<string,unknown>;selectedGround?:ContestGround}
const now=()=>new Date().toISOString();
const status=(origin:CaseEvidenceOrigin,value:unknown):CaseEvidenceStatus=>value===undefined||value===null||value===""?"MISSING":origin==="EXTRACTION"?"EXTRACTED":origin==="LEGAL_ENGINE"?"VERIFIED":"DECLARED";
export function buildCaseFile(input:CaseFileInput):CaseFile{
 const t=now(),caseId=input.caseId??`case-${input.infractionDate}-${Date.now()}`,facts:CaseFact[]=[],evidence:CaseEvidence[]=[];
 if(input.userExplanation)facts.push({key:"userExplanation",value:input.userExplanation,source:"USER",confidence:"DECLARED"});
 for(const [key,value] of Object.entries(input.answers??{})){facts.push({key,value,source:"USER",confidence:"DECLARED"});evidence.push({key,value,origin:"USER_DECLARATION",status:status("USER_DECLARATION",value),asOf:t});}
 for(const [key,value] of Object.entries(input.extractedData??{}))evidence.push({key,value,origin:"EXTRACTION",status:status("EXTRACTION",value),asOf:t});
 for(const [key,value] of Object.entries(input.documentEvidence??{}))evidence.push({key,value,origin:"USER_DECLARATION",status:status("USER_DECLARATION",value),asOf:t,note:"Disponibilité déclarée par l'utilisateur ; non équivaut à vérification du document."});
 const documents=(input.documents??[]).map((name,i)=>({id:`doc-${i+1}`,name,available:true,uploaded:false,extracted:false,addedAt:t}));
 const grounds=input.selectedGround?[{code:input.selectedGround,label:input.selectedGround,source:"USER" as const}]:[{code:"UNDETERMINED" as const,label:"Non déterminé",source:"ENGINE" as const}];
 return {schemaVersion:"1.0",caseId,revision:1,createdAt:t,updatedAt:t,regime:input.regime,infractionDate:input.infractionDate,notificationDate:input.notificationDate,fpsTopic:input.fpsTopic,caseContext:input.caseContext,facts,evidence,documents,grounds,generatedRequests:[],humanReviewRequired:false,revisions:[{revision:1,createdAt:t,reason:"Initialisation du dossier",ruleVersionDate:input.infractionDate}]};
}
export function buildRuleInputFromCase(c:CaseFile):RuleInput{
 const extractedData:Record<string,unknown>={},documentEvidence:Record<string,unknown>={};
 for(const e of c.evidence){if(e.origin==="DOCUMENT"||e.status==="VERIFIED")documentEvidence[e.key]=e.value;else extractedData[e.key]=e.value;}
 if(c.fpsTopic)extractedData.fpsTopic=c.fpsTopic; extractedData.noticeNotificationDate=c.notificationDate; extractedData.declaredGround=c.grounds[0]?.code;
 return {infractionDate:c.infractionDate,regime:c.regime,extractedData,documentEvidence,availableDocuments:c.documents.filter(d=>d.available).map(d=>d.name),caseContext:c.caseContext,caseFile:c};
}
export function attachLegalAudit(c:CaseFile,a:LegalAudit):CaseFile{
 const t=now(),rev=c.revision+1,needs=Boolean(a.anomalies.length||a.checks.some(x=>x.status==="A_VERIFIER"||x.status==="PRESENT_INCOHERENT"));
 return {...c,updatedAt:t,revision:rev,audit:a,assessment:{status:a.anomalies.length?"INCOHERENCE_APPARENTE":a.checks.some(x=>x.status==="A_VERIFIER")?"A_VERIFIER":a.checks.some(x=>x.status==="NON_DEMONTRE")?"NON_DEMONTRE":"CONFORME",blockers:a.anomalies.map(x=>x.finding),nextActions:a.requests},generatedRequests:a.requests,humanReviewRequired:c.humanReviewRequired||needs,revisions:[...c.revisions,{revision:rev,createdAt:t,reason:"Audit juridique déterministe",ruleVersionDate:a.legalVersionDate}]};
}
export function assertCaseFileIntegrity(c:CaseFile):void{if(!c.caseId||!c.infractionDate||!c.regime)throw new Error("CASE incomplet");if(c.revision<1||c.revisions.length<1)throw new Error("Historique CASE invalide");if(c.humanReviewRequired&&!c.audit)throw new Error("Revue humaine requise sans audit associé");}