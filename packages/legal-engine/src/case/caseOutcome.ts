import type { CaseFile } from "./caseFile";
import type { ContestArgumentsResult } from "../contest/contestArguments";
import type { ContestDossier } from "../contest/contestDossier";

export interface CaseOutcome {
 status:"READY_FOR_REVIEW"|"INCOMPLETE"|"BLOCKED";
 reason:string[];
 nextStep:"REVIEW"|"MORE_EVIDENCE"|"NO_CONTESTATION_IDENTIFIED";
}

export function decideCaseOutcome(caseFile:CaseFile,args:ContestArgumentsResult,dossier:ContestDossier):CaseOutcome{
 const reasons:string[]=[];
 if(caseFile.humanReviewRequired)reasons.push("Une revue humaine est requise.");
 if(args.blockedArguments.length)reasons.push("Au moins un moyen est contredit par les éléments disponibles.");
 if(args.selectedArguments.length===0)reasons.push("Aucun moyen suffisamment structuré n'est disponible.");
 if(caseFile.assessment?.status==="INCOHERENCE_APPARENTE")reasons.push("Une incohérence apparente a été détectée.");
 if(args.selectedArguments.length===0)return {status:"INCOMPLETE",reason:reasons,nextStep:"NO_CONTESTATION_IDENTIFIED"};
 if(args.blockedArguments.length||caseFile.humanReviewRequired)return {status:"READY_FOR_REVIEW",reason:reasons,nextStep:"REVIEW"};
 return {status:"READY_FOR_REVIEW",reason:reasons,nextStep:"REVIEW"};
}
