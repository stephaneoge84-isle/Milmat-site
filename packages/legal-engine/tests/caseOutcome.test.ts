import { describe,expect,it } from "vitest";
import { buildCaseFile } from "../src/case/caseFile";
import { confrontCaseEvidence } from "../src/case/evidenceConfrontation";
import { buildContestArguments } from "../src/contest/contestArguments";
import { buildContestDossier } from "../src/contest/contestDossier";
import { decideCaseOutcome } from "../src/case/caseOutcome";

describe("case outcome",()=>{
 it("keeps final decision under human review",()=>{
  const c=buildCaseFile({regime:"FPS",infractionDate:"2026-09-23",fpsTopic:"paiement",answers:{paymentDeclared:"Oui",paymentProof:"Oui"},
   attachments:[{id:"ticket",name:"ticket.jpg",type:"image/jpeg",kind:"PHOTO",role:"PAYMENT_PROOF",processingStatus:"REVIEWED",extracted:true,extractedText:"Ticket stationnement valable jusqu'à 19h00",source:"USER_UPLOAD"}]});
  const audit={legalVersionDate:"2026-09-23",applicableRules:[],checks:[],missingEvidence:[],anomalies:[],requests:[],confidence:1};
  const args=buildContestArguments(c,audit,confrontCaseEvidence(c)); const dossier=buildContestDossier(c,audit,args);
  const out=decideCaseOutcome(c,args,dossier);
  expect(out.status).toBe("READY_FOR_REVIEW");
  expect(out.nextStep).toBe("REVIEW");
 });
});