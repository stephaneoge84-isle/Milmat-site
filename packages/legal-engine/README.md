# MILMAT — Legal Engine

Le moteur applique le principe : le droit décide ; l IA analyse et rédige.

## Architecture

1. CaseFile est le dossier canonique : faits, preuves, documents, motifs, audit, historique.
2. buildRuleInputFromCase() est l unique adaptateur CASE vers le moteur déterministe.
3. Les règles sont versionnées par date des faits (effectiveFrom / effectiveTo).
4. Une absence dans une copie, une déclaration utilisateur ou une extraction OCR incertaine ne devient pas automatiquement une absence juridique.
5. Les statuts sont conservateurs : PRESENT_CONFORME, PRESENT_INCOHERENT, ABSENT_DU_DOCUMENT, NON_DEMONTRE, A_VERIFIER, NON_APPLICABLE.
6. Le dossier garde une révision à chaque étape importante et marque la revue humaine lorsqu une anomalie ou une vérification est nécessaire.
7. rapoGenerator.ts prépare un RAPO FPS sans l envoyer.
8. aiDraftGuard.ts interdit au projet rédigé de transformer une vérification en conclusion juridique catégorique.
9. evidenceIngestion.ts accepte les résultats OCR/extraction avec provenance et niveau de confiance.
10. caseStore.ts fournit le contrat de persistance ; le stockage mémoire sert de référence avant branchement à une base.

## FPS

Le contrôle R.2333-120-4 est séparé entre première et seconde partie de l avis. Sont notamment contrôlés : mentions d identification, constat, véhicule, montant, fin d effet, signature, numéro d avis, service et moyens de paiement, date limite, conséquence du non-paiement, RAPO obligatoire, autorité et modalités du RAPO, rejet implicite, tribunal du stationnement payant et information d accès/rectification.

Les échéances sont calculées séparément :
- RAPO : un mois à compter de la notification — CGCT art. R.2333-120-13.
- Paiement FPS : trois mois suivant la notification — CGCT art. L.2333-87 IV.

## Interface

contravention/analyse-fps.html est l interface de test du parcours FPS. analyse-ciblee.html redirige vers cette version.

document-ingestion.js fournit un adaptateur OCR image avec relecture obligatoire de l utilisateur.

## Validation

Le dépôt contient un tsconfig.json, un package.json, des tests Vitest et une GitHub Action qui lance typecheck + tests sur la branche de travail et sur les pull requests vers main.

Ce dépôt ne fusionne pas automatiquement les changements vers main.
