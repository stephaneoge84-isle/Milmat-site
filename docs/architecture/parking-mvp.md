# MVP stationnement — premier parcours fonctionnel

Le premier parcours porte sur une contravention ordinaire de stationnement, hors FPS.

L'application doit distinguer dès l'entrée :
- contravention de stationnement ;
- FPS ;
- amende forfaitaire majorée ;
- situation incertaine.

Pour une contravention de stationnement, les règles de formulaire applicables aux infractions d'arrêt ou de stationnement sont notamment encadrées par l'article A37-6 du Code de procédure pénale. Le régime probatoire des contraventions doit aussi être traité avec prudence au regard de l'article 537 du CPP.

## Données à extraire

- numéro de l'avis ;
- date de l'avis ;
- date et heure de l'infraction ;
- lieu ;
- immatriculation ;
- nature de l'infraction ;
- référence réglementaire ;
- montant ;
- date limite ;
- identification disponible de l'agent ou du service ;
- indication PVe si présente.

Chaque donnée doit pouvoir être marquée comme présente, incohérente, absente du document, non démontrée ou à vérifier.

## Contrôles du MVP

1. Qualification du document.
2. Qualification de la nature de l'infraction.
3. Contrôle des éléments matériels du constat.
4. Contrôle de la compétence de l'agent lorsque pertinent.
5. Contrôle des délais.
6. Identification du motif de contestation.
7. Détermination de la procédure.
8. Génération d'un rapport lisible.
9. Préparation d'une contestation éditable, sans signature automatique.

## Garde-fous

Le moteur ne doit jamais déduire :
- « PV nul » d'une donnée absente ;
- « agent non compétent » d'une identité non affichée ;
- « infraction non commise » de l'absence de preuve dans le document fourni ;
- « avis jamais envoyé » du fait que l'utilisateur ne possède pas l'avis initial.

L'absence d'un élément dans l'avis fourni déclenche une vérification ou une demande ciblée, pas une conclusion automatique.

## Hors périmètre de ce MVP

- FPS complet ;
- calcul exhaustif de toutes les classes de stationnement ;
- analyse photographique de la signalisation ;
- vérification automatique des arrêtés municipaux ;
- récupération des données détenues par l'administration ;
- garantie de résultat.
