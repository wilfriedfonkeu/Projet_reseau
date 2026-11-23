---
title: "Njangui"
author: "Projet Réseau"
date: "Novembre 2026"
header-includes:
  - |
    \usepackage{xcolor}
    \usepackage{fontspec}
    \setmainfont{DejaVu Sans}
    \usepackage{graphicx}
    \usepackage{titlesec}
    \usepackage{booktabs}
    \usepackage{longtable}
    \usepackage{array}
    \usepackage{enumitem}
    \usepackage{geometry}
    \geometry{margin=2.2cm}
    \definecolor{njangui}{HTML}{EA580C}
    \definecolor{njanguidark}{HTML}{9A3412}
    \definecolor{njanguilight}{HTML}{F97316}
    \titleformat{\section}{\color{njanguidark}\Large\bfseries}{\thesection}{0.8em}{}
    \titleformat{\subsection}{\color{njangui}\large\bfseries}{\thesubsection}{0.8em}{}
    \makeatletter
    \renewcommand{\maketitle}{%
      \begin{titlepage}
      \centering
      \includegraphics[width=0.36\textwidth]{/tmp/opencode/logo.png}\par
      \vspace{1.6cm}
      {\Huge\bfseries\color{njanguidark} Njangui\par}
      \vspace{0.4cm}
      {\Large\color{njangui} Plateforme camerounaise de tourisme en ligne\par}
      \vspace{2.6cm}
      {\large\@author\par}
      \vspace{0.4cm}
      {\large\@date\par}
      \vfill
      {\small\color{gray} Rapport de présentation --- Projet Réseau\par}
      \end{titlepage}
    }
    \makeatother
---

# Introduction

**Njangui** est une plateforme numérique camerounaise dédiée au tourisme. Elle
joue le rôle de **place de marché (marketplace) touristique** : elle rassemble,
au sein d'un même service en ligne, les voyageurs et l'ensemble des
professionnels du secteur --- agences touristiques, hôtels, guides et agences de
voyages --- afin de faciliter la découverte, la réservation et la gestion de
séjours au Cameroun.

Ce document présente en détail le rôle de la plateforme, ses acteurs, son
fonctionnement, son modèle économique, sa valeur ajoutée ainsi que ses limites
actuelles.

# 1. Contexte et problématique

Le Cameroun dispose d'un potentiel touristique exceptionnel : plages de Kribi,
Mont Cameroun, chutes d'Ekom Nkam et de la Lobé, lacs Manengouba, Parc national
de Waza, réserve du Dja, patrimoine Bamoun, etc. Pourtant, l'offre reste
**fragmentée** :

- les informations sont dispersées entre réseaux sociaux, bouche-à-oreille et
  sites isolés ;
- les touristes ont du mal à comparer les offres et à réserver en confiance ;
- les petits opérateurs (guides, hôtels, agences) manquent de visibilité et
  d'outils numériques ;
- les paiements et la coordination entre acteurs (transport, hébergement,
  activités) sont peu structurés.

**Njangui répond à cette problématique** en centralisant l'écosystème
touristique sur une seule interface, accessible aux touristes comme aux
professionnels.

# 2. Rôle et mission de la plateforme

## 2.1 Rôle principal

Njangui agit comme un **intermédiaire numérique** entre l'offre et la demande
touristiques. Concrètement, elle :

- **centralise** les offres touristiques (packs, circuits, hébergements,
  transports) ;
