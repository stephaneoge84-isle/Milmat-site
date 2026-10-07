import type { CaseFile } from "../case/caseFile";
import { calculateFpsDeadline } from "../case/deadlines";

export interface RapoDraft {
  kind: "RAPO_FPS";
  recipient: string;
  subject: string;
  body: string;
  attachments: string[];
  deadline?: string;
  warnings: string[];
  humanReviewRequired: true;
}

export function generateFpsRapo(caseFile: CaseFile): RapoDraft {
  if (caseFile.regime !== "FPS") throw new Error("Le générateur RAPO FPS ne peut traiter que le régime FPS");
  const authority = String(caseFile.evidence.find(e => e.key === "rapoAuthority")?.value ?? "[autorité RAPO à compléter]");
  const notice = String(caseFile.evidence.find(e => e.key === "fpsNoticeNumber")?.value ?? "[numéro d'avis à compléter]");
  const vehicle = String(caseFile.evidence.find(e => e.key === "vehicleRegistration")?.value ?? "[immatriculation à compléter]");
  const facts = String(caseFile.facts.find(f => f.key === "userExplanation")?.value ?? "[exposé des faits à compléter]");
  const grounds = caseFile.grounds.filter(g => g.code !== "UNDETERMINED").map(g => g.label).join(", ") || "À préciser";
  const requests = caseFile.generatedRequests.length ? caseFile.generatedRequests.map(r => `- ${r}`).join("\n") : "- Examiner les pièces jointes et les éléments de fait exposés.";

  let deadline: string | undefined;
  const warnings: string[] = [];
  if (caseFile.notificationDate) {
    deadline = calculateFpsDeadline("RAPO", caseFile.notificationDate).deadlineDate;
  } else {
    warnings.push("La date de notification n'est pas établie : ne pas présenter une date limite calculée comme certaine.");
  }
  warnings.push("Projet à relire et valider par l'utilisateur avant transmission.");
  warnings.push("Le générateur ne vérifie pas la véracité des déclarations de l'utilisateur.");

  return {
    kind: "RAPO_FPS",
    recipient: authority,
    subject: `RAPO FPS — avis ${notice} — véhicule ${vehicle}`,
    body: `Objet : recours administratif préalable obligatoire contre un avis de paiement FPS\n\nMadame, Monsieur,\n\nJe forme un recours administratif préalable obligatoire contre l'avis de paiement de forfait de post-stationnement référencé ${notice}.\n\nMotif(s) déclaré(s) : ${grounds}.\n\nExposé des faits :\n${facts}\n\nJe vous demande d'examiner les faits, les pièces jointes et les points de contrôle identifiés dans le dossier :\n${requests}\n\nJe sollicite, au regard des éléments produits, le réexamen de l'avis de paiement et les conséquences qui devront légalement en résulter.\n\nVeuillez agréer, Madame, Monsieur, l'expression de ma considération distinguée.\n\nStéphane OGÉ`,
    attachments: caseFile.documents.filter(d => d.available).map(d => d.name),
    deadline,
    warnings,
    humanReviewRequired: true,
  };
}
