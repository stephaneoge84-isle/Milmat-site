const TESSERACT_URL="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const PDFJS_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
const PDFJS_WORKER_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

async function loadScript(url){
  return new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=url;s.onload=resolve;s.onerror=()=>reject(new Error("Impossible de charger "+url));document.head.appendChild(s)});
}
async function loadTesseract(){
  if(window.Tesseract)return window.Tesseract;
  await loadScript(TESSERACT_URL);
  return window.Tesseract;
}
async function loadPdfJs(){
  if(window.__MILMAT_PDFJS)return window.__MILMAT_PDFJS;
  const pdfjs=await import(PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_WORKER_URL;
  window.__MILMAT_PDFJS=pdfjs;
  return pdfjs;
}
async function ocrCanvas(canvas,T,onProgress){
  const result=await T.recognize(canvas,"fra",{logger:m=>{if(typeof m.progress==="number")onProgress(m.progress)}});
  return result.data.text||"";
}
export async function extractDocumentText(file,onProgress=()=>{}){
  if(!file)throw new Error("Aucun document sélectionné.");
  const T=await loadTesseract();
  if(file.type.startsWith("image/"))return ocrCanvas(await imageToCanvas(file),T,onProgress);
  if(file.type==="application/pdf"||file.name?.toLowerCase().endsWith(".pdf")){
    const pdfjs=await loadPdfJs();
    const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
    const pages=[];
    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n);
      const viewport=page.getViewport({scale:2});
      const canvas=document.createElement("canvas");
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
      const text=await ocrCanvas(canvas,T,p=>onProgress(((n-1)+p)/pdf.numPages));
      pages.push(`[PAGE ${n}]\n${text}`);
    }
    return pages.join("\n\n");
  }
  throw new Error("Format non pris en charge. Utilisez un PDF ou une image.");
}
export const extractImageText=extractDocumentText;

function imageToCanvas(file){
  return new Promise((resolve,reject)=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext("2d").drawImage(img,0,0);URL.revokeObjectURL(url);resolve(c)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image illisible."))};
    img.src=url;
  });
}
function normalize(s){return s.replace(/\u00a0/g," ").replace(/\s+/g," ").trim()}
function pick(text,regex){const m=text.match(regex);return m?normalize(m[1]):undefined}
function yesIfPresent(text,regex){return regex.test(text)?true:undefined}
function normalizeDate(value){
  if(!value)return undefined;
  const p=value.replace(/[.-]/g,"/").split("/");
  if(p.length!==3)return value;
  const y=p[2].length===2?"20"+p[2]:p[2];
  return `${y}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`;
}
export function mapFpsText(text){
  const clean=normalize(text);
  const amount=pick(clean,/(?:montant|forfait|fps)[^0-9]{0,80}(\d+(?:[,.]\d{1,2})?)\s*(?:€|euros?)/i);
  const infractionDateTime=pick(clean,/((?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\s*(?:à|a)?\s*\d{1,2}\s*[h:]\s*\d{2})/i);
  const sendDate=pick(clean,/(?:date\s+d['’]envoi|envoy[ée]|émis(?:e)?|envoi)[^0-9]{0,30}(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i);
  const paymentDeadline=pick(clean,/(?:payable|paiement|payer)[^0-9]{0,100}(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i);
  const registration=pick(clean,/\b([A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2})\b/i);
  const agentId=pick(clean,/(?:agent|identification|matricule)[^0-9]{0,40}(\d{1,8})\b/i);
  const noticeNumber=pick(clean,/(?:num(?:éro)?(?:\s+de)?\s+avis|avis(?:\s+n[°o]?)?)[^0-9]{0,20}([0-9][0-9 ]{8,})/i);
  const location=pick(clean,/(?:lieu|adresse|à|au)[^,.;]{0,10}([^.;]{5,80}\d{1,4}[^.;]{3,80})/i);
  const authority=pick(clean,/(?:autorité|mairie|commune|collectivité)[^:;]{0,5}[:\-]?\s*([^.;]{3,100})/i);
  const brand=pick(clean,/(?:marque|véhicule|constructeur)[^:;]{0,20}[:\-]?\s*([A-Z][A-Za-zÀ-ÿ-]{2,30})/i);
  const endTime=pick(clean,/(?:fin|échéance|fin d['’]effet)[^0-9]{0,30}(\d{1,2})\s*[h:]\s*(\d{2})/i);
  const rapoAuthority=pick(clean,/(?:RAPO|recours administratif préalable)[^.;]{0,120}(?:auprès de|à)\s+([^.;]{3,100})/i);
  return {
    fpsAmount:amount?amount.replace(",","."):undefined,
    vehicleRegistration:registration,
    fpsAgentId:agentId,
    fpsNoticeNumber:noticeNumber?.replace(/\s+/g," "),
    infractionDateTime,
    infractionDate:normalizeDate(infractionDateTime?.split(/\s+/)[0]),
    noticeSendDate:normalizeDate(sendDate),
    printedPaymentDeadline:normalizeDate(paymentDeadline),
    infractionLocation:location,
    fpsAgentAuthority:authority,
    rapoAuthority,
    vehicleBrand:brand,
    fpsEndTime:endTime,
    fpsSignature:yesIfPresent(clean,/\b(?:sign[ée]|signature)\b/i),
    fpsCollectivity:yesIfPresent(clean,/(?:mairie|commune|collectivité)/i),
    paymentServiceCoordinates:yesIfPresent(clean,/(?:service|guichet|coordonnées).{0,40}(?:paiement|stationnement)/i),
    paymentMethods:yesIfPresent(clean,/(?:moyens|modalités|payer).{0,80}(?:internet|téléphone|guichet|carte|chèque)/i),
    nonPaymentConsequence:yesIfPresent(clean,/(?:non[- ]paiement|impayé).{0,100}(?:titre exécutoire|majoration)/i),
    rapoMandatory:yesIfPresent(clean,/RAPO.{0,80}(?:obligatoire|préalable)/i),
    rapoDeadlineAndMethod:yesIfPresent(clean,/RAPO.{0,160}(?:un mois|1 mois|électronique|recommand)/i),
    rapoSilenceRejection:yesIfPresent(clean,/(?:silence|absence de réponse).{0,100}(?:rejet|rejeté)/i),
    tribunalAppealInfo:yesIfPresent(clean,/(?:tribunal|juridiction).{0,100}(?:stationnement payant)/i),
    dataAccessRectification:yesIfPresent(clean,/(?:accès|rectification).{0,120}(?:données|traitement)/i),
    rapoRequiredDocuments:yesIfPresent(clean,/(?:RAPO|recours).{0,160}(?:pièces|documents).{0,80}(?:joindre|produire)/i),
    tribunalAppealDeadline:yesIfPresent(clean,/(?:tribunal|juridiction).{0,120}(?:un mois|1 mois)/i),
    tribunalPriorPayment:yesIfPresent(clean,/(?:tribunal|juridiction).{0,160}(?:paiement préalable|avoir payé)/i),
    fpsNoticePart1Complete:undefined,
    fpsNoticePart2Complete:undefined
  };
}
