import { calculateFpsDeadline } from "../src/case/deadlines";

describe("FPS deadlines", () => {
  it("calculates the RAPO deadline from notification date", () => {
    expect(calculateFpsDeadline("RAPO", "2026-09-29").deadlineDate).toBe("2026-10-29");
  });

  it("handles shorter target months", () => {
    expect(calculateFpsDeadline("RAPO", "2026-01-31").deadlineDate).toBe("2026-02-28");
  });

  it("calculates the three-month payment deadline", () => {
    expect(calculateFpsDeadline("PAIEMENT", "2026-09-29").deadlineDate).toBe("2026-12-29");
  });
});
