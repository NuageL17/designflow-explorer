# Designflow Explorer

Crée une maquette web interactive et entièrement cliquable pour le futur logiciel desktop « FLOW MASTER », destiné à un bureau d’études de pompage en Algérie. C’est un PROTOTYPE DE PRÉSENTATION avec données fictives uniquement : ne pas implémenter de vraie exportation XLSX/PDF, ni backend, ni authentification, ni intégration Excel. Toutes les interactions doivent fonctionner dans l’interface avec un état local React (ajout, modification, filtres, navigation, changements d’état, dialogues), et les données fictives peuvent être préchargées.

OBJECTIF
Permettre de juger le rendu et le parcours du futur logiciel avant le vrai développement Electron. Le prototype doit permettre de créer un devis, modifier un document existant, voir une liste de documents et leurs états, changer les états, ouvrir les détails et tester les dialogues d’export simulés (clairement indiqués comme simulation, sans produire de fichiers).

DIRECTION ARTISTIQUE
Design desktop premium et contemporain, très soigné, crédible pour une entreprise technique B2B en 2026. Éviter le look dashboard IA générique. Interface claire et lumineuse, fond gris très légèrement chaud, surfaces blanches, texte bleu nuit/anthracite, accent cobalt/bleu électrique utilisé avec parcimonie, petite touche cyan technique. Typographie moderne (Inter ou Geist), hiérarchie typographique excellente, espaces généreux mais denses juste comme il faut, lignes de tableaux raffinées, bordures fines, ombres très discrètes, coins modérés, icônes Lucide cohérentes, transitions subtiles et micro-interactions. Éviter gradients excessifs, glassmorphism, grosses cartes partout, emoji, couleurs criardes et grands espaces vides. L’app doit avoir l’apparence d’un logiciel Windows haut de gamme, pas d’un site marketing. Optimiser d’abord pour une fenêtre desktop 1440x900, avec adaptation tablette/mobile correcte.

STRUCTURE

- Barre latérale fixe avec logo typographique « FLOW MASTER », sous-titre « Gestion commerciale », navigation : Vue d’ensemble, Documents, Clients (démo), Catalogue (démo), Historique. Indiquer discrètement « Mode démonstration · Données fictives ».
- Barre supérieure avec titre de page, recherche globale, bouton de création « Nouveau document », avatar/profil « Administrateur » et paramètres.
- Tableau de bord : message d’accueil discret, actions rapides « Créer un devis », « Créer une facture », « Créer un bon de livraison » ; indicateurs du mois (devis en cours, documents finalisés, montant fictif, documents à traiter) ; activité récente et liste des documents récents.
- Page Documents : tableau professionnel avec référence, type, client, date, montant, état, dernière modification et menu d’action. Recherche et filtres fonctionnels (type, état), tri si possible, onglets « Tous », « Brouillons », « En cours », « Finalisés ». États avec badges sobres : Brouillon, En cours, À valider, Finalisé, Archivé. Précharger au moins 8 documents fictifs réalistes en DA, avec différents types et états.
- Création/édition : vrai formulaire interactif avec choix type (Devis, Facture, Bon de livraison), client, référence, date, validité si devis, lignes dynamiques d’articles (désignation, référence, quantité, prix unitaire, TVA), boutons ajouter/supprimer ligne, calcul en direct sous-total/TVA/total en DA. Utiliser des exemples de matériel de pompage (pompe submersible, coffret de commande, tuyauterie PEHD, installation et mise en service). Boutons « Enregistrer comme brouillon », « Marquer comme en cours », « Finaliser » et « Annuler ». Pour cette maquette, les changements de statut sont simulés. Valider les champs nécessaires et afficher des toasts accessibles.
- Détail document : page ou panneau latéral complet avec informations client, lignes, totaux, historique des événements, actions « Modifier », « Dupliquer », « Changer l’état », « Archiver ». L’action modifier doit rouvrir le formulaire prérempli et enregistrer réellement dans l’état React local.
- Action « Finaliser » : afficher une fenêtre soignée « Document prêt » avec options simulées « Excel (.xlsx) », « PDF » et « Les deux », ainsi que choix simulé « Remplacer les fichiers / Créer une nouvelle version ». Afficher clairement que les exports ne sont pas réellement générés dans la maquette. Le bouton de confirmation clôt le dialogue et change le document à l’état Finalisé.
- Historique : journal fictif des créations, modifications et changements d’état, mis à jour lors des actions de la session.
- Clients et Catalogue : pages simples mais élégantes, avec données fictives et interactions minimales, ou clairement indiquées comme exemples de démonstration.
- États vides, confirmations d’archivage, notifications/toasts, dialogues de confirmation et menu actions fonctionnels.

DONNÉES / COMPORTEMENT
Tout en français, format monétaire algérien avec séparateur lisible et suffixe DA. Dates de démonstration cohérentes. N’utiliser aucun vrai nom client, identifiant fiscal ou donnée personnelle. Les boutons ne doivent pas être décoratifs : chaque action doit fonctionner, naviguer, ouvrir un dialogue, modifier l’état local ou afficher un message expliquant la simulation. Persister les modifications de la session dans localStorage si disponible, afin que le prototype garde son état après actualisation. Fournir une action « Réinitialiser la démo » avec confirmation pour restaurer les données fictives initiales.

QUALITÉ
Construire le prototype complet, pas seulement une landing page ou un tableau de bord statique. Tester mentalement tous les parcours : dashboard → nouveau devis → ajouter une ligne → brouillon → liste → ouvrir → modifier → en cours → finaliser → dialogue d’export simulé → finalisé ; filtrer les documents ; ouvrir un document existant et le dupliquer ; archiver puis retrouver via filtre ; consulter l’historique. Soigner les détails et le responsive. Ne pas ajouter de backend ni de base cloud.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://designflow-explorer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0b28b064-7b51-447c-852e-bd2827e605cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
