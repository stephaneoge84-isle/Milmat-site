import { cppRules } from "./cpp";
import { roadRules } from "./road";
import { parkingRules } from "./parking";
import type { LegalRule } from "../types";
export const legalRules: LegalRule[] = [...cppRules, ...roadRules, ...parkingRules];
