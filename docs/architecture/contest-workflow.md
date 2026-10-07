# Contestation : décision et pré-remplissage

La sortie de l'analyse ne doit pas être limitée à une lettre. Lorsque l'utilisateur souhaite contester, l'application doit proposer un parcours de contestation complet.

## Alerte principale

Pour une amende forfaitaire que l'utilisateur souhaite contester :

> **Vous souhaitez contester cette amende : ne la payez pas.**
>
> Le paiement de l'amende forfaitaire vaut reconnaissance de l'infraction et peut entraîner des conséquences sur les points du permis. Certaines procédures exigent toutefois une **consignation** : une consignation n'est pas un paiement de l'amende et son régime doit être expliqué séparément.

Cette alerte ne doit pas être affichée de manière générale pour tous les dossiers. Le FPS suit un parcours spécifique et doit être traité séparément.

L'ANTAI indique que le paiement de l'amende forfaitaire vaut reconnaissance de l'infraction. Le site officiel amendes.gouv.fr indique également de ne pas payer lorsqu'on souhaite contester ou désigner un autre conducteur. citeturn0search0turn1search5

## Décision automatique

Après l'audit juridique, le moteur doit déterminer :
1. l'utilisateur veut-il contester ?
2. conteste-t-il la réalité de l'infraction, la personne concernée, le véhicule, la procédure ou un autre élément ?
3. s'agit-il d'une contravention, d'un radar, d'un PVe ou d'un FPS ?
4. une consignation est-elle exigible ?
5. quel formulaire et quelle procédure correspondent au dossier ?
6. quel délai s'applique ?
7. quelles pièces doivent être jointes ?

L'ANTAI distingue les requêtes en exonération, les réclamations sur amende forfaitaire majorée et les procédures de désignation. Les modalités varient selon le mode de verbalisation. citeturn1search2

## Pré-remplissage

L'application doit proposer **« Préparer ma contestation »** puis générer un dossier contenant :
- le formulaire officiel correspondant ;
- les champs pré-remplis à partir du document analysé ;
- les informations personnelles fournies ;
- la case de procédure pertinente ;
- les références de l'avis ;
- les dates et éléments certains ;
- un texte de motivation préparé séparément ;
- la liste des pièces à joindre ;
- une checklist avant envoi.

Le formulaire reste modifiable par l'utilisateur avant transmission.

## PDF remplissable

Format cible : **PDF avec champs éditables**.

Principe :
- conserver le formulaire officiel comme modèle ;
- identifier ses champs ;
- mapper les données extraites vers les champs ;
- remplir uniquement ce qui est certain ;
- laisser vides les champs non démontrés ;
- permettre la correction manuelle ;
- générer une version finale imprimable ;
- ne jamais signer à la place de l'utilisateur.

Il faudra maintenir une version du modèle par type de procédure, car le formulaire joint à l'avis peut différer selon la situation.

L'ANTAI indique que la contestation peut être réalisée en ligne ou, selon les cas, par courrier avec le formulaire joint à l'avis. citeturn1search2turn1search3

## Règle de sécurité

Le moteur ne doit jamais pré-remplir un élément juridique incertain comme s'il était établi.

Exemple :
- document : « vitesse retenue 96 km/h » → pré-remplissage autorisé ;
- utilisateur : « je n'étais probablement pas le conducteur » → ne pas déclarer automatiquement un conducteur différent ;
- moteur : « consignation potentiellement exigible » → afficher une alerte et demander confirmation, jamais transformer cela en paiement de l'amende.

## Délais

Le système doit calculer le délai à partir de la nature exacte du document et de sa date pertinente. Les délais peuvent notamment être de 45 jours pour un avis de contravention, tandis que les amendes forfaitaires majorées obéissent à des délais différents selon le mode de verbalisation et les circonstances. citeturn0search3turn1search2

## Principe produit

**Analyser → décider → préparer → vérifier → transmettre.**

L'application ne doit pas simplement produire une lettre de contestation : elle doit préparer l'utilisateur à accomplir correctement la procédure officielle.