- **met en relation** les touristes avec les professionnels vérifiés ;
- **sécurise et simplifie** la réservation et le paiement ;
- **fournit des outils de gestion** aux professionnels (tableaux de bord,
  statistiques, messagerie, publication d'offres) ;
- **valorise** le tourisme local et les savoir-faire camerounais.

## 2.2 Mission

> Rendre le tourisme camerounais simple, fiable et accessible, en connectant
> voyageurs et professionnels sur une plateforme unique, moderne et
> multi-acteurs.

## 2.3 Vision

Devenir la **référence du tourisme digital au Cameroun** et, à terme, en Afrique
centrale, en offrant un écosystème complet où chaque acteur (touriste, agence,
hôtel, guide, transporteur, administrateur) trouve les outils adaptés à son
besoin.

# 3. Les acteurs de l'écosystème

La plateforme distingue **six profils** d'utilisateurs, chacun disposant d'un
espace dédié et de permissions propres.

| Profil | Rôle dans l'écosystème | Espace associé |
|--------|------------------------|----------------|
| **Touriste** | Recherche, réserve et vit des expériences | `/dashboard/tourist` |
| **Agence touristique** | Publie des packs et circuits, gère ses réservations | `/dashboard/agency` |
| **Hôtel** | Gère chambres, tarifs et réservations | `/dashboard/hotel` |
| **Guide** | Propose des circuits et accompagne les visiteurs | `/dashboard/guide` |
| **Agence de voyages** | Gère une flotte de véhicules et des trajets | `/dashboard/agence-voyages` |
| **Administrateur** | Supervise la plateforme, modère et pilote | `/dashboard/admin` |

Après connexion, chaque utilisateur est automatiquement redirigé vers son espace
selon son rôle.

# 4. Comment fonctionne la plateforme

## 4.1 Parcours du touriste

1. **Découverte** : page d'accueil avec recherche (destination, date, budget,
   type d'activité), packs, circuits, destinations et agences partenaires.
2. **Exploration** : page de recherche avec filtres, fiche détaillée de l'offre
   et de l'hôtel, avis clients, localisation sur carte.
3. **Réservation** : configuration du séjour (dates, participants, options) puis
   validation ; un compte est requis pour finaliser.
4. **Suivi** : espace personnel avec réservations, factures, portefeuille
   virtuel, points de fidélité, avis et messagerie.

## 4.2 Parcours des professionnels

1. **Inscription** : création de compte en choisissant son rôle (agence, hôtel,
   guide, agence de voyages).
2. **Abonnement** : pour les agences, choix d'une formule d'abonnement
   conditionnant le nombre de publications.
3. **Publication** : ajout et gestion d'offres, de chambres, de circuits ou de
   trajets.
4. **Gestion** : suivi des réservations, revenus, commissions, clients et
   échanges via la messagerie intégrée.

## 4.3 Architecture technique

La plateforme repose sur des technologies web modernes :

- **Next.js 16** (App Router) et **React 19** pour l'interface ;
- **TypeScript** pour la robustesse du code ;
- **Tailwind CSS v4** et composants **shadcn/Radix UI** pour le design ;
- **Leaflet / OpenStreetMap** pour la cartographie ;
- **Recharts** pour les graphiques des tableaux de bord ;
- **Sonner** pour les notifications, **react-hook-form** et **zod** pour les
  formulaires ;
- un système **multilingue français / anglais** et un thème clair / sombre.

## 4.4 Gestion des données

- Un **jeu de données de démonstration** décrit les packs, agences, guides,
  hôtels, circuits, avis et indicateurs.
- La persistance s'appuie sur des **API internes** (`/api/...`) qui
  enregistrent certaines données (offres personnalisées, réservations, avis,
  messages, trajets) dans des fichiers JSON.
- Les informations de session et d'authentification sont stockées localement
  dans le navigateur.

## 4.5 Authentification et sécurité

L'authentification est gérée côté navigateur, avec des comptes de démonstration
pré-configurés pour chaque rôle. Ce mécanisme est adapté à une démonstration ou
à un prototype ; une mise en production nécessiterait une authentification
serveur sécurisée (mots de passe chiffrés, jetons, base de données).

# 5. Fonctionnalités détaillées par espace

## 5.1 Site public

- Page d'accueil avec moteur de recherche multi-critères ;
- Présentation des agences partenaires et de leurs offres ;
- Catalogue de packs (Aventure, Luxe, Détente, Culturel) ;
- Circuits thématiques et destinations phares ;
- **Configurateur de voyage sur mesure** (destination, hébergement, transport,
  activités) ;
- Carte interactive du Cameroun et témoignages clients ;
- Page de tarification pour les professionnels.

## 5.2 Espace touriste

- Tableau de bord avec réservations actives et voyages terminés ;
- Historique et détail des réservations, téléchargement de billets ;
- Factures et documents ;
- **Portefeuille virtuel** (rechargement par carte, Orange Money, MTN Mobile
  Money) ;
- **Points de fidélité** par agence ;
- Avis et évaluations ;
- Messagerie avec les professionnels ;
- Carte des offres et hébergements à proximité.

## 5.3 Espace agence touristique

- Vue d'ensemble (revenus, commission, net, nombre de réservations) ;
- Publication et gestion des offres (créer, modifier, publier/dépublier,
  supprimer) dans la limite de l'abonnement ;
- Gestion des guides associés et des partenaires ;
- Suivi des clients et des réservations ;
- Graphiques de revenus bruts et nets ;
- Gestion de l'abonnement et du profil.

## 5.4 Espace hôtel

- Vue d'ensemble (chambres disponibles, réservations, revenus) ;
- Gestion des types de chambres (capacité, prix, disponibilité) ;
- Suivi des réservations entrantes ;
- Tarification et ajustements saisonniers ;
- Messagerie et profil de l'établissement.

## 5.5 Espace guide

- Vue d'ensemble (circuits proposés, visites, note moyenne) ;
- Gestion des visites et des participants ;
- Consultation des avis reçus ;
- Langues parlées et spécialités ;
- Messagerie et profil.

## 5.6 Espace agence de voyages

- Vue d'ensemble (véhicules, trajets actifs, réservations, revenus) ;
- Gestion de la **flotte de véhicules** ;
- **Planificateur de trajets** (départ, arrivée, horaire, véhicule, prix) ;
- Suivi des réservations de passagers ;
- Messagerie et profil.

## 5.7 Espace administrateur

- Indicateurs clés de performance (agences actives, touristes inscrits,
  réservations, revenus) ;
- Graphiques de revenus et de réservations ;
- Modération des packs (masquer / restaurer) ;
- Gestion des partenaires (activer / suspendre) ;
- Vue financière (revenus, commissions, montants à reverser) ;
- Enregistrement manuel de réservations ;
- Réglages de la plateforme (thème, langue).

# 6. Modèle économique

Njangui repose sur deux sources de revenus complémentaires :

## 6.1 Abonnements des agences

Les agences touristiques paient un abonnement qui détermine leur quota de
publications.

| Formule | Prix (FCFA) | Durée | Publications |
|---------|------------:|-------|-------------:|
| Mensuel | 25 000 | 1 mois | 5 |
| Semestriel | 120 000 | 6 mois | 15 |
| Annuel | 200 000 | 1 an | 50 |

## 6.2 Commission sur les réservations

En plus de l'abonnement, la plateforme prélève une **commission de 10 %** sur
chaque paiement effectué par un touriste via une agence. Cette commission
rémunère le service d'intermédiation, d'hébergement et de mise en relation.

# 7. Valeur ajoutée

- **Pour les touristes** : gain de temps, comparaison facilitée, réservation
  centralisée, paiement simplifié, avis et transparence.
- **Pour les professionnels** : visibilité accrue, outils de gestion et de
  statistiques, accès à une clientèle plus large, digitalisation de l'activité.
- **Pour le territoire** : valorisation du patrimoine et du tourisme local,
  structuration d'une filière encore fragmentée.
- **Pour l'économie** : monétisation numérique du tourisme et création
  d'opportunités pour les petits opérateurs.

# 8. Limites actuelles

Le projet est, à ce stade, un **prototype fonctionnel**. Ses principales limites
sont :

- données majoritairement statiques ou stockées dans le navigateur, sans base de
  données centralisée ;
- absence de **paiement réel** (transactions simulées) ;
- authentification côté client, sans chiffrement des mots de passe ni gestion
  serveur des sessions ;
- certaines actions sont illustratives (simulations d'export, de génération de
  PDF, etc.) ;
- sécurité et gestion des droits à renforcer pour une mise en production.

# 9. Perspectives d'évolution

- Mise en place d'une **base de données** et d'une **authentification serveur**
  sécurisée ;
- Intégration de **passerelles de paiement réelles** (Orange Money, MTN,
  cartes bancaires) ;
- Déploiement en ligne et application mobile ;
- Système de **notifications** et de **réservation en temps réel** ;
- Gestion avancée des rôles, des droits et de la modération ;
- Tableaux de bord analytiques enrichis pour les professionnels et
  l'administration.

# 10. Conclusion

Njangui est bien plus qu'un simple site de réservation : c'est une **plateforme
d'intermédiation touristique multi-acteurs** dont le rôle est de connecter les
voyageurs et les professionnels du tourisme camerounais, de simplifier la
réservation et de donner aux opérateurs les outils pour se développer.

En centralisant l'offre, en fluidifiant les échanges et en valorisant le
patrimoine local, elle contribue à structurer et à dynamiser le tourisme
camerounais à l'ère du numérique. Les limites actuelles, propres à un prototype,
ouvrent la voie à de nombreuses perspectives d'évolution vers une solution
pleinement opérationnelle.
