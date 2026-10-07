import type { RuleInput, RuleCheck, RiskLevel, EvidenceStatus } from "../types";
export function evidence(input:RuleInput,key:string): unknown { return input.documentEvidence[key] ?? input.extractedData[key]; }
export function check(ruleId:string,status:EvidenceStatus,finding:string,requiredEvidence:string[],consequence:string,request?:string,risk:RiskLevel="INFO"):RuleCheck { return {ruleId,status,risk, finding, requiredEvidence, consequence, request}; }
