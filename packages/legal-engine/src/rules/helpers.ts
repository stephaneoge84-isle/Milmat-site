import type { RuleInput, RuleCheck, RiskLevel, EvidenceStatus } from "../types";
const PLACEHOLDERS=new Set(["à contrôler","a controler","à documenter","a documenter","non renseigné","non renseigne"]);
export function evidence(input:RuleInput,key:string): unknown {
  const value=input.documentEvidence[key] ?? input.extractedData[key];
  if(typeof value==="string"&&PLACEHOLDERS.has(value.trim().toLowerCase()))return undefined;
  return value;
}
export function check(ruleId:string,status:EvidenceStatus,finding:string,requiredEvidence:string[],consequence:string,request?:string,risk:RiskLevel="INFO"):RuleCheck { return {ruleId,status,risk,finding,requiredEvidence,consequence,request}; }
