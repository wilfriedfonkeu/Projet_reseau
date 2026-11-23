---
title: "Njangui & POI X"
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
    \definecolor{poiblue}{HTML}{1D4ED8}
    \titleformat{\section}{\color{njanguidark}\Large\bfseries}{\thesection}{0.8em}{}
    \titleformat{\subsection}{\color{njangui}\large\bfseries}{\thesubsection}{0.8em}{}
    \makeatletter
    \renewcommand{\maketitle}{%
      \begin{titlepage}
      \centering
      \includegraphics[width=0.34\textwidth]{/tmp/opencode/logo.png}\par
      \vspace{1.4cm}
      {\Huge\bfseries\color{njanguidark} Njangui \color{black}\&\color{poiblue} POI X\par}
      \vspace{0.5cm}
      {\Large\color{njangui} Liens et complémentarité de deux plateformes numériques camerounaises\par}
      \vspace{2.6cm}
      {\large\@author\par}
      \vspace{0.4cm}
      {\large\@date\par}
      \vfill
      {\small\color{gray} Document d'analyse --- Projet Réseau\par}
      \end{titlepage}
    }
    \makeatother
---

# Introduction

Ce document met en évidence les **liens** entre la plateforme **Njangui**
(plateforme camerounaise de tourisme) et **POI X --- Point Of Interest
Management** (`https://poi-presentation.vercel.app/`), une plateforme de gestion
des points d'intérêt.

L'objectif est de montrer que ces deux projets, bien que différents dans leur
finalité, appartiennent au **même écosystème numérique camerounais** et
partagent de nombreux **concepts, technologies et cas d'usage**. Ils sont en
réalité **complémentaires** et peuvent s'articuler au sein d'une même
architecture.

> **Note** : les liens présentés ici sont de nature **thématique, fonctionnelle
> et technologique**. Ils montrent une convergence et une possible
> complémentarité, et non une affiliation officielle nécessairement formalisée.

# 1. Rappel : les deux plateformes en bref

| | **Njangui** | **POI X (Point Of Interest Management)** |
|---|---|---|
| **Nature** | Place de marché touristique | Plateforme/API de gestion de points d'intérêt |
| **Public cible** | Touristes + agences, hôtels, guides, transporteurs | Organisations, entreprises, développeurs |
| **Finalité** | Découvrir, réserver et gérer des séjours | Créer, organiser et exposer des points d'intérêt |
| **Lien** | Projet local (dépôt `Projet_reseau`) | `https://poi-presentation.vercel.app/` |
| **Écosystème** | Cameroun | Cameroun (éditeur *Yowyob*) |

# 2. Ce qu'est POI X

**POI X** est une plateforme de **gestion des points d'intérêt** (en anglais
*Points of Interest*, POI). Elle permet de :

- **créer, modifier et supprimer** des points d'intérêt avec leurs informations
  essentielles ;
- gérer les **équipements / commodités** (*amenities*) associés ;
- suivre l'**historique** des modifications des points d'intérêt ;
- gérer les **adresses et la localisation** ;
- gérer les **informations visibles en ligne** ;
- collecter et afficher des **avis** (*user reviews*).

Elle est pensée pour des **attractions touristiques**, des **commerces** ou des
**sites communautaires**, avec une gestion fine des **rôles et permissions**, une
**internationalisation** et des **tableaux de bord analytiques**. Elle expose
une **API REST** documentée (avec SDK, dont Java) destinée aux développeurs.

# 3. Points communs

Les deux plateformes partagent de nombreux éléments :

- **Le concept central de « point d'intérêt »** : Njangui met en avant des sites
  touristiques (Kribi, Mont Cameroun, chutes de la Lobé, lacs Manengouba, parc de
  Waza, réserve du Dja, palais Bamoun\...) qui sont, par définition, des points
  d'intérêt.
- **La géolocalisation et les cartes** : Njangui affiche ses offres et hôtels sur
  une carte interactive ; POI X gère les adresses et la localisation des points
  d'intérêt.
- **Les avis et évaluations** : Njangui propose un système d'avis clients ; POI X
  intègre une gestion des avis (*User Reviews*).
- **La gestion des rôles et permissions** : Njangui distingue six profils
  (touriste, agence, hôtel, guide, agence de voyages, admin) ; POI X gère une
  hiérarchie de rôles (managers, staff\...).
- **Les équipements / services** : Njangui décrit les commodités des hôtels et
  des activités ; POI X gère les *amenities*.
- **L'internationalisation** : Njangui est bilingue français/anglais ; POI X met
  en avant sa portée internationale.
- **La présence en ligne** : les deux projets sont des applications web déployées
  (Njangui localement, POI X sur Vercel).
- **L'ancrage camerounais** : les deux projets émanent de l'écosystème numérique
  camerounais.

# 4. Correspondances fonctionnelles

