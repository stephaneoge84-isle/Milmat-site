import { describe, expect, it } from "vitest";
import { proposeLegalUpdate, validateLegalUpdate } from "../src/case/legalUpdateWorkflow";
describe("legal update lifecycle",()=>{it("requires human validation before activation",()=>{const p=proposeLegalUpdate({effectiveFrom:"2027-01-01",sourceUrl:"https://www.legifrance.gouv.fr",changeSummary:"test",affectedRuleIds:["X"]});expect(p.status).toBe("PROPOSED");const v=validateLegalUpdate(p,"human-review");expect(v.status).toBe("VALIDATED");expect(v.validatedBy).toBe("human-review")})});
