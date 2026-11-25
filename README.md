# Njangui — Cahier de charges du projet Next.js actuel

> **Objet du document.** Ce README décrit **l'état réellement implémenté** du projet Next.js « Njangui » : son contexte, ses acteurs, ses fonctionnalités disponibles, son architecture, ses données, ses limites et les travaux restants. Il complète le cahier de charges académique général (`cahier_charge.pdf`).

---

## 1. Contexte

**Njangui** est une plateforme web de tourisme camerounaise développée dans le cadre d'un projet de conception et d'architecture logicielle (ENSP Yaoundé, 2026).

Le besoin de départ est de centraliser sur une seule plateforme :

- les offres des **agences touristiques** ;
- les **hébergements** des hôteliers ;
- les services des **guides touristiques** ;
- les trajets des **agences de voyages / transporteurs** ;
- les **réservations** des touristes ;
- la **géolocalisation** des services ;
- une interface **française et anglaise**.

**État actuel :** le projet est un **prototype fonctionnel côté interface**. L'authentification, les données et la persistance sont simulées côté navigateur et dans des fichiers JSON. Le backend définitif (base de données, sécurité serveur, paiements, emails) reste à construire.

---

## 2. Périmètre actuel

### 2.1 Implémenté

- Interface publique : accueil, recherche, fiches offres, fiches hôtels, tarifs.
- Authentification simulée avec six rôles.
- Six tableaux de bord, un par acteur métier.
- Catalogue d'offres, de circuits, de destinations, de guides et d'hôtels.
- Moteur de recherche avec filtres (destination, budget, type, catégorie).
- Tunnel de réservation en 5 étapes avec calcul de prix en temps réel.
- Carte interactive avec Leaflet (`DtMap`), géolocalisation à prévoir avec Navigoo.
- Messagerie, avis, factures simulées, portefeuille simulé.
- CRUD d'offres et de guides pour les agences.
- CRUD de trajets pour les transporteurs.
- Administration : modération des offres, partenaires, finances, notifications.
- Bilinguisme **Français / Anglais**.
- Mode clair / sombre.

### 2.2 Prévu mais non implémenté

- Base de données PostgreSQL et ORM.
- Vraie authentification serveur avec mots de passe hachés.
- Contrôle des accès côté serveur.
- Paiement Mobile Money (Orange Money, MTN MoMo).
- Envoi d'emails de confirmation et de réinitialisation.
- Stockage de fichiers en ligne (objets / CDN).
- Intégration de Navigoo pour la découverte cartographique.
- Tests automatisés, CI/CD, monitoring.

---

## 3. Acteurs et rôles

Les rôles sont définis dans `src/lib/auth-store.ts` :

```ts
type UserRole =
  | "tourist"
  | "agency"
  | "hotel"
  | "agence-voyages"
  | "guide"
  | "admin";
```

| Acteur | Rôle métier | Dashboard | Responsabilités actuelles |
|---|---|---|---|
| **Touriste** | Consommateur | `/dashboard/tourist` | Rechercher, réserver, consulter ses réservations, factures, portefeuille, points, avis, messages. |
| **Agence touristique** | Prestataire d'offres | `/dashboard/agency` | Publier/modifier des offres, gérer ses guides, suivre revenus et clients, gérer son abonnement. |
| **Hôtelier** | Prestataire d'hébergement | `/dashboard/hotel` | Gérer ses chambres, tarifs, réservations, messages et profil. |
| **Agence de voyages** | Prestataire de transport | `/dashboard/agence-voyages` | Gérer sa flotte, planifier les trajets, suivre les réservations passagers. |
| **Guide touristique** | Prestataire de guidage | `/dashboard/guide` | Suivre ses visites, ses évaluations, sa messagerie et son profil. |
| **Administrateur** | Superviseur | `/dashboard/admin` | Superviser la plateforme, modérer les offres, gérer partenaires et finances, créer des comptes. |
| **Visiteur** | Non connecté | Pages publiques | Consulter le catalogue, les offres, les hôtels et les tarifs. |

### Comptes de démonstration

| Email | Mot de passe | Rôle |
|---|---|---|
| `aicha@njangui.cm` | `password123` | Touriste |
| `guide.mboma@njangui.cm` | `password123` | Guide |
| `evasion@njangui.cm` | `password123` | Agence touristique |
| `lafalaise@njangui.cm` | `password123` | Hôtelier |
| `transcam@njangui.cm` | `password123` | Agence de voyages |
| `admin@njangui.cm` | `admin123` | Administrateur |

---

## 4. Fonctionnalités actuellement disponibles

### 4.1 Espace public

