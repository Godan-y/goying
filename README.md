<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4478b52d-b52c-4c6e-a8b5-0237c08eb152

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copiez [`.env.example`](.env.example) vers `.env`, puis renseignez les variables demandées. Ne mettez jamais de clés privées dans [`.env.example`](.env.example) ou dans le dépôt.
3. Pour les fonctions sécurisées de l'API locale (réservations immobilières, soumissions et vérification de prestataire), téléchargez un compte de service depuis Firebase Console > Paramètres du projet > Comptes de service, puis placez le JSON entier sur une seule ligne dans `FIREBASE_SERVICE_ACCOUNT_JSON` de `.env`. `FIREBASE_API_KEY` doit contenir uniquement la clé Web Firebase publique.
4. Run the app:

   ```powershell
   npm.cmd run dev
   ```

## Préparer un commit

Après avoir vérifié le build avec `npm.cmd run build`, inspectez d'abord les fichiers modifiés :

```powershell
git status --short
```

Ajoutez ensuite seulement les fichiers source concernés, plutôt que d'utiliser `git add .`, puis créez et poussez le commit :

```powershell
git addpublic\.htaccess README.md              
git commit -m "Description de mes modifications"
git push
```

## URL canonique et redirections

Le site public utilise l'URL canonique `https://www.goyingservices.com/`. Le fichier [`public/.htaccess`](./public/.htaccess) force une redirection permanente unique de HTTP et de `https://goyingservices.com` vers cette URL.

Lors du déploiement sur l'hébergement LiteSpeed, copiez aussi le fichier caché `.htaccess` à la racine web, au même niveau que `index.html`. Vérifiez ensuite les quatre URL (`http`/`https`, avec et sans `www`) : elles doivent toutes finir sur `https://www.goyingservices.com/`.

## Numéros WhatsApp

Tous les numéros saisis dans les formulaires doivent être au format international afin que WhatsApp puisse identifier le pays sans ambiguïté : par exemple `+243 857068014` ou `00243 857068014`. Les numéros locaux seuls, comme `0857068014`, sont refusés lors de l'envoi et les nouvelles réservations sont enregistrées au format `+243857068014`.

## Propositions de partenariat

Le formulaire **Devenir partenaire** enregistre les propositions validées dans la collection privée `partnershipRequests` via `POST /api/partnership-requests`. Chaque proposition contient le nom de l'organisation, son type, la personne de contact, l'email officiel, le téléphone international et le domaine de collaboration. Après l'enregistrement, l'organisation peut poursuivre l'échange via WhatsApp. La route limite les envois abusifs à cinq propositions par adresse IP et par heure.

## Soumissions de véhicules

Le bouton **Soumettre ma voiture** dans Automobile permet à un propriétaire connecté d'enregistrer une demande privée dans `vehicleSubmissions`. Le véhicule n'est jamais publié automatiquement dans `vehicles` : l'équipe Goying contacte le propriétaire, vérifie le véhicule et ses documents, puis prend les photos officielles avant toute publication. Jusqu'à six photos facultatives (JPEG, PNG ou WebP, 5 Mo maximum chacune) peuvent être jointes dans un espace S3 propre au propriétaire.

Les véhicules disponibles à l'achat sont lus directement depuis `vehicleSales`. Seuls les documents ayant `status: "Disponible"` sont visibles publiquement, du plus récent au plus ancien selon `createdAt`.


chauffeurs

gestionnaires

maisons

professionalApplications

providers

users

vehicles
chauffeurs

ch-1

ch-2

ch-3
ch-3
avatarUrl
"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200"
(string)


bio
"Chauffeur discret et chaleureux, conduite souple. Connaissances touristiques approfondies du Togo pour agrémenter vos déplacements professionnels ou de loisir."
(string)


currency
"€"
(string)


experienceYears
6
(int64)


id
"ch-3"
(string)


name
"Jean-Louis Mensah"
(string)


phone
"+228 90 99 88 77"
(string)


pricePerKm
1.1
(double)


rating
4.7
(double)


reviewsCount
54
(int64)


vehicleModel
"Toyota Corolla Moderne"
(string)


verified
true
(boolean)



zones
(array)


0
"Lomé"
(string)


1
"Aéroport LFW"
(string)


2
"Aneho"
(string)


3
"Kpalimé"
(string)


