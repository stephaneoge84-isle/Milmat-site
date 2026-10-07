import type { LegalRule } from "../types";

export interface LegalRuleProposal {
  proposalId:string;
  proposedAt:string;
  effectiveFrom:string;
  sourceUrl:string;
  changeSummary:string;
  affectedRuleIds:string[];
  status:"PROPOSED"|"VALIDATED"|"REJECTED"|"ACTIVATED";
  validatedBy?:string;
  validatedAt?:string;
}

export function proposeLegalUpdate(input:Omit<LegalRuleProposal,"proposalId"|"proposedAt"|"status">):LegalRuleProposal {
  return {...input,proposalId:`legal-update-${Date.now()}`,proposedAt:new Date().toISOString(),status:"PROPOSED"};
}
export function validateLegalUpdate(proposal:LegalRuleProposal,validatedBy:string):LegalRuleProposal {
  if(proposal.status!=="PROPOSED")throw new Error("Seule une proposition peut être validée");
  return {...proposal,status:"VALIDATED",validatedBy,validatedAt:new Date().toISOString()};
}
export function activateLegalUpdate(rules:LegalRule[],proposal:LegalRuleProposal,updatedRules:LegalRule[]):LegalRule[] {
  if(proposal.status!=="VALIDATED")throw new Error("Validation humaine requise avant activation");
  return rules.map(rule=>{
    const replacement=updatedRules.find(r=>r.id===rule.id);
    return replacement&&proposal.affectedRuleIds.includes(rule.id)?replacement:{...rule};
  });
}
