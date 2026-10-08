import type { CaseFile } from "../case/caseFile";
import type { LegalAudit } from "../types";
import type { ContestArgumentsResult } from "./contestArguments";
import { calculateFpsDeadline } from "../case/deadlines";

export interface ContestDossier {
 kind:"RAPO_FPS";
 recipient:string;
 subject:string;
 noticeNumber:string;
 vehicle:string;
 facts:string[];
 arguments:ContestArgumentsResult["selectedArguments"];
 requests:string[];
 attachments:string[];
 deadline?:string;
 paymentDeadline?:string;
 warnings:string[];
 humanReviewRequired:true;
}

const value=(c:CaseFile,key:string)=>String(c.evidence.find(e=>e.key===key)?.value??"");
export function buildContestDossier(caseFile:CaseFile,audit:LegalAudit,args:ContestArgumentsResult):ContestDossier{
 const recipient=value(caseFile,"rapoAuthority")||"[autorité RAPO à compléter]";
 const notice=value(caseFile,"fpsNoticeNumber")||"[numéro d'avis à compléter]";
 const vehicle=value(caseFile,"vehicleRegistration")||"[immatriculation à compléter]";
 const facts=caseFile.facts.filter(f=>f.source==="USER"&&f.key!=="userExplanation").map(f=>`${f.key}: ${String(f.value??"")}`);
 const explanation=String(caseFile.facts.find(f=>f.key==="userExplanation")?.value??"").trim();
 if(explanation)facts.unshift(explanation);
 const warnings=[
  "Projet à relire et valider par l'utilisateur avant transmission.",
  "Les déclarations utilisateur ne sont pas certifiées par l'application.",
  ...args.arguments.filter(a=>a.humanReviewRequired).map(a=>`Relecture requise : ${a.title}`)
 ];
 return {kind:"RAPO_FPS",recipient,subject:`RAPO FPS — avis ${notice} — véhicule ${vehicle}`,noticeNumber:notice,vehicle,
  facts,arguments:args.selectedArguments,requests:args.requests,attachments:caseFile.documents.filter(d=>d.available).map(d=>d.name),
  deadline:caseFile.notificationDate?calculateFpsDeadline("RAPO",caseFile.notificationDate).deadlineDate:undefined,
  paymentDeadline:caseFile.notificationDate?calculateFpsDeadline("PAIEMENT",caseFile.notificationDate).deadlineDate:undefined,
  warnings,humanReviewRequired:true};
}
export function renderContestLetter(d:ContestDossier):string{
 const facts=d.facts.length?d.facts.map(x=>"- "+x).join("\n"):"- [faits à compléter]";
 const grounds=d.arguments.length?d.arguments.map(a=>`- ${a.title} — ${a.status}\n  ${a.draftingInstruction}`).join("\n"):"- Aucun moyen suffisamment établi à ce stade.";
 const requests=d.requests.length?d.requests.map(x=>"- "+x).join("\n"):"- Examiner les pièces et les éléments exposés.";
 const attachments=d.attachments.length?d.attachments.map(x=>"- "+x).join("\n"):"- Aucune pièce jointe enregistrée.";
 return `Objet : ${d.subject}

Madame, Monsieur,

Je forme un recours administratif préalable obligatoire contre l'avis de paiement de forfait de post-stationnement référencé ${d.noticeNumber}.

Exposé des faits :
${facts}

Points de contestation et éléments à examiner :
${grounds}

Je vous demande :
${requests}

Pièces jointes :
${attachments}

Je sollicite le réexamen de l'avis au regard des faits et pièces produits et vous remercie de me communiquer, le cas échéant, les éléments nécessaires à la vérification des points contestés.

Veuillez agréer, Madame, Monsieur, l'expression de ma considération distinguée.

Stéphane OGÉ`;
}