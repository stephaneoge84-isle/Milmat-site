import { describe,expect,it } from "vitest";
import { buildCaseFile } from "../src/case/caseFile";
import { confrontCaseEvidence } from "../src/case/evidenceConfrontation";
import { buildContestArguments } from "../src/contest/contestArguments";

describe("contest arguments",()=>{
 it("creates a supported payment argument from a reviewed ticket",()=>{
  const c=buildCaseFile({regime:"FPS",infractionDate:"2026-09-23",fpsTopic:"paiement",
   answers:{paymentDeclared:"Oui",paymentProof:"Oui"},
   attachments:[{id:"ticket",name:"ticket.jpg",type:"image/jpeg",kind:"PHOTO",role:"PAYMENT_PROOF",processingStatus:"REVIEWED",extracted:true,extractedText:"Ticket stationnement 23/09/2026 15h20 valable jusqu'à 19h00",source:"USER_UPLOAD"}]});
  const audit={legalVersionDate:"2026-09-23",applicableRules:[],checks:[],missingEvidence:[],anomalies:[],requests:[],confidence:1};
  const r=buildContestArguments(c,audit,confrontCaseEvidence(c));
  expect(r.arguments.some(a=>a.id==="FPS-PAYMENT-01")).toBe(true);
 });
});