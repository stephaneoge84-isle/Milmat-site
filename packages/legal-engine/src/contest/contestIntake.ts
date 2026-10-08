import type { LegalAudit, RuleInput } from "../types";
import type { ContestGround } from "./contestGrounds";
import { buildContestInterviewPlan, type ContestInterviewPlan } from "./contestInterview";
import { confrontCaseEvidence, type EvidenceConfrontationResult } from "../case/evidenceConfrontation";
import { classifyContestGround } from "./contestGrounds";
import { estimateContestSuccess, type ContestSuccessEstimate } from "./contestSuccessEstimate";
import { legalRuleEngine } from "../engine/legalRuleEngine";
import { legalRules } from "../rules";
import { buildCaseFile, attachLegalAudit, buildRuleInputFromCase, type CaseFile, type FpsTopic, type CaseDocumentInput } from "../case/caseFile";

export interface ContestIntakeAnswers {
  caseId?: string;
  infractionDate:string;
  notificationDate?:string;
  notificationMode?:string;
  ground?:ContestGround;
  fpsTopic?:FpsTopic;
  explanation:string;
  answers:Record<string,string>;
  documents:string[];
  attachments?:CaseDocumentInput[];
  extractedData?:Record<string,unknown>;
  documentEvidence?:Record<string,unknown>;
}
export interface ContestIntakeResult {
  ground:ReturnType<typeof classifyContestGround>;
  audit:LegalAudit;
  estimate:ContestSuccessEstimate;
  ruleInput:RuleInput;
  caseFile:CaseFile;
  interview:ContestInterviewPlan;
  confrontation:EvidenceConfrontationResult;
}
export function analyzeContestIntake(input:ContestIntakeAnswers):ContestIntakeResult {
  const ground=classifyContestGround({regime:"FPS",selectedGround:input.ground,userExplanation:input.explanation,extractedData:input.extractedData});
  const extractedData:Record<string,unknown>={...(input.extractedData??{}),fpsTopic:input.fpsTopic,declaredGround:input.ground};
  if(input.notificationMode)extractedData.declaredNotificationMode=input.notificationMode;
  const caseFile=buildCaseFile({
    caseId:input.caseId,regime:"FPS",infractionDate:input.infractionDate,notificationDate:input.notificationDate,fpsTopic:input.fpsTopic,
    userExplanation:input.explanation,answers:input.answers,documents:input.documents,attachments:input.attachments,extractedData,documentEvidence:input.documentEvidence,selectedGround:input.ground
  });
  const ruleInput=buildRuleInputFromCase(caseFile);
  const audit=legalRuleEngine(ruleInput,legalRules);
  const finalCaseFile=attachLegalAudit(caseFile,audit);
  const estimate=estimateContestSuccess(audit,ground.primaryGround!=="UNDETERMINED");
  const confrontation=confrontCaseEvidence(finalCaseFile);
  const interview=buildContestInterviewPlan({
    regime:"FPS",
    ground:ground.primaryGround,
    topic:input.fpsTopic,
    explanation:input.explanation
  });
  return {ground,audit,estimate,ruleInput,caseFile:finalCaseFile,interview,confrontation};
}
