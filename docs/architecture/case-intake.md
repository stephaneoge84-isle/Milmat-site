# Zone de contexte avant analyse

L'application ne doit pas commencer par le PDF du PV. Elle commence par une **fiche de situation**.

## Pourquoi

Un même document peut nécessiter une stratégie différente selon l'histoire du dossier.

Exemple important : l'utilisateur peut recevoir une amende forfaitaire majorée ou une lettre de rappel sans avoir reçu l'avis initial. L'ANTAI indique notamment que certaines lettres de rappel sont adressées après retour postal de l'avis initial avec la mention « pli non distribuable » ; la situation doit donc être instruite à partir des faits déclarés et des éléments disponibles, sans présumer de la réception de l'avis initial. 

Le moteur doit donc distinguer :
- document reçu ;
- document non reçu ;
- réception incertaine ;
- document antérieur évoqué par l'administration ;
- explication personnelle de l'utilisateur.

## Parcours

1. **Racontez votre situation**
   - champ libre ;
   - possibilité de décrire chronologiquement les faits ;
   - possibilité d'indiquer ce que l'utilisateur veut demander précisément.

2. **Quel document avez-vous reçu ?**
   - avis de contravention ;
   - amende forfaitaire majorée ;
   - lettre de rappel ;
   - FPS ;
   - autre / inconnu.

3. **Avez-vous reçu l'avis initial ?**
   - oui ;
   - non ;
   - je ne sais pas.

4. **Dates**
   - date de l'infraction si connue ;
   - date du document reçu ;
   - date de réception ;
   - date de réception de l'avis initial si connue.

5. **Historique**
   - courriers déjà reçus ;
   - changements d'adresse ;
   - paiements ;
   - contestations précédentes ;
   - échanges avec ANTAI, OMP, mairie ou autre service.

6. **Ce que vous souhaitez obtenir**
   - vérifier la régularité ;
   - demander des justificatifs ;
   - contester la majoration ;
   - contester l'infraction ;
   - demander une réponse sur un point précis ;
   - autre.

## Principe juridique

La zone de contexte ne produit **aucune conclusion juridique à elle seule**.

Elle sert à :
- qualifier le dossier ;
- sélectionner les règles à examiner ;
- générer les demandes documentaires pertinentes ;
- personnaliser le courrier ;
- signaler les points nécessitant une vérification humaine.

Elle ne doit jamais transformer :
- « je n'ai pas reçu » en « l'administration n'a pas envoyé » ;
- « je n'ai pas le PV » en « le PV n'existe pas » ;
- « je ne me souviens pas » en « absence de notification ».

## Personnalisation du courrier

Le courrier final doit comporter deux couches :

**Couche factuelle**
- récit fourni par l'utilisateur ;
- chronologie ;
- documents réellement reçus ;
- documents manquants ou non détenus.

**Couche juridique**
- règles applicables à la date des faits ;
- constats issus du document ;
- éléments non démontrés ;
- demandes précises de justification ou de communication.

L'IA peut reformuler le récit, mais ne peut pas ajouter un fait non fourni par l'utilisateur ni convertir une incertitude en affirmation.

## Cas « majoration sans avis initial »

Ce cas doit déclencher automatiquement un contrôle dédié de la chaîne documentaire et des délais, sans conclure automatiquement à une irrégularité.

L'ANTAI distingue les modalités de contestation selon qu'il s'agit d'un avis de contravention, d'une amende forfaitaire majorée ou d'un contrôle automatisé/PVe. Les délais diffèrent également selon le type de dossier. 

Le moteur doit donc demander et conserver :
- la nature exacte du document reçu ;
- sa date ;
- la date de réception si connue ;
- la preuve ou l'information disponible sur l'envoi antérieur ;
- l'adresse concernée à la période considérée ;
- toute lettre de rappel ou mention de retour postal ;
- toute démarche effectuée après réception.

Sources opérationnelles à maintenir à jour : ANTAI, Légifrance et Service-Public, avec priorité aux textes applicables à la date des faits.
