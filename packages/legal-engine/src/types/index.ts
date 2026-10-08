export * from "./caseContext";

export type Regime = "DIRECT_AGENT" | "PVE" | "RADAR" | "STATIONNEMENT_CONTRAVENTION" | "FPS" | "AMENDE_MAJORÉE" | "UNKNOWN";
export type EvidenceStatus = "PRESENT_CONFORME" | "PRESENT_INCOHERENT" | "ABSENT_DU_DOCUMENT" | "NON_DEMONTRE" | "A_VERIFIER" | "NON_APPLICABLE";
export type RuleStatus = "DRAFT" | "VERIFIED" | "ACTIVE" | "SUPERSEDED" | "RETIRED" | "TODO_REVIEW";
export type RiskLevel = "RED" | "ORANGE" | "YELLOW" | "INFO";
export interface LegalRule { id:string; version:number; status:RuleStatus; regime:Regime[]; title:string; description:string; legalReference:string; officialSource:string; officialUrl:string; effectiveFrom:string; effectiveTo?:string; applicability:(input:RuleInput)=>boolean; requiredEvidence:string[]; evaluate:(input:RuleInput)=>RuleCheck; consequence:string; requestTemplate?:string; priority:number; verifiedAt?:string; notes?:string; }
import type { CaseContext, CaseQualification } from "./caseContext";
import type { CaseFile } from "../case/caseFile";
export interface RuleInput { infractionDate:string; regime:Regime; extractedData:Record<string,unknown>; documentEvidence:Record<string,unknown>; availableDocuments:string[]; caseContext?: CaseContext; caseFile?: CaseFile; }
export interface RuleCheck { ruleId:string; status:EvidenceStatus; risk:RiskLevel; finding:string; requiredEvidence:string[]; request?:string; consequence:string; }
export interface LegalAudit { legalVersionDate:string; applicableRules:LegalRule[]; checks:RuleCheck[]; missingEvidence:string[]; anomalies:RuleCheck[]; requests:string[]; confidence:number; caseQualification?: CaseQualification; }