- Page d'accueil avec présentation de la plateforme, chiffres clés, agences partenaires, packs, circuits, destinations et avis.
- Formulaire de recherche rapide : destination, budget maximum, type d'offre.
- Page `/search` avec filtres et résultats.
- Fiche détaillée d'une offre : images, description, guides, hôtel, transport, avis.
- Fiche détaillée d'un hôtel.
- Page `/pricing` présentant les abonnements.
- Page `/auth` : connexion et inscription avec choix du rôle.

### 4.2 Espace touriste

Sections du dashboard :

- **Accueil** : résumé des réservations actives, voyages terminés, avis, incitation à devenir agence.
- **Carte** : carte Leaflet des hôtels (`DtMap`).
- **Réservations** : liste des réservations avec référence, montant, statut, téléchargement de billet.
- **Factures** : liste des factures simulées avec bouton PDF.
- **Portefeuille** : solde simulé, historique des dépôts, dépôt par carte, Orange Money ou Mobile Money.
- **Points** : points de fidélité par agence.
- **Avis** : avis publiés et voyages à noter.
- **Messages** : messagerie.
- **Profil** : modification des informations personnelles.

### 4.3 Espace agence touristique

- Vue d'ensemble avec indicateurs.
- **Publications** : création, modification, suppression et masquage d'offres.
- **Guides** : ajout, modification et suppression de guides, pièces d'identité, coordonnées bancaires.
- **Revenus** et **clients**.
- **Abonnement** : choix du plan (mensuel, semestriel, annuel).
- **Messages** et **profil**.

### 4.4 Espace hôtelier

- Vue d'ensemble.
- Gestion des chambres.
- Suivi des réservations reçues.
- Gestion des tarifs.
- Messages et profil.

### 4.5 Espace agence de voyages / transport

- Vue d'ensemble avec véhicules, trajets actifs, réservations et revenus.
- **Flotte** : véhicules et capacité.
- **Planificateur** : création de trajets (départ, arrivée, heure, véhicule, prix par place).
- **Réservations passagers**.
- Messages et profil.

### 4.6 Espace guide

- Vue d'ensemble.
- Visites planifiées.
- Évaluations reçues.
- Messages et profil.

### 4.7 Espace administrateur

- Vue d'ensemble avec statistiques et graphiques.
- **Offres** : masquage, restauration, suppression simulée.
- **Partenaires** : activation / désactivation.
- **Finances** : revenus, commissions, montants à verser.
- **Création manuelle de compte**.
- **Notifications**, **messages** et **paramètres** (thème, langue).

### 4.8 Fonctionnalités transverses

- Bilinguisme Français / Anglais via `src/lib/lang.tsx`.
- Thème clair / sombre.
- Notifications « toast » avec Sonner.
- Composants UI réutilisables (Radix UI + Tailwind CSS).
- Formulaires avec React Hook Form et validation Zod côté client.
- Graphiques avec Recharts.

---

## 5. Architecture technique actuelle

### 5.1 Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Langage | TypeScript strict |
| UI | React 19.2.4, Tailwind CSS 4, Radix UI |
| Cartographie | Leaflet 1.9.4, react-leaflet 5 |
| Formulaires | React Hook Form, Zod |
| Graphiques | Recharts |
| Notifications | Sonner |
| Icônes | Lucide React |
|Dates | date-fns |
| Lint | ESLint 9 |

### 5.2 Structure des dossiers

```text
app/
  api/                     # Routes de démonstration (fichiers JSON)
    custom-offers/
    guides/
    messages/
    reservations/
    reviews/
    trips/
    upload/
  auth/
  dashboard/
    admin/
    agence-voyages/
    agency/
    guide/
    hotel/
    tourist/
  hotel/[id]/
  offers/[id]/
  reservation/[offerId]/
  search/
  page.tsx
  layout.tsx

data/                      # Fichiers JSON de persistance simulée
  custom-offers.json
  guides.json
  messages.json
  reservations.json
  reviews.json
  trips.json

src/
  components/              # Composants métier et UI
    dt-map.tsx
    dt-messenger.tsx
    dt-navbar.tsx
    dt-sidebar.tsx
  hooks/
    use-auth.ts
    use-offers-loader.ts
  lib/
    auth-context.tsx
    auth-store.ts
    lang.tsx
    njangui-data.ts
    utils.ts

public/images/             # Images des sites, hôtels, guides, agences
```

### 5.3 Couches actuelles

```text
Interface (app/ + src/components)
        │
        ├── Données statiques : src/lib/njangui-data.ts
        ├── Session : localStorage (dt_current_user, dt_users_db)
        └── API de démonstration : app/api/**/route.ts → data/*.json
```