les chauffeurs sont recuper depuis la table chauffeur et le statut de la verification sera true seulement si les admin approuver depuis leur systeme c est quand le chauffeurs s affichera sinon il sera toujour en attente et tu pourra ajouter le champs email et le champs mot de passe dans chaque formulaire  de prestataires ces deux champs seront considerer comme leur champ de connexion et ils peuve se connecter comme telle prestataire et peut voir s ils sont approuver ou rejetter j. je ne sais pas comment tu pourra separer la connexion prestaire et client depuis la base de donnée je te considere comme etant senoir et trouve la solution et fais le 

## Images de portfolio AWS S3

Les portfolios des coiffeurs/coiffeuses et maquilleuses sont envoyés dans le bucket S3 configuré, sous le préfixe `goying/portfolios/<uid>/`.

Les prestataires validés peuvent aussi ajouter leur photo de profil et modifier leurs **compétences clés** depuis **Mon profil prestataire**. Saisissez les compétences en les séparant par des virgules ; elles deviennent les étiquettes affichées sur leur fiche publique. La photo est stockée séparément sous `goying/avatars/<uid>/` et devient la photo affichée sur leur fiche publique.

Copiez les variables de [`.env.example`](.env.example) vers `.env`, puis renseignez-les. Les clés AWS restent exclusivement côté serveur : ne les préfixez jamais par `VITE_`.

Ajoutez également `FIREBASE_API_KEY` dans `.env`. Il s'agit de l'API key déjà utilisée par la configuration Firebase du client. Le serveur s'en sert seulement pour vérifier le jeton Firebase du prestataire avant de créer une URL S3 temporaire.

Cette commande lance Vite et l'API locale d'upload :

```powershell
npm.cmd run dev
```

