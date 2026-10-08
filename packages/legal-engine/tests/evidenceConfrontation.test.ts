import { describe, expect, it } from "vitest";
import { buildCaseFile } from "../src/case/caseFile";
import { confrontCaseEvidence } from "../src/case/evidenceConfrontation";

describe("evidence confrontation",()=>{
  it("distinguishes a user declaration from a supporting photo OCR",()=>{
    const c=buildCaseFile({
      regime:"FPS",
      infractionDate:"2026-09-23",
      answers:{
        paymentDeclared:"Oui",
        paymentProof:"Oui",
        paymentTimestamp:"23/09/2026 15h20 jusqu'à 19h00"
      },
      attachments:[{
        id:"ticket-1",name:"ticket.jpg",type:"image/jpeg",kind:"PHOTO",
        role:"PAYMENT_PROOF",processingStatus:"REVIEWED",extracted:true,
        extractedText:"Ticket de stationnement — 23/09/2026 15h20 — valable jusqu'à 19h00",
        source:"USER_UPLOAD"
      }]
    });
    const result=confrontCaseEvidence(c);
    expect(result.items.find(x=>x.key==="paymentProof")?.status).toBe("CORROBORATED");
    expect(result.items.find(x=>x.key==="paymentTimestamp")?.status).toBe("DOCUMENTED");
  });

  it("does not treat an unsupported declaration as established",()=>{
    const c=buildCaseFile({
      regime:"FPS",
      infractionDate:"2026-09-23",
      answers:{paymentDeclared:"Oui",paymentProof:"Oui"}
    });
    const result=confrontCaseEvidence(c);
    expect(result.items.find(x=>x.key==="paymentDeclared")?.status).toBe("DECLARED_ONLY");
    expect(result.unresolved).toContain("paymentDeclared");
  });
});