**Il n'existe pas encore de couche service ni de base de données.**

---

## 6. Données actuelles

### 6.1 Fichiers JSON persistés

| Fichier | Contenu | Route associée |
|---|---|---|
| `data/custom-offers.json` | Offres créées par les agences + offres masquées | `/api/custom-offers` |
| `data/guides.json` | Guides touristiques | `/api/guides` |
| `data/messages.json` | Messages entre acteurs | `/api/messages` |
| `data/reservations.json` | Réservations | `/api/reservations` |
| `data/reviews.json` | Avis | `/api/reviews` |
| `data/trips.json` | Trajets de transport | `/api/trips` |

### 6.2 Données statiques TypeScript

`src/lib/njangui-data.ts` contient les données de démonstration :

- agences partenaires (`AGENCIES`) ;
- packs touristiques (`PACKS`) avec coordonnées `lat` / `lng` ;
- circuits (`CIRCUITS`) ;
- destinations (`DESTINATIONS`) ;
- hôtels à proximité (`HOTELS_NEARBY`) ;
- guides (`GUIDES_FALLBACK`) ;
- avis, témoignages et plans d'abonnement.

Les fonctions `loadCustomOffers()`, `loadGuides()`, `loadSavedReservations()`, `loadReviews()` et `loadTrips()` combinent ces constantes avec le contenu des fichiers JSON via les routes API.

### 6.3 Session et préférences

| Clé localStorage | Usage |
|---|---|
| `dt_users_db` | Liste des utilisateurs, mots de passe en clair |
| `dt_current_user` | Utilisateur connecté |
| `njangui_lang` | Langue choisie (`fr` ou `en`) |

---

## 7. Routes de l'application

| Route | Description |
|---|---|
| `/` | Page d'accueil |
| `/auth` | Connexion / inscription |
| `/search` | Recherche et filtrage des offres |
| `/offers/[id]` | Détail d'une offre |
| `/hotel/[id]` | Détail d'un hôtel |
| `/reservation/[offerId]` | Tunnel de réservation en 5 étapes |
| `/pricing` | Abonnements |
| `/messages` | Messagerie |
| `/dashboard/tourist` | Espace touriste |
| `/dashboard/agency` | Espace agence touristique |
| `/dashboard/hotel` | Espace hôtelier |
| `/dashboard/agence-voyages` | Espace transporteur |
| `/dashboard/guide` | Espace guide |
| `/dashboard/admin` | Espace administrateur |

---

## 8. API actuelle (démonstration)