| Fonction | Njangui | POI X |
|----------|---------|-------|
| Points d'intérêt (sites) | Packs, circuits, destinations | Cœur de la plateforme (CRUD POI) |
| Localisation / carte | Carte interactive OpenStreetMap | Gestion des adresses |
| Avis clients | Avis et notes par offre | *User Reviews* |
| Équipements / services | Commodités hôtels & activités | *Amenities* |
| Historique | Suivi des réservations | *POI History* |
| Rôles & permissions | 6 profils d'utilisateurs | Hiérarchie de rôles |
| Langues | FR / EN | Internationalisation |
| API | API internes (réservations, offres, avis) | API REST documentée + SDK |

# 5. Complémentarité : une possible architecture commune

Les deux plateformes n'entrent pas en concurrence : elles opèrent à des
**niveaux différents** et peuvent se combiner.

- **POI X = socle de données / couche service.** Il gère la donnée brute des
  points d'intérêt : identité, localisation, équipements, historique, avis,
  informations pratiques, permissions.
- **Njangui = couche application / métier.** Il transforme ces points d'intérêt
  en **offres touristiques réservables** : packs, circuits, hébergements,
  transports, paiements, commissions et tableaux de bord.

Autrement dit :

> POI X **stocke et organise** les lieux ; Njangui les **valorise, les vend et
> les fait vivre** auprès des touristes.

# 6. Scénario d'intégration concret

Voici comment Njangui pourrait s'appuyer sur POI X :

1. **Référencement** : les sites touristiques (chutes de la Lobé, Mont
   Cameroun, Waza\...) sont enregistrés comme **points d'intérêt** dans POI X,
   avec adresse, coordonnées GPS, commodités et informations pratiques.
2. **Consommation** : Njangui interroge l'**API de POI X** pour récupérer ces
   lieux et les afficher sur sa **carte interactive** et dans ses fiches d'offres.
3. **Enrichissement** : les **avis** et l'**historique** gérés par POI X
   alimentent la fiche du site dans Njangui.
4. **Commercialisation** : Njangui associe chaque point d'intérêt à un **pack ou
   un circuit** réservable (hôtel + transport + guide) et gère la réservation et
   la commission.
5. **Administration** : les rôles et permissions de POI X garantissent que seuls
   les acteurs autorisés modifient la donnée des lieux.

Ce scénario illustre une **chaîne de valeur complète** : de la donnée
géographique brute (POI X) jusqu'à l'expérience touristique réservée (Njangui).

# 7. Différences et positionnement

| Critère | Njangui | POI X |
|---------|---------|-------|
| Portée | **Verticale** (tourisme) | **Horizontale** (tout type de lieu) |
| Utilisateur final | Touriste / professionnel du tourisme | Organisation / développeur |
| Cœur métier | Réservation, paiement, commission | Gestion et exposition de données POI |
| Modèle | Abonnements + commission 10 % | Plateforme/API de gestion |
| Type de solution | Application métier complète | Infrastructure / service réutilisable |

Ces différences expliquent pourquoi les deux plateformes sont **davantage
complémentaires que concurrentes**.

# 8. Un écosystème commun

Au-delà des fonctionnalités, plusieurs indices montrent un **écosystème
commun** :

- les deux projets sont **camerounais** et orientés vers la **transformation
  numérique** ;
- POI X est édité sous la marque **Yowyob** et sa documentation fait référence au
  framework **« AboutRacine »** (`organisation-doc.vercel.app`) ;
- les deux s'appuient sur des **technologies web modernes** et un déploiement de
  type **Vercel** ;
- ils partagent la même philosophie : **centraliser, structurer et valoriser des
  lieux/services** au moyen du numérique.

Cette proximité suggère que **Njangui pourrait être un cas d'application métier
(vertical « tourisme ») bâti sur un socle générique de gestion de points
d'intérêt** tel que POI X.

# 9. Conclusion

Njangui et **POI X** présentent un **lien fort** à plusieurs niveaux :

- **lien conceptuel** : le « point d'intérêt » est au cœur des deux plateformes ;
- **lien fonctionnel** : cartes, avis, équipements, rôles, internationalisation ;
- **lien technique** : applications web, API, déploiement cloud, écosystème
  camerounais ;
- **lien de complémentarité** : POI X fournit la **donnée** des lieux, Njangui en
  fait une **expérience touristique réservable**.

En résumé, les deux projets ne s'opposent pas : ils se **rejoignent** et peuvent
former une **chaîne cohérente** allant de la gestion des points d'intérêt à la
commercialisation de séjours touristiques.

# Liens utiles

- **POI X --- Point Of Interest Management** : `https://poi-presentation.vercel.app/`
- **Documentation POI X (AboutRacine)** : `https://organisation-doc.vercel.app/AboutRacine/point_of_interest/configure`
- **Dépôt du projet Njangui** : `https://github.com/wilfriedfonkeu/Projet_reseau`
