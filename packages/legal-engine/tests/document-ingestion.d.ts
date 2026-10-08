declare module "../../../contravention/document-ingestion.js" {
  export function extractDocumentText(file: File, onProgress?: (progress:number)=>void): Promise<string>;
  export function mapFpsText(text: string): Record<string, unknown>;
}
