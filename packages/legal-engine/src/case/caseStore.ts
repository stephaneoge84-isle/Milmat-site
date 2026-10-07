import type { CaseFile } from "./caseFile";

export interface CaseStore {
  save(caseFile: CaseFile): Promise<void>;
  load(caseId: string): Promise<CaseFile | null>;
}

export class MemoryCaseStore implements CaseStore {
  private readonly data = new Map<string, CaseFile>();
  async save(caseFile: CaseFile): Promise<void> { this.data.set(caseFile.caseId, structuredClone(caseFile)); }
  async load(caseId: string): Promise<CaseFile | null> {
    const value = this.data.get(caseId);
    return value ? structuredClone(value) : null;
  }
}
