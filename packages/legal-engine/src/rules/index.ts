import { cppRules } from "./cpp";
import { roadRules } from "./road";
import type { LegalRule } from "../types";
export const legalRules: LegalRule[] = [...cppRules, ...roadRules];
