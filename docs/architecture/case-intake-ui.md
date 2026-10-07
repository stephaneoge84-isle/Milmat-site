# Interface — contexte avant analyse

La première vue de l'application doit être « Votre situation », avant tout dépôt ou analyse du PV.

## Écran 1 — Racontez-nous le dossier

Texte d'introduction :

> Avant d'analyser votre document, racontez-nous ce qui s'est passé.
> Votre réponse permet d'adapter l'analyse à votre situation. Il n'est pas nécessaire d'employer des termes juridiques.

Champs :
- Expliquez votre situation — texte libre obligatoire.
- Quel document avez-vous reçu ? — avis de contravention, amende forfaitaire majorée, lettre de rappel, FPS, autre.
- Avez-vous reçu l'avis initial ? — oui, non, je ne sais pas.
- Quand avez-vous reçu le document que vous avez aujourd'hui ?
- Avez-vous reçu d'autres courriers ?
- Y a-t-il un élément particulier à examiner ?
- Que souhaitez-vous demander à l'administration ?
- Quels documents avez-vous en votre possession ?

## Cas spécifique : majoration sans avis initial

Si l'utilisateur indique « amende forfaitaire majorée » et « je n'ai pas reçu l'avis initial », l'application affiche une alerte de contexte, puis poursuit vers le dépôt du document reçu.

> Votre situation nécessite une vérification supplémentaire. Nous allons distinguer ce que vous affirmez, ce que le document reçu indique et ce que l'administration devra éventuellement justifier. L'absence de l'avis initial dans vos documents ne permet pas, à elle seule, de conclure qu'il n'a pas été envoyé.

L'ANTAI précise notamment qu'une lettre de rappel peut être envoyée après le retour postal de l'avis initial avec la mention « pli non distribuable ». Ce cas doit donc déclencher un contrôle de la chaîne documentaire et des circonstances de notification, sans conclusion automatique d'irrégularité. citeturn0search0

## Principe

Le formulaire produit un objet CaseContext qui accompagne RuleInput pendant toute l'analyse.

L'IA peut utiliser ce contexte pour personnaliser le courrier. Elle ne peut pas transformer une déclaration de l'utilisateur en preuve ni inventer un fait manquant.

Le moteur juridique reste maître des conclusions : conforme, non démontré, incohérence apparente, à vérifier ou irrégularité potentielle.
