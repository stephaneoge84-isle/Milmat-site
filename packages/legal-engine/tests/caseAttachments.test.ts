import { describe, expect, it } from "vitest";
import { buildCaseFile } from "../src/case/caseFile";

describe("case attachments",()=>{
  it("keeps user-uploaded photo evidence separate from the FPS notice",()=>{
    const c=buildCaseFile({
      regime:"FPS",
      infractionDate:"2026-09-23",
      fpsTopic:"paiement",
      userExplanation:"J'avais payé le stationnement.",
      documents:["Avis FPS"],
      attachments:[{
        id:"photo-ticket-1",
        name:"ticket-stationnement.jpg",
        type:"image/jpeg",
        kind:"PHOTO",
        role:"PAYMENT_PROOF",
        uploaded:true,
        extracted:true,
        processingStatus:"REVIEWED",
        extractedText:"23/09/2026 15:20 — durée 4h",
        source:"USER_UPLOAD"
      }]
    });
    const photo=c.documents.find(d=>d.id==="photo-ticket-1");
    const notice=c.documents.find(d=>d.name==="Avis FPS");
    expect(photo?.role).toBe("PAYMENT_PROOF");
    expect(photo?.kind).toBe("PHOTO");
    expect(photo?.source).toBe("USER_UPLOAD");
    expect(photo?.processingStatus).toBe("REVIEWED");
    expect(photo?.extractedText).toContain("15:20");
    expect(notice?.role).toBe("OTHER");
  });
});