| Méthode | Route | Rôle |
|---|---|---|
| `GET` / `POST` / `PUT` / `DELETE` | `/api/custom-offers` | Offres personnalisées et masquage |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/guides` | Guides touristiques |
| `GET` / `POST` / `PUT` | `/api/messages` | Messagerie et marquage « lu » |
| `GET` / `POST` | `/api/reservations` | Réservations |
| `GET` / `POST` | `/api/reviews` | Avis |
| `GET` / `POST` / `DELETE` | `/api/trips` | Trajets de transport |
| `POST` | `/api/upload` | Upload local dans `public/images/agency-uploads` |

Ces routes lisent et écrivent directement des fichiers JSON. Elles ne comportent **ni authentification, ni validation serveur, ni contrôle de propriété**.

---

## 9. Règles métier actuellement codées

- **Commission plateforme :** 10 % (`COMMISSION_RATE = 0.1`).
- **Prix d'une réservation :**

  ```ts
  total =
    pack.price * participants * days +
    hotel.pricePerNight * days * participants +
    trip.price * participants * 2;
  ```

- **Statuts de réservation :** chaînes en français (`Confirmée`, `En attente`, `Annulée`, etc.).
- **Statut d'une offre :** champ `hidden[]` dans `custom-offers.json` pour masquer une offre.
- **Avis :** un utilisateur peut publier un avis avec une note de 1 à 5.
- **Messages :** champ `read` pour le marquage comme lu.
- **Guides :** champs optionnels `idDocument`, `paymentMethod`, `commission`.
- **Abonnements agence :** `monthly`, `semester`, `yearly`.

Ces règles sont principalement exécutées **côté client**. Elles devront être déplacées dans une couche service côté serveur.

---

## 10. Limites de l'existant

| Limite | Impact |
|---|---|
| Mots de passe en clair dans `localStorage` | Aucune sécurité réelle |
| Rôles vérifiés seulement dans les composants | Contournable facilement |
| Fichiers JSON en écriture | Incompatible avec un hébergement serverless et les accès concurrents |
| Upload dans `public/` | Ne fonctionne pas en production sur Vercel |
| Aucune validation serveur | Données incohérentes possibles |
| Aucun paiement réel | Les montants sont simulés |
| Aucun email envoyé | Pas de confirmation de réservation |
| Pas de tests automatisés | Risque de régression élevé |
| Cartographie basique | Pas encore de POI unifiés, de sidebar riche ni d'itinéraires |

---

## 11. Intégration Navigoo prévue

Navigoo est une bibliothèque **frontend** basée sur Leaflet qui apporte :

- marqueurs de points d'intérêt (plages, parcs, hôtels, guides…) ;
- sidebar interactive avec image, description et bouton « Itinéraire » ;
- géolocalisation et recherche du POI le plus proche ;
- tracé d'itinéraires POI → POI et utilisateur → POI.

### Principe d'intégration

1. Créer un composant client chargé avec `dynamic(..., { ssr: false })`.
2. Fournir les POI depuis le backend via `GET /api/pois`.
3. Convertir les offres au format `PointOfInterestData`.
4. Garder deux modes :

   | Mode | Usage | Comportement |
   |---|---|---|
   | `explore` | Accueil, recherche, dashboard | Sidebar, géolocalisation, itinéraires |
   | `select` | Étape 2 de la réservation | Clic sur marqueur → mise à jour de `selectedHotel` et du prix |

5. Conserver `DtMap` pour la sélection d'hôtel si le listener Navigoo n'est pas fiable, car la documentation de Navigoo ne prévoit pas de callback officiel de sélection.

---

## 12. Backend cible — travaux restants

1. Choisir l'infrastructure : PostgreSQL, Prisma, Auth.js, stockage objet, fournisseur Mobile Money.
2. Créer le schéma de données : `User`, `ProviderProfile`, `Offer`, `Booking`, `Payment`, `Review`, `Message`, `Invoice`, `AuditLog`.
3. Migrer les comptes de démonstration et les fichiers JSON vers PostgreSQL.
4. Remplacer l'authentification `localStorage` par une session serveur sécurisée.
5. Déplacer les règles métier dans une couche service.
6. Recréer les routes API avec validation Zod, pagination et contrôle des accès.
7. Sécuriser les réservations avec transactions et calcul du prix côté serveur.
8. Intégrer le paiement Mobile Money et la génération de factures.
9. Remplacer l'upload local par un stockage objet.
10. Ajouter emails, notifications, modération et statistiques admin.
11. Intégrer Navigoo et l'endpoint `/api/pois`.
12. Ajouter tests, CI/CD, sauvegardes et monitoring.

**Objectif de qualité :** plus de 70 % de couverture de tests, temps de réponse < 3 s pour 95 % des requêtes, recherche < 2 s, confirmation de réservation < 5 s.

---

## 13. Installation et scripts

### Prérequis

- Node.js 20 ou supérieur
- npm

### Commandes

```bash
npm install
npm run dev      # serveur de développement http://localhost:3000
npm run build    # build de production
npm run start    # démarrage du build de production
npm run lint     # analyse ESLint
```

Aucune variable d'environnement n'est nécessaire pour l'instant. Un fichier `.env.example` sera ajouté lors de la construction du backend définitif.

---

## 14. Critères d'acceptation du prototype actuel

- [ ] Un visiteur peut parcourir le catalogue sans se connecter.
- [ ] Un utilisateur peut s'inscrire et se connecter avec l'un des six rôles.
- [ ] Chaque rôle est redirigé vers son dashboard.
- [ ] Une agence peut créer, modifier, supprimer et masquer une offre.
- [ ] Une agence peut gérer ses guides.
- [ ] Un transporteur peut ajouter et supprimer un trajet.
- [ ] Un touriste peut compléter le tunnel de réservation et voir le prix évoluer selon l'hôtel et le transport choisis.
- [ ] Un touriste peut publier un avis.
- [ ] La langue et le thème peuvent être changés.
- [ ] Les données créées persistent après rechargement via les fichiers JSON ou `localStorage`.

---

## 15. Glossaire

| Terme | Définition |
|---|---|
| **Offre / Pack** | Séjour touristique proposé par une agence. |
| **Circuit** | Itinéraire touristique plus long. |
| **Prestataire** | Agence, hôtel, guide ou transporteur. |
| **POI** | Point Of Interest : lieu affichable sur la carte. |
| **Multi-tenant** | Plusieurs prestataires distincts hébergés sur la même plateforme. |
| **Route Handler** | Fichier `route.ts` Next.js exposant un endpoint HTTP. |
| **localStorage** | Stockage temporaire du navigateur utilisé ici pour simuler la session. |

---

*Document maintenu dans le dépôt du projet. Il décrit l'existant et sert de base à la construction du backend définitif.*
