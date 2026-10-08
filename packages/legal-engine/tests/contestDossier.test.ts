import { describe,expect,it } from "vitest";
import { buildCaseFile } from "../src/case/caseFile";
import { confrontCaseEvidence } from "../src/case/evidenceConfrontation";
import { buildContestArguments } from "../src/contest/contestArguments";
import { buildContestDossier,renderContestLetter } from "../src/contest/contestDossier";

describe("contest dossier",()=>{
 it("renders a reviewable RAPO from structured arguments",()=>{
  const c=buildCaseFile({regime:"FPS",infractionDate:"2026-09-23",notificationDate:"2026-10-05",fpsTopic:"paiement",
   userExplanation:"J'avais payé jusqu'à 19h.",answers:{paymentDeclared:"Oui",paymentProof:"Oui"},
   attachments:[{id:"ticket",name:"ticket.jpg",type:"image/jpeg",kind:"PHOTO",role:"PAYMENT_PROOF",processingStatus:"REVIEWED",extracted:true,extractedText:"Ticket 15h20 valable jusqu'à 19h00",source:"USER_UPLOAD"}]});
  const audit={legalVersionDate:"2026-09-23",applicableRules:[],checks:[],missingEvidence:[],anomalies:[],requests:[],confidence:1};
  const args=buildContestArguments(c,audit,confrontCaseEvidence(c));
  const d=buildContestDossier(c,audit,args);
  expect(d.deadline).toBe("2026-11-05");
  expect(renderContestLetter(d)).toContain("RAPO FPS");
  expect(renderContestLetter(d)).toContain("ticket.jpg");
 });
});