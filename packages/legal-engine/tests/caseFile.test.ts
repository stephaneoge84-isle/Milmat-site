import { describe, expect, it } from "vitest";
import { buildCaseFile, buildRuleInputFromCase, attachLegalAudit } from "../src/case/caseFile";

describe("CASE canonical dossier",()=>{
  it("keeps document evidence distinct from user declarations",()=>{
    const c=buildCaseFile({regime:"FPS",infractionDate:"2026-09-23",documents:["Avis FPS complet"],answers:{fpsAmount:"33"},documentEvidence:{fpsNoticeComplete:true},fpsTopic:"document"});
    const input=buildRuleInputFromCase(c);
    expect(c.evidence.find(e=>e.key==="fpsNoticeComplete")?.origin).toBe("DOCUMENT");
    expect(c.evidence.find(e=>e.key==="fpsNoticeComplete")?.status).toBe("VERIFIED");
    expect(input.documentEvidence.fpsNoticeComplete).toBe(true);
    expect(input.extractedData.fpsAmount).toBeUndefined();
    expect((input.extractedData.contestAnswers as Record<string, string>).fpsAmount).toBe("33");
  });
  it("creates immutable revision history when audit is attached",()=>{
    const c=buildCaseFile({regime:"FPS",infractionDate:"2026-09-23"});
    const out=attachLegalAudit(c,{legalVersionDate:"2026-09-23",applicableRules:[],checks:[],missingEvidence:[],anomalies:[],requests:[],confidence:0});
    expect(out.revision).toBe(2);expect(out.revisions).toHaveLength(2);
  });
});