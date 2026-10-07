import type { LegalAudit, LegalRule, RuleInput } from "../types";
import { qualifyCaseContext } from "../case/qualifyCaseContext";
import { rulesForFactDate } from "../case/legalVersionRegistry";

export function isRuleEffective(rule:LegalRule,date:string):boolean {
  return rule.status==="ACTIVE" && rule.effectiveFrom<=date && (!rule.effectiveTo||date<rule.effectiveTo);
}
export function legalRuleEngine(input:RuleInput,rules:LegalRule[]):LegalAudit {
  const versioned=rulesForFactDate(rules,input.infractionDate);
  const applicableRules=versioned.filter(r=>isRuleEffective(r,input.infractionDate)&&r.regime.includes(input.regime)&&r.applicability(input));
  const checks=applicableRules.map(r=>r.evaluate(input));
  const anomalies=checks.filter(c=>c.status==="PRESENT_INCOHERENT");
  const missingEvidence=checks.filter(c=>c.status==="ABSENT_DU_DOCUMENT"||c.status==="NON_DEMONTRE"||c.status==="A_VERIFIER").flatMap(c=>c.requiredEvidence);
  const requests=checks.filter(c=>c.request).map(c=>c.request as string);
  const confidence=applicableRules.length===0?0:checks.filter(c=>c.status==="PRESENT_CONFORME"||c.status==="NON_APPLICABLE").length/checks.length;
  const caseQualification=input.caseContext?qualifyCaseContext(input.caseContext):undefined;
  const contextualRequests=caseQualification?.generatedRequests??[];
  return {legalVersionDate:input.infractionDate,applicableRules,checks,missingEvidence:[...new Set(missingEvidence)],anomalies,requests:[...new Set([...requests,...contextualRequests])],confidence,caseQualification};
}