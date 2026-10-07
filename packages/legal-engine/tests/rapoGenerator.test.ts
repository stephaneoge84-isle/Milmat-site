import { describe, expect, it } from "vitest";
import { buildCaseFile } from "../src/case/caseFile";
import { generateFpsRapo } from "../src/contest/rapoGenerator";
describe("RAPO generator",()=>{it("calculates the RAPO deadline from notification",()=>{const c=buildCaseFile({regime:"FPS",infractionDate:"2026-09-23",notificationDate:"2026-09-29",selectedGround:"FPS",userExplanation:"Test"});const d=generateFpsRapo(c);expect(d.deadline).toBe("2026-10-29");expect(d.humanReviewRequired).toBe(true)})});