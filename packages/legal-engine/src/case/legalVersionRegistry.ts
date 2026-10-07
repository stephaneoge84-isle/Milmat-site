import type { LegalRule } from "../types";

export interface LegalVersion {
  effectiveFrom: string;
  label: string;
  source: "LEGIFRANCE";
  validatedAt: string;
  ruleIds: string[];
}

export const legalVersions: LegalVersion[] = [
  { effectiveFrom: "2025-01-01", label: "FPS — réforme décret 2024-733", source: "LEGIFRANCE", validatedAt: "2026-10-07", ruleIds: ["FPS-MENTIONS-001","FPS-RAPO-003"] },
];

export function rulesForFactDate(rules: LegalRule[], factDate: string): LegalRule[] {
  return rules.filter(rule => rule.effectiveFrom <= factDate && (!rule.effectiveTo || factDate < rule.effectiveTo));
}
