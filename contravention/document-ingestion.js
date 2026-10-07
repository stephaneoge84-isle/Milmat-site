const TESSERACT_URL="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
async function loadTesseract(){
  if(window.Tesseract)return window.Tesseract;
  await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=TESSERACT_URL;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  return window.Tesseract;
}
export async function extractImageText(file,onProgress=()=>{}){
  if(!file||!file.type.startsWith("image/"))throw new Error("Cette première version OCR accepte les images. Pour un PDF, utilisez une conversion en image ou l'ingestion serveur.");
  const T=await loadTesseract();
  const result=await T.recognize(file,"fra",{logger:m=>{if(typeof m.progress==="number")onProgress(m.progress)}});
  return result.data.text||"";
}
export function mapFpsText(text){
  const clean=text.replace(/\s+/g," ").trim();
  const pick=(re)=>{const m=clean.match(re);return m?m[1].trim():undefined};
  return {
    fpsAmount:pick(/(?:montant|forfait).*?(\d+[,.]\d{2})\s*€/i),
    vehicleRegistration:pick(/\b([A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2})\b/i),
    fpsAgentId:pick(/(?:agent|identification).*?\b(\d{1,8})\b/i),
    fpsNoticeNumber:pick(/(?:avis|numéro).*?([0-9]{10,})/i),
    infractionDateTime:pick(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}[^0-9]{1,5}\d{1,2}[h:]\d{2})/i)
  };
}