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
  const raw=String(text||"");
  const clean=normalize(raw);
  const page1=(raw.match(/\[PAGE\s*1\]([\s\S]*?)(?=\[PAGE\s*2\]|$)/i)||[,raw])[1];
  const page2=(raw.match(/\[PAGE\s*2\]([\s\S]*?)(?=\[PAGE\s*3\]|$)/i)||[,raw])[1];
  const page3=(raw.match(/\[PAGE\s*3\]([\s\S]*)$/i)||[,raw])[1];

  const first=(value,patterns)=>{
    for(const re of patterns){
      const m=value.match(re);
      if(m&&m[1])return normalize(m[1]);
    }
    return undefined;
  };
  const yes=(value,re)=>re.test(value)?true:undefined;
  const dateValue=value=>normalizeDate(value);

  // The FPS form has fixed labels. Prefer label-scoped extraction over broad
  // keyword searches so amounts/dates from page 2 cannot overwrite page 1.
  const noticeNumber=first(page1,[
    /Num(?:é|e)ro\s+de\s+l['’]avis\s+de\s+paiement\s*:?\s*([0-9][0-9\s./|\[\]A-Za-z]{15,}?)(?=c?l[eé])/i
  ]);
  const sendDate=first(page1,[
    /(?:Date|date|ate)\s+d['’]envoi\s+de\s+l['’]avis\s+de\s+paiement\s*:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i
  ]);
  const infractionDateTime=first(page1,[
    /Date\s+et\s+heure\s+de\s+constatation[\s\S]{0,180}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\s*(?:à|a)?\s*\d{1,2}\s*[h:]\s*\d{2})/i
  ]);
  const infractionDate=first(page1,[
    /Date\s+et\s+heure\s+de\s+constatation[\s\S]{0,180}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i
  ]);
  const location=first(page1,[
    /Lieu\s*:?\s*([\s\S]*?)(?=N[°ºo]?\s*d['’](?:identification|immatriculation))/i
  ]);
  const registration=first(page1,[
    /N[°ºo]?\s*d['’]immatriculation\s+du\s+v(?:é|e)hicule\s*:?\s*([A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2})/i,
    /N[°ºo]?\s*d['’]immatriculation\s+du\s+v(?:é|e)hicule[\s\S]{0,60}?([A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2})/i
  ]);
  const brand=first(page1,[
    /Marque\s+du\s+v(?:é|e)hicule\s*:?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ -]{2,40}?)(?=\s*$|\n|\[)/i
  ]);
  const agentId=first(page1,[
    /N[°ºo]?\s*d['’]identification\s+de\s+l['’]agent\s+asserment(?:é|e)\s*:?\s*(\d{1,8})/i,
    /N[°ºo]?\s*d['’]identification\s+de\s+l['’]agent\s+asserment(?:é|e)[\s\S]{0,120}?N[°ºo]?\s*d['’]immatriculation\s+du\s+v(?:é|e)hicule[\s\S]{0,30}?(\d{1,8})/i
  ]);
  const agentAuthority=first(page1,[
    /Autorit(?:é|e)\s+dont\s+rel(?:è|e)ve\s+l['’]agent\s+asserment(?:é|e)\s*:?\s*([\s\S]*?)(?=Lieu\b)/i
  ]);
  const collectivity=first(page1,[
    /Nom\s+de\s+la\s+collectivit(?:é|e)\s*:\s*([^\n\r]+)/i
  ]);
  const amount=first(page1,[
    /Le\s+montant\s+du\s+FPS\s+est\s+égal\s+à\s*:?\s*(\d+(?:[,.]\d{1,2})?)\s*euros?/i,
    /Le\s+montant\s+du\s+FPS[^0-9]{0,80}(\d+(?:[,.]\d{1,2})?)\s*(?:€|euros?)/i
  ]);
  const endTimeMatch=page1.match(/cess(?:e|é)\s+de\s+produire\s+ses\s+effets[^0-9]{0,80}(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\s*(?:à|a)\s*(\d{1,2}\s*[h:]\s*\d{2}))/i);
  const endTime=endTimeMatch?endTimeMatch[2]:undefined;

  const paymentDeadline=first(page2,[
    /Date\s+limite\s+de\s+paiement\s+de\s+votre\s+FPS\s*:\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i
  ]);
  const rapoAuthority=first(page3,[
    /Par\s+lettre\s+recommand(?:ée|e)[\s\S]{0,250}?l['’]adresse\s+suivante\s*:\s*([\s\S]*?)(?=Dans\s+quel\s+d(?:é|e)lai)/i,
    /(?:recours|RAPO)[\s\S]{0,250}?aupr(?:è|e)s\s+de\s+([^\n\r]+)/i
  ]);
  const deemedReceipt=/r(?:é|e)put(?:é|e)\s+avoir\s+re(?:ç|c)u[^.]{0,120}?5\s+jours\s+francs\s+[àa]\s+compter\s+de\s+[|l]?[àa]\s+date\s+d['’]envoi/i.test(page3);
  const noticeNotificationDate=deemedReceipt&&sendDate?addClearDays(dateValue(sendDate),5):undefined;

  const cleanedAuthority=agentAuthority?.replace(/\s+/g," ").trim();
  const cleanedLocation=location?.replace(/\s+/g," ").trim();
  const cleanedRapoAuthority=rapoAuthority?.replace(/\s+/g," ").trim();

  return {
    fpsAmount:amount?amount.replace(",","."):undefined,
    vehicleRegistration:registration?.replace(/\s+/g,"").toUpperCase(),
    fpsAgentId:agentId,
    fpsNoticeNumber:noticeNumber?.replace(/\s+/g," ").replace(/[\[\]|./]/g," ").replace(/\b[LO](?=\d)/gi,"0").replace(/\s+/g," ").trim(),
    infractionDateTime:infractionDateTime?.replace(/\s+/g," ").trim(),
    infractionDate:dateValue(infractionDate),
    noticeSendDate:dateValue(sendDate),
    noticeNotificationDate,
    notificationMode:deemedReceipt?"ANTAI — notification par envoi postal, date réputée reçue selon l'avis":undefined,
    notificationProof:deemedReceipt?"Mention documentaire de réception réputée à 5 jours francs après l'envoi":undefined,
    printedPaymentDeadline:dateValue(paymentDeadline),
    paymentDeadline:dateValue(paymentDeadline),
    infractionLocation:cleanedLocation,
    fpsAgentAuthority:cleanedAuthority,
    rapoAuthority:cleanedRapoAuthority,
    vehicleBrand:brand?.trim(),
    fpsEndTime:endTime?.replace(/\s+/g," "),
    fpsSignature:yes(page1,/«?\s*Sign(?:é|e)\s*»?/i),
    fpsCollectivity:!!collectivity,
    paymentServiceCoordinates:yes(page2,/(?:Direction\s+G(?:é|e)n(?:é|e)rale\s+des\s+Finances\s+Publiques|Centre\s+d['’]encaissement|coordonn(?:é|e)es)/i),
    paymentMethods:yes(page2,/(?:smartphone|internet|t(?:é|e)l(?:é|e)phone|courrier|guichet|buraliste)/i),
    nonPaymentConsequence:yes(page2,/(?:non-paiement|paiement\s+insuffisant)[\s\S]{0,180}(?:titre\s+ex(?:é|e)cutoire|majoration)/i),
    rapoMandatory:yes(page3,/recours\s+administratif\s+pr(?:é|e)alable\s+obligatoire/i),
    rapoDeadlineAndMethod:yes(page3,/(?:dans\s+le\s+d(?:é|e)lai\s+d['’]un\s+mois|un\s+mois)[\s\S]{0,180}(?:voie\s+(?:é|e)lectronique|lettre\s+recommand(?:ée|e))/i),
    rapoSilenceRejection:yes(page3,/(?:absence\s+de\s+r(?:é|e)ponse|silence)[\s\S]{0,120}(?:rejet|rejet\s+du\s+recours)/i),
    tribunalAppealInfo:yes(page3,/tribunal\s+du\s+stationnement\s+payant/i),
    dataAccessRectification:yes(page3,/(?:droits?\s+sur\s+les\s+donn(?:é|e)es|droit\s+d['’]acc(?:è|e)s\s+et\s+de\s+rectification)/i),
    rapoRequiredDocuments:yes(page3,/(?:Pi(?:è|e)ces\s+[àa]\s+transmettre\s+obligatoirement|pi(?:è|e)ces\s+obligatoires)[\s\S]{0,200}(?:avis|certificat|cession)/i),
    tribunalAppealDeadline:yes(page3,/tribunal\s+du\s+stationnement\s+payant[\s\S]{0,180}(?:d(?:é|e)lai\s+d['’]un\s+mois|un\s+mois)/i),
    tribunalPriorPayment:yes(page3,/tribunal\s+du\s+stationnement\s+payant[\s\S]{0,220}(?:paiement\s+pr(?:é|e)alable|paiement\s+pr(?:é|e)alable\s+du\s+montant)/i),
    fpsNoticePart1Complete:yes(page1,/Etablissement\s+de\s+l['’]avis\s+de\s+paiement/i),
    fpsNoticePart2Complete:yes(page2,/Modalit(?:é|e)s\s+de\s+paiement\s+et\s+contestation/i)
  };
}

function addClearDays(value,days){
  if(!value)return undefined;
  const d=new Date(value+"T00:00:00");
  d.setDate(d.getDate()+days+1);
  return d.toISOString().slice(0,10);
}
