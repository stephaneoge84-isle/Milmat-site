import { describe, expect, it } from "vitest";
import { buildContestInterviewPlan } from "../src/contest/contestInterview";

describe("contest interview plan",()=>{
  it("builds an evidence-oriented FPS payment interview from the user's account",()=>{
    const plan=buildContestInterviewPlan({
      regime:"FPS",
      ground:"FPS",
      topic:"paiement",
      explanation:"J'avais payé le stationnement jusqu'à 19h mais j'ai reçu un FPS."
    });
    expect(plan.questions.map(q=>q.id)).toEqual([
      "FACTS_ACCOUNT",
      "FPS_SITUATION",
      "FPS_PAYMENT",
      "FPS_PAYMENT_PROOF",
      "FPS_PAYMENT_TIME",
      "FPS_OTHER_FACT"
    ]);
    expect(plan.questions.find(q=>q.id==="FPS_PAYMENT_PROOF")?.evidenceKeys).toContain("paymentProof");
  });

  it("does not invent a payment argument when the user gives no payment indication",()=>{
    const plan=buildContestInterviewPlan({
      regime:"FPS",
      ground:"FPS",
      topic:"document",
      explanation:"L'immatriculation indiquée sur l'avis semble incorrecte."
    });
    expect(plan.questions.some(q=>q.id==="FPS_PAYMENT")).toBe(false);
    expect(plan.questions.some(q=>q.id==="FPS_DOCUMENT_CONTRADICTION")).toBe(true);
  });
});
