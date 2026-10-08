import type { CaseFile } from "../case/caseFile";
import type { LegalAudit } from "../types";
import type { ContestDossier } from "./contestDossier";

export interface AIDraftingPacket {
 systemInstruction:string;
 dossier:ContestDossier;
 legalConstraints:string[];
 forbiddenClaims:string[];
}

export function buildAIDraftingPacket(caseFile:CaseFile,audit:LegalAudit,dossier:ContestDossier):AIDraftingPacket{
 return {
  systemInstruction:"Rédige uniquement à partir du dossier structuré. Ne crée aucun fait, aucune pièce, aucune référence juridique et ne transforme pas une déclaration en preuve. Ne modifie jamais le statut d'un moyen. Si un point est contradictoire ou à vérifier, formule une demande de vérification plutôt qu'une affirmation.",
  dossier,
  legalConstraints:[
   ...audit.applicableRules.map(r=>r.legalReference),
   ...audit.requests
  ],
  forbiddenClaims:[
   "PV nul sans base juridique explicite",
   "avis nul sans base juridique explicite",
   "agent non assermenté sans démonstration",
   "radar illégal sans démonstration",
   "annulation certaine lorsque le moteur indique seulement une vérification ou une irrégularité potentielle"
  ]
 };
}
