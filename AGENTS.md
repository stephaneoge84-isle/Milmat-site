# AGENTS.md — Contravention Audit

## 1. Objet
Ce dépôt accueille progressivement une application d'analyse, d'audit et de préparation de contestations de procès-verbaux et avis de paiement en droit français.

L'application est un outil d'information et de préparation documentaire. Elle ne se présente jamais comme un avocat et ne garantit jamais l'annulation d'une sanction.

## 2. Architecture juridique
Séparer strictement :
1. référentiel juridique déterministe ;
2. moteur de règles ;
3. extraction documentaire ;
4. IA d'explication et de rédaction.

Le moteur juridique décide des règles applicables et des statuts. L'IA explique et rédige à partir de ces résultats. Elle ne peut ni inventer une règle, ni modifier silencieusement une conclusion juridique.

## 3. Droit applicable dans le temps
Chaque règle possède un identifiant stable, une version, une date d'effet, une date de fin éventuelle, une source officielle, une URL officielle, un statut de validation et une date de vérification.

Pour une analyse, sélectionner les règles telles que :
date_effet <= date_des_faits
et (date_fin est vide ou date_des_faits < date_fin)

Ne jamais écraser l'historique.

## 4. Statuts de preuve
Le moteur distingue :
- PRESENT_CONFORME
- PRESENT_INCOHERENT
- ABSENT_DU_DOCUMENT
- NON_DEMONTRE
- A_VERIFIER
- NON_APPLICABLE

ABSENT_DU_DOCUMENT signifie seulement que l'élément n'apparaît pas dans les pièces analysées. NON_DEMONTRE signifie que les pièces disponibles ne permettent pas d'établir la condition. Aucun des deux ne signifie automatiquement que l'administration n'a jamais détenu ou établi la pièce.

## 5. Conclusions
Utiliser des formulations prudentes :
- conforme au vu des pièces ;
- non démontré au vu des pièces disponibles ;
- incohérence apparente ;
- point à vérifier ;
- irrégularité potentielle ;
- argument juridiquement sérieux sous réserve de vérification.

Ne jamais conclure sans fondement suffisamment documenté à :
- « PV nul »
- « radar illégal »
- « agent non assermenté »
- « procédure frauduleuse »
- « l'État ne peut pas prouver »

## 6. Sources
Hiérarchie :
1. Légifrance ;
2. Cour de cassation et autres juridictions officielles ;
3. ANTAI, Service-Public, ministères et organismes publics ;
4. doctrine reconnue, seulement comme aide d'interprétation.

Chaque règle ACTIVE doit citer une source officielle précise.

## 7. Domaines initiaux
- Code de procédure pénale ;
- Code de la route ;
- Code général des collectivités territoriales ;
- PVe ;
- contrôle automatisé/radars ;
- métrologie des cinémomètres ;
- stationnement payant/FPS ;
- jurisprudence pertinente.

Références fondatrices à maintenir et vérifier :
- CPP art. 429 ;
- CPP art. 537 ;
- CPP art. R.49-1 et A.37 et suivants, notamment A.37-9, A.37-16, A.37-19, A.37-19-1 ;
- Code de la route art. L.130-4 et L.130-9 ;
- arrêté du 4 juin 2009 relatif aux cinémomètres de contrôle routier ;
- CGCT art. L.2333-87 et R.2333-120-1 et suivants.

## 8. Structure cible

    apps/
      web/
      api/

    packages/
      legal-engine/
        src/
          engine/
          rules/
          evaluators/
          classifiers/
          types/
        tests/

      legal-data/
        rules/
          cpp/
          code-route/
          radar/
          fps/
        jurisprudence/
        sources/
        versions/

      document-analysis/
      correspondence/
        templates/
        contestations/
        demandes/
        rapo/
      shared/

    scripts/
      legal-update/
      validate-rules/
      seed/

    tests/
      integration/
      fixtures/
        radar/
        pve/
        agent/
        fps/

    docs/
      architecture/
      legal-methodology/
      user-guide/

    .github/
      workflows/
      ISSUE_TEMPLATE/

## 9. Identifiants de règles
Format : DOMAINE-THEME-NNN
Exemples :
- CPP-429-FORME-001
- CPP-429-COMPETENCE-001
- CPP-429-CONSTAT-001
- CPP-537-PREUVE-001
- ROUTE-L130-4-COMPETENCE-001
- ROUTE-L130-9-RADAR-001
- RADAR-METRO-VERIF-001
- FPS-R120-4-MENTIONS-001

Un identifiant stable ne doit pas être réutilisé pour un autre concept.

## 10. Cycle de vie des règles
DRAFT -> VERIFIED -> ACTIVE -> SUPERSEDED/RETIRED
TODO_REVIEW ne doit jamais influencer une conclusion juridique active.

Toute évolution substantielle crée une nouvelle version et conserve l'ancienne.

## 11. Schéma conceptuel d'une règle
    {
      id,
      version,
      status,
      regime,
      title,
      description,
      legal_reference,
      official_source,
      official_url,
      effective_from,
      effective_to,
      applicability,
      required_evidence,
      evidence_mapping,
      result_states,
      legal_consequence,
      request_template,
      priority,
      verified_at,
      notes
    }

## 12. Moteur
L'entrée minimale est :
    {
      infractionDate,
      regime,
      extractedData,
      documentEvidence,
      availableDocuments
    }

La sortie minimale est :
    {
      legalVersionDate,
      applicableRules,
      checks,
      missingEvidence,
      anomalies,
      requests,
      confidence
    }

Les règles sont évaluées de manière déterministe. Les résultats doivent être traçables vers la règle et la source.

## 13. Tests obligatoires
Couverture minimale :
- agent direct conforme ;
- compétence agent inconnue ;
- radar vérification valide ;
- radar vérification expirée ;
- radar fixe neuf et régime applicable ;
- calcul/contrôle des marges ;
- FPS complet ;
- FPS mentions manquantes ;
- changement de règle selon date des faits ;
- règle TODO_REVIEW exclue des conclusions.

## 14. Mise à jour juridique mensuelle
Flux cible :
1. recherche de nouvelles sources ;
2. détection des modifications ;
3. proposition de version ;
4. validation humaine ;
5. tests ;
6. activation ;
7. conservation de l'ancienne version.

Aucune mise à jour juridique ne doit être publiée automatiquement en production sans validation.

## 15. Données personnelles et sécurité
Les PV contiennent potentiellement des données personnelles. Minimiser les données stockées, ne pas exposer les documents entre utilisateurs, journaliser les accès nécessaires, et ne jamais utiliser des données réelles dans des fixtures de test sans anonymisation.

## 16. Règle générale pour Codex
Privilégier les petites modifications vérifiables, les tests automatisés et les migrations réversibles.

Avant une modification juridique :
- vérifier la source officielle ;
- vérifier la date d'effet ;
- vérifier les dispositions transitoires ;
- écrire ou adapter le test ;
- conserver l'historique.

Avant toute réponse à l'utilisateur :
- ne pas présenter comme certain ce qui est seulement probable ;
- afficher les sources lorsque pertinent ;
- distinguer clairement « document analysé » et « dossier administratif complet ».
