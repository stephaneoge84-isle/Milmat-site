import { describe, expect, it } from "vitest";
import { legalRuleEngine } from "../src";
import { legalRules } from "../src/rules";

describe("legalRuleEngine",()=>{
 it("applies only rules effective on the date of facts",()=>{
   const audit=legalRuleEngine({infractionDate:"2026-10-07",regime:"RADAR",extractedData:{},documentEvidence:{},availableDocuments:[]},legalRules);
   expect(audit.applicableRules.some(r=>r.id==="ROUTE-L130-9-RADAR-001")).toBe(true);
 });
 it("does not treat missing evidence as proof of absence",()=>{
   const audit=legalRuleEngine({infractionDate:"2026-10-07",regime:"RADAR",extractedData:{},documentEvidence:{},availableDocuments:[]},legalRules);
   const c=audit.checks.find(x=>x.ruleId==="ROUTE-L130-9-RADAR-001");
   expect(c?.status).toBe("NON_DEMONTRE");
 });
 it("recognizes a demonstrated radar homologation",()=>{
   const audit=legalRuleEngine({infractionDate:"2026-10-07",regime:"RADAR",extractedData:{},documentEvidence:{radarHomologation:true},availableDocuments:["homologation"]},legalRules);
   const c=audit.checks.find(x=>x.ruleId==="ROUTE-L130-9-RADAR-001");
   expect(c?.status).toBe("PRESENT_CONFORME");
 });
});