Configurez le CORS du bucket S3 pour autoriser le navigateur local :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["POST"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:8000",
      "http://192.168.1.88:3000",
      "https://goyingservices.com",
      "https://www.goyingservices.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Ajoutez l'URL de production à `AllowedOrigins` lors du déploiement. Les objets `goying/portfolios/*` doivent aussi être lisibles publiquement si vous utilisez les URL S3 publiques affichées par l'application.

## Déploiement de `goyingservices.com`

Le client React est servi sur `https://goyingservices.com` et le backend de production est l'API **FastAPI Python** déjà déployée sur Render, sous `https://backend-goying.onrender.com`.

1. Générez le client de production avec `VITE_API_BASE_URL=https://backend-goying.onrender.com npm.cmd run build`, puis publiez le contenu de `dist/` dans le répertoire web de `goyingservices.com` sur l'hébergement LiteSpeed.
2. Dans Firebase Console > Authentication > Settings > Authorized domains, ajoutez `goyingservices.com` et `www.goyingservices.com`.
3. Appliquez la configuration CORS S3 ci-dessus, avec les deux domaines HTTPS de production.

Le frontend utilise les routes publiques FastAPI `/api/maisons` et `/prestataires/api/public` lorsque les routes Node historiques ne sont pas disponibles. Vérifiez l'API Python dans Swagger : `https://backend-goying.onrender.com/docs`.

[`render.yaml`](./render.yaml) et [`server.ts`](./server.ts) décrivent une API Node optionnelle pour les opérations qui ne sont pas encore exposées par FastAPI. Ne déployez pas ce service à la place du backend Python existant sans migrer ses routes et ses authentifications.

## Avis clients

Un client peut évaluer un chauffeur ou un prestataire une seule fois, uniquement lorsque sa réservation a le statut `Terminé`. L'administrateur doit donc renseigner ce statut dans la collection `bookings` après l'exécution de la prestation.

Chaque avis est enregistré dans `reviews` avec l'identifiant de la réservation. La note moyenne (`rating`) et le nombre d'avis (`reviewsCount`) du prestataire sont mis à jour automatiquement.

## Gestion des prestataires et des missions

Les chauffeurs et ménagers sont gérés par l'administration (`managementMode: "admin"`). Après une réservation, l'administrateur les contacte directement et met à jour la réservation jusqu'au statut `Terminé`.

Les coiffeurs/coiffeuses, maquilleuses et professeurs sont autonomes (`managementMode: "provider"`) après validation de leur dossier. Ils voient leurs missions dans leur profil et peuvent cliquer sur **Prestation terminée**. Cette action met la réservation au statut `À valider` et renseigne `providerCompletionRequested` et `providerCompletedAt`.

L'administration doit ensuite contrôler la prestation et mettre à jour la réservation :

```text
status: "Terminé"
adminCompletedAt: date de validation
```

Le client peut alors laisser une note et un avis.

### Disponibilité des prestataires autonomes

Les coiffeurs/coiffeuses, professeurs et maquilleuses utilisent deux états distincts :

- `status: "indisponible"` est le contrôle administrateur. Le profil est retiré de la liste publique, mais le prestataire conserve l’accès complet à son profil et à ses informations.
- `providerAvailability: "indisponible"` est le contrôle personnel du prestataire. Son profil reste visible dans la liste publique, mais la réservation est bloquée avec un message d’indisponibilité.

L’administration remet `status` à `disponible` lorsqu’elle souhaite republier le profil. Le prestataire peut à tout moment modifier uniquement `providerAvailability` depuis **Mon profil prestataire**. Cette modification est validée par l’API authentifiée et ne requiert pas d’ouverture publique des écritures Firestore.

Le catalogue public utilise `GET /api/providers`. Il conserve la compatibilité avec les anciens profils dont `verified` a été enregistré sous forme de texte (`"true"`) ou dont la spécialité est encore présente uniquement dans le dossier professionnel approuvé.

Lorsqu’un prestataire de service approuvé se reconnecte, l’API synchronise son dossier approuvé avec `providers` si le document public n’a pas été créé lors de la validation. Cette synchronisation marque le profil comme vérifié et aligne le statut du compte professionnel sur `Confirmé`.

## Réservations automobiles

Les réservations de voitures sont enregistrées dans la collection Firestore `carBookings`. Les réservations de chauffeurs et des services à la personne restent dans `bookings`, tandis que les réservations immobilières restent dans `propertyBookings`.

Les catalogues automobiles publics n'affichent que les véhicules disponibles. Les locations dont `isAvailable` vaut `false` ou dont le statut vaut `Réservé`, `Réserve`, `Indisponible`, `Reserved` ou `Booked` sont masquées. Les ventes restent limitées aux documents `vehicleSales` dont `status` vaut exactement `Disponible`.

Pour les voitures à louer, les champs Firestore `city` et `commune` sont lus et affichés sous la forme `Ville, Commune`. Les champs historiques `location`, `localisation` ou `adresse` restent compatibles lorsqu'aucune ville ou commune n'est renseignée.

## Demandes d'achat de véhicules

Les véhicules à vendre sont lus depuis `vehicleSales`, mais les coordonnées du vendeur ne sont jamais retournées au navigateur. L'acheteur clique sur **Confirmer l'achat**, renseigne son nom et son WhatsApp, puis confirme que Goying peut le contacter.

La demande est créée par l'API Firebase Admin dans `vehiclePurchaseRequests`, avec le statut initial `Nouvelle`, la photo principale et un instantané serveur du véhicule disponible. Aucun paiement ni renseignement bancaire n'est demandé : le paiement s'effectue uniquement sur place, après vérification du véhicule et confirmation de la transaction par l'équipe Goying.

## Réservations immobilières et administration

Les maisons publiques proviennent exclusivement de `maisons`. Une maison doit être approuvée (`approuvee: true` ou `statut: "approuvee"`) et disponible (sans `disponibilite: "indisponible"`) pour être affichée. Les anciennes maisons sans ces champs doivent être migrées avant le déploiement des règles.

Les réservations immobilières et les soumissions de maison passent par l'API Node (`/api/property-bookings` et `/api/property-submissions`). Cette API utilise **Firebase Admin SDK** avec Application Default Credentials; elle ne lit aucune clé privée depuis le navigateur. En production, configurez l'identité de service de l'environnement d'exécution avec les rôles Firestore appropriés. En développement, utilisez `GOOGLE_APPLICATION_CREDENTIALS` vers un fichier de compte de service local non versionné.

Pour attribuer le rôle administrateur à un UID Firebase, exécutez depuis un environnement possédant ces mêmes credentials :

```powershell
npm.cmd run set-admin -- <firebase-uid>
```

Le client concerné doit se reconnecter pour recevoir le nouveau custom claim `admin: true`. Ne placez jamais de clé privée ou de JSON de compte de service dans `.env` ou dans le dépôt.

Les règles `firestore.rules` ont été durcies mais ne sont pas déployées par cette modification. Déployez-les séparément après avoir vérifié les données existantes : les écritures de maisons, prestataires, comptes prestataires et publications sont désormais réservées aux administrateurs; les soumissions sont créées par l'API; et les réservations immobilières sont créées atomiquement par l'API. Les données de réservation immobilière doivent contenir `clientUid` pour être visibles par leur client; les documents `users/<email-en-minuscules>` existants doivent contenir leur UID Firebase avant que leur propriétaire puisse les relire.