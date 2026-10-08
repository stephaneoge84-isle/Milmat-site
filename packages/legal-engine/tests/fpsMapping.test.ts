import { describe, expect, it } from "vitest";
import { mapFpsText } from "../../../contravention/document-ingestion.js";

describe("FPS OCR mapping", () => {
  it("maps the real Aix-en-Provence three-page notice without cross-page contamination", () => {
    const ocr = `[PAGE 1]
Numéro de l'avis de paiement : 21130001700012 26 1 266 016 088 Clé 79
Date d'envoi de l'avis de paiement : 29/09/2026
Date et heure de constatation de l'absence ou de l'insuffisance de paiement immédiat du montant de la redevance : Le 23/09/2026 à 15h53
Lieu :
12 RUE DE LA POUDRIERE
13100 AIX-EN-PROVENCE
N° d'immatriculation du véhicule : EC-274-LF
Marque du véhicule : Volkswagen
Nom de la collectivité : AIX EN PROVENCE
Autorité dont relève l'agent assermenté :
MAIRIE D'AIX-EN-PROVENCE
PLACE DE L'HÔTEL DE VILLE
13100 AIX-EN-PROVENCE
N° d'identification de l'agent assermenté : 16
Le montant du FPS est égal à : 33 euros.
Ce FPS a cessé de produire ses effets le 23/09/2026 à 19h00.
« Signé »

[PAGE 2]
Modalités de paiement et contestation
Date limite de paiement de votre FPS : 05/01/2027
En cas de non-paiement ou de paiement insuffisant à cette date, un titre exécutoire assorti de la majoration prévue à l'article R. 2333-120-16 du code général des collectivités territoriales sera émis à votre encontre.
Paiement par smartphone ou par Internet
Paiement par téléphone
Paiement par courrier
Paiement au guichet d'un centre des finances publiques
Paiement chez un buraliste ou partenaire agréé

[PAGE 3]
Comment contester cet avis de paiement ?
Vous devez former un recours administratif préalable obligatoire (RAPO) avant toute saisine de la juridiction compétente.
Par voie électronique à l'adresse suivante :
https://www.aixenprovence.fr
Par lettre recommandée avec demande d'avis de réception à l'adresse suivante :
POLICE MUNICIPALE D'AIX EN PROVENCE
2 COURS DES MINIMES
13100 AIX EN PROVENCE
Dans quel délai ?
Ce recours (RAPO) est à adresser dans le délai d'un mois, soit avant le 05/11/2026.
Vous êtes réputé avoir reçu le présent avis 5 jours francs à compter de la date d'envoi.
Pièces à transmettre obligatoirement sous peine d'irrecevabilité du recours :
Une copie de l'avis de paiement contesté.
L'absence de réponse écrite reçue dans le mois suivant la date de l'avis de réception postal ou électronique du recours vaut rejet du recours.
La décision de rejet peut être contestée dans le délai d'un mois devant le tribunal du stationnement payant, sous réserve du paiement préalable du montant du forfait de post-stationnement.
Droits sur les données à caractère personnel.
droit d'accès et de rectification
`;
    const m = mapFpsText(ocr);

    expect(m.fpsAmount).toBe("33");
    expect(m.vehicleRegistration).toBe("EC-274-LF");
    expect(m.vehicleBrand).toBe("Volkswagen");
    expect(m.fpsAgentId).toBe("16");
    expect(m.fpsAgentAuthority).toContain("MAIRIE D'AIX-EN-PROVENCE");
    expect(m.infractionDate).toBe("2026-09-23");
    expect(m.infractionDateTime).toContain("23/09/2026");
    expect(m.infractionDateTime).toContain("15h53");
    expect(m.infractionLocation).toContain("12 RUE DE LA POUDRIERE");
    expect(m.noticeSendDate).toBe("2026-09-29");
    expect(m.noticeNotificationDate).toBe("2026-10-05");
    expect(m.paymentDeadline).toBe("2027-01-05");
    expect(m.fpsEndTime).toBe("19h00");
    expect(m.fpsNoticeNumber).toBe("21130001700012 26 1 266 016 088");
    expect(m.rapoAuthority).toContain("POLICE MUNICIPALE D'AIX EN PROVENCE");
    expect(m.rapoMandatory).toBe(true);
    expect(m.rapoSilenceRejection).toBe(true);
    expect(m.tribunalAppealInfo).toBe(true);
    expect(m.tribunalPriorPayment).toBe(true);
    expect(m.dataAccessRectification).toBe(true);
    expect(m.fpsNoticePart1Complete).toBe(true);
    expect(m.fpsNoticePart2Complete).toBe(true);
  });
});
