import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  initialChauffeurs,
  initialSecondaryProviders,
  initialVehicles,
} from "../data";
import {
  Booking,
  Chauffeur,
  Property,
  SecondaryProvider,
  UserSession,
  Vehicle,
  VehicleSale,
} from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCLl6HXZvlgvLHZhph7twGwIonItyRtn1U",
  authDomain: "goying-5a854.firebaseapp.com",
  projectId: "goying-5a854",
  storageBucket: "goying-5a854.firebasestorage.app",
  messagingSenderId: "1280338277",
  appId: "1:1280338277:web:004604266441d0c32b598c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersCollection = "users";
const bookingsCollection = "bookings";
const carBookingsCollection = "carBookings";
const propertyBookingsCollection = "propertyBookings";
const vehiclesCollection = "vehicles";
const chauffeursCollection = "chauffeurs";
const providersCollection = "providers";
const professionalApplicationsCollection = "professionalApplications";
const professionalAccountsCollection = "professionalAccounts";

type FirestoreRecord = Record<string, unknown>;
type ProviderListing = Chauffeur | SecondaryProvider;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : "https://backend-goying.onrender.com")).replace(/\/+$/, "");

function apiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

function record(value: unknown): FirestoreRecord {
  return value as FirestoreRecord;
}

function s3ProfilePhotoUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    const isS3Host = url.hostname.endsWith(".amazonaws.com") &&
      (url.hostname.includes(".s3.") || url.hostname.startsWith("s3."));
    return url.protocol === "https:" && isS3Host ? url.href : "";
  } catch {
    return "";
  }
}

function publicationDate(value: unknown): string | undefined {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000).toISOString();
  }
  return undefined;
}

export async function logoutCurrentUser() {
  await signOut(auth);
}

export async function getProperties(): Promise<Property[]> {
  try {
    const response = await fetch(apiUrl("/api/properties"));
    let propertyEntries: Array<{ id: string; data: FirestoreRecord }>;
    if (response.status === 404) {
      const pythonResponse = await fetch(apiUrl("/api/maisons"));
      const pythonPayload = await pythonResponse.json() as FirestoreRecord[];
      if (!pythonResponse.ok || !Array.isArray(pythonPayload)) throw new Error("Catalogue indisponible");
      propertyEntries = pythonPayload.map((data) => ({ id: String(data.id), data }));
    } else {
      const payload = await response.json() as { properties?: Array<{ id: string; data: FirestoreRecord }> };
      if (!response.ok || !payload.properties) throw new Error("Catalogue indisponible");
      propertyEntries = payload.properties;
    }

    const properties: Property[] = [];
    propertyEntries.forEach(({ id, data }) => {
      const approved = data.approuvee === true || data.approuvee === "true" || data.approuvee === 1 ||
        data.statut === "approuvee" || data.statut === "approuve";
      if (!approved) return;

      const availability = String(data.disponibilite ?? data.availability ?? "").toLowerCase();
      const isAvailable = data.disponibilite !== false &&
        !["indisponible", "reservee", "réservée", "booked", "unavailable"].includes(availability) &&
        !["indisponible", "reservee", "réservée"].includes(String(data.statut ?? "").toLowerCase());
      if (!isAvailable) return;

      const photoUrls = Array.isArray(data.photo_urls)
        ? data.photo_urls.map(String).filter(Boolean)
        : Array.isArray(data.imageUrls) ? data.imageUrls.map(String).filter(Boolean) : undefined;
      properties.push({
        id,
        title: String(data.titre || "Maison à louer"),
        type: data.type === "a_vendre" || data.statut === "a_vendre" ? "Achat" : "Location",
        category: "Maison",
        type_maison: typeof data.type_maison === "string" ? data.type_maison : "",
        price: Number(data.prix) || 0,
        currency: String(data.devise || "$"),
        address: String(data.commune || ""),
        bedrooms: Number(data.chambres) || undefined,
        bathrooms: Number(data.salles_bains) || undefined,
        surface: Number(data.superficie) || 0,
        imageUrl: String(data.photo_url || photoUrls?.[0] || ""),
        imageUrls: photoUrls,
        description: String(data.description || ""),
        informationsComplementaires: typeof data.informations_complementaires === "string"
          ? data.informations_complementaires : undefined,
        features: [],
        rating: Number(data.note) || 0,
        reviewsCount: Number(data.avis) || 0,
        contactName: String(data.contactName || "Propriétaire"),
        phone: String(data.telephone || ""),
        isAvailable,
        createdAt: publicationDate(data.createdAt ?? data.created_at),
      });
    });
    return properties;
  } catch (error) {
    console.error("Error fetching properties from Firestore:", error);
    throw new Error("Le catalogue immobilier est momentanément indisponible.");
  }
}

function toVehicle(data: FirestoreRecord, id: string): Vehicle {
  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls.map(String).filter(Boolean) : undefined;
  const city = typeof data.city === "string" ? data.city : typeof data.ville === "string" ? data.ville : "";
  const commune = typeof data.commune === "string" ? data.commune : "";
  const cityAndCommune = [city, commune].filter(Boolean).join(", ");
  const availabilityStatus = String(data.status ?? data.statut ?? data.disponibilite ?? "").trim()
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return {
    ...data,
    id,
    pricePerDay: Number(data.pricePerDay ?? data.prixParJour ?? 0),
    rating: Number(data.rating ?? data.note ?? 0),
    reviewsCount: Number(data.reviewsCount ?? data.avis ?? 0),
    seats: Number(data.seats ?? data.places ?? 0),
    isAvailable: data.isAvailable !== false && data.isAvailable !== "false" &&
      !["indisponible", "reserve", "reserved", "booked"].includes(availabilityStatus),
    features: Array.isArray(data.features) ? data.features.map(String) : [],
    imageUrl: String(data.imageUrl || data.photo_url || imageUrls?.[0] || ""),
    imageUrls,
    description: typeof data.description === "string" ? data.description
      : typeof data.description_vehicule === "string" ? data.description_vehicule : undefined,
    location: cityAndCommune || (typeof data.location === "string" ? data.location
      : typeof data.localisation === "string" ? data.localisation
        : typeof data.adresse === "string" ? data.adresse : undefined),
    city: city || undefined,
    commune: commune || undefined,
    createdAt: publicationDate(data.createdAt ?? data.created_at),
  } as Vehicle;
}

async function getPublicVehiclesFromApi(): Promise<Vehicle[]> {
  const response = await fetch(apiUrl("/api/public/voitures"));
  const payload = await response.json() as { vehicles?: FirestoreRecord[]; detail?: string };
  if (!response.ok || !payload.vehicles) {
    throw new Error(payload.detail || "Le catalogue automobile est momentanément indisponible.");
  }
  return payload.vehicles.map((vehicle) => toVehicle(vehicle, String(vehicle.id)));
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const vehicleRef = collection(db, vehiclesCollection);
    const snapshot = await getDocs(vehicleRef);
    if (snapshot.empty) {
      const batch = writeBatch(db);
      initialVehicles.forEach((vehicle) => batch.set(doc(vehicleRef, vehicle.id), vehicle));
      await batch.commit();
      return initialVehicles;
    }
    return snapshot.docs.map((snapshotDocument) => toVehicle(record(snapshotDocument.data()), snapshotDocument.id));
  } catch (error) {
    console.error("Error fetching vehicles from Firestore:", error);
    return getPublicVehiclesFromApi();
  }
}

export async function getVehicleSales(): Promise<VehicleSale[]> {
  try {
    const response = await fetch(apiUrl("/api/vehicle-sales"));
    let saleEntries: Array<{ id: string; data: FirestoreRecord }>;
    if (response.status === 404) {
      const pythonResponse = await fetch(apiUrl("/api/public/voitures/ventes"));
      const pythonPayload = await pythonResponse.json() as { sales?: FirestoreRecord[]; detail?: string };
      if (!pythonResponse.ok || !pythonPayload.sales) throw new Error(pythonPayload.detail || "Catalogue indisponible");
      saleEntries = pythonPayload.sales.map((data) => ({ id: String(data.id), data }));
    } else {
      const payload = await response.json() as { vehicleSales?: Array<{ id: string; data: FirestoreRecord }> };
      if (!response.ok || !payload.vehicleSales) throw new Error("Catalogue indisponible");
      saleEntries = payload.vehicleSales;
    }
    const sales = saleEntries.map(({ id, data }) => {
      const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls.map(String).filter(Boolean) : [];
      const sale: VehicleSale = {
        id,
        brand: String(data.brand || ""),
        model: String(data.model || ""),
        year: Number(data.year) || 0,
        vehicleType: String(data.vehicleType || "Véhicule"),
        condition: String(data.condition || "Non renseigné"),
        fuel: String(data.fuel || "Non renseigné"),
        transmission: String(data.transmission || "Non renseignée"),
        mileage: Number(data.mileage) || 0,
        priceUsd: Number(data.priceUsd) || 0,
        priceNegotiable: data.priceNegotiable === true,
        city: String(data.city || ""),
        commune: String(data.commune || ""),
        description: String(data.description || ""),
        imageUrl: String(data.imageUrl || imageUrls[0] || ""),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        status: "Disponible",
        createdAt: publicationDate(data.createdAt ?? data.created_at),
      };
      return sale;
    });
    return sales;
  } catch (error) {
    console.error("Error fetching vehicle sales from Firestore:", error);
    throw new Error("Les véhicules à vendre sont momentanément indisponibles.");
  }
}

export async function getChauffeurs(): Promise<Chauffeur[]> {
  try {
    const [chauffeurs, providers] = await Promise.all([
      getDocs(query(collection(db, chauffeursCollection), where("verified", "==", true))),
      getDocs(query(collection(db, providersCollection), where("verified", "==", true))),
    ]);
    const documents = [
      ...chauffeurs.docs,
      ...providers.docs.filter((snapshotDocument) =>
        String(record(snapshotDocument.data()).categorie ?? record(snapshotDocument.data()).category ??
          record(snapshotDocument.data()).specialty ?? "").toLowerCase() === "chauffeur"),
    ];
    if (documents.length === 0) {
      const batch = writeBatch(db);
      initialChauffeurs.forEach((chauffeur) => batch.set(doc(db, chauffeursCollection, chauffeur.id), chauffeur));
      await batch.commit();
      return initialChauffeurs;
    }

    const results = new Map<string, Chauffeur>();
    documents.forEach((snapshotDocument) => {
      const data = record(snapshotDocument.data());
      const transmission = String(data.transmission || "Les deux");
      const chauffeur = {
        ...data,
        id: snapshotDocument.id,
        name: String(data.name || [data.prenom, data.nom, data.postNom].filter(Boolean).join(" ") || "Chauffeur"),
        avatarUrl: s3ProfilePhotoUrl(data.photo_profil),
        bio: String(data.bio || data.description || ""),
        pricePerMonth: Number(data.pricePerMonth ?? data.tarifMensuel ?? data.priceRate ?? data.pricePerKm ?? 0),
        currency: String(data.currency || data.devise || "$"),
        priceNegotiable: data.priceNegotiable === true || data.prixNegociable === true,
        serviceType: String(data.serviceType || data.typeService || "Chauffeur privé"),
        transmission: transmission === "Automatique et manuelle" ? "Les deux" : transmission,
        vehicleModel: String(data.vehicleModel || data.modeleVehicule || ""),
        experienceYears: Number(data.anneesExperience ?? 0),
        skills: Array.isArray(data.skills)
          ? data.skills.filter((skill): skill is string => typeof skill === "string")
            .map((skill) => skill.trim())
            .filter(Boolean)
          : [],
        country: String(data.country || data.pays || "Non renseigné"),
        city: String(data.city || data.ville || (Array.isArray(data.zones) ? data.zones[0] : "") || "Non renseignée"),
        commune: String(data.commune || "Non renseignée"),
        zones: Array.isArray(data.zones) ? data.zones.map(String) : [data.ville].filter(Boolean).map(String),
        rating: Number(data.rating ?? data.note ?? 0),
        reviewsCount: Number(data.reviewsCount ?? data.avis ?? 0),
        phone: String(data.phone || data.telephone || ""),
        status: data.status === "indisponible" ? "indisponible" : "disponible",
      } as Chauffeur;
      if (data.verified === true || data.verified === "true") results.set(chauffeur.id, chauffeur);
    });
    return [...results.values()];
  } catch (error) {
    console.error("Error fetching chauffeurs from Firestore:", error);
    throw new Error("Le catalogue des chauffeurs est momentanément indisponible.");
  }
}

export async function getProviders(): Promise<SecondaryProvider[]> {
  try {
    const response = await fetch(apiUrl("/api/providers"));
    let providerEntries: FirestoreRecord[];
    if (response.status === 404) {
      const pythonResponse = await fetch(apiUrl("/prestataires/api/public"));
      const pythonPayload = await pythonResponse.json() as { prestataires?: FirestoreRecord[]; error?: string };
      if (!pythonResponse.ok || !pythonPayload.prestataires) {
        throw new Error(pythonPayload.error || "Le catalogue des prestataires est momentanément indisponible.");
      }
      providerEntries = pythonPayload.prestataires;
    } else {
      const payload = await response.json() as { providers?: FirestoreRecord[]; error?: string };
      if (!response.ok || !payload.providers) {
        throw new Error(payload.error || "Le catalogue des prestataires est momentanément indisponible.");
      }
      providerEntries = payload.providers;
    }
    if (providerEntries.length === 0) {
      return initialSecondaryProviders;
    }
    const providers: SecondaryProvider[] = [];
    providerEntries.forEach((data) => {
      const adminStatus = String(data.status || data.statut || "").trim().toLowerCase();
      if (adminStatus === "indisponible") return;
      const rawSpecialty = String(data.specialty || data.categorie || "").trim().toLowerCase();
      const specialty = rawSpecialty.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "menagere"
        ? "ménagère" : rawSpecialty;
      if (!["ménagère", "coiffeur", "professeur", "maquilleuse"].includes(specialty)) return;
      const skills = (Array.isArray(data.skills) ? data.skills.map(String) : [String(data.competences || "")])
        .flatMap((value) => value.split(/[,\n;]/))
        .map((item) => item.trim())
        .filter(Boolean);
      const provider = {
        ...data,
        id: String(data.id),
        specialty,
        avatarUrl: specialty === "ménagère"
          ? s3ProfilePhotoUrl(data.photo_profil)
          : String(data.avatarUrl || data.photoUrl || ""),
        skills,
        experienceYears: Number(data.experienceYears ?? data.anneesExperience ?? 0),
        priceRate: String(data.priceRate || "").replace(/€/g, "$")
          .replace(/\/ heure/g, specialty === "ménagère" || specialty === "professeur" ? "/ mois" : "/ heure") ||
          String(data.tarifMensuel || ""),
        priceNegotiable: data.priceNegotiable === true,
        country: String(data.country || data.pays || "Non renseigné"),
        city: String(data.city || data.ville || data.location || "Non renseignée"),
        commune: String(data.commune || "Non renseignée"),
        location: String(data.location || [data.commune, data.ville].filter(Boolean).join(", ") || "Non renseignée"),
        status: "disponible",
        providerAvailability: data.providerAvailability === "indisponible" || data.availability === "indisponible"
          ? "indisponible" : "disponible",
      } as SecondaryProvider;
      if (data.verified === true || data.verified === "true") providers.push(provider);
    });
    return providers;
  } catch (error) {
    console.error("Error fetching providers from Firestore:", error);
    throw new Error("Le catalogue des prestataires est momentanément indisponible.");
  }
}

async function getBookingsFromCollection(collectionName: string, clientId: string): Promise<Booking[]> {
  const snapshot = await getDocs(query(collection(db, collectionName), where("clientId", "==", clientId)));
  return snapshot.docs.map((snapshotDocument) => ({ ...snapshotDocument.data(), id: snapshotDocument.id }) as Booking)
    .filter((booking) => booking.acknowledgedByClient !== true);
}

export async function getBookings(clientId: string): Promise<Booking[]> {
  if (!clientId) return [];
  try {
    return (await Promise.all([
      getBookingsFromCollection(bookingsCollection, clientId),
      getBookingsFromCollection(carBookingsCollection, clientId),
      getBookingsFromCollection(propertyBookingsCollection, clientId),
    ])).flat();
  } catch (error) {
    console.error("Error fetching bookings from Firestore:", error);
    throw new Error("Vos réservations sont momentanément indisponibles.");
  }
}

function subscribeToCollection(
  collectionName: string,
  clientId: string,
  callback: (bookings: Booking[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(query(collection(db, collectionName), where("clientId", "==", clientId)), (snapshot) => {
    callback(snapshot.docs
      .map((snapshotDocument) => ({ ...snapshotDocument.data(), id: snapshotDocument.id }) as Booking)
      .filter((booking) => booking.acknowledgedByClient !== true));
  }, (error) => {
    console.error("Error subscribing to bookings in Firestore:", error);
    onError?.(error);
  });
}

export function subscribeToBookings(
  clientId: string,
  callback: (bookings: Booking[]) => void,
  onError?: (error: Error) => void,
) {
  if (!clientId) {
    callback([]);
    return () => {};
  }
  const bookingLists = new Map<string, Booking[]>();
  const update = (collectionName: string, bookings: Booking[]) => {
    bookingLists.set(collectionName, bookings);
    callback([...bookingLists.values()].flat());
  };
  const unsubscribers = [
    subscribeToCollection(bookingsCollection, clientId, (bookings) => update(bookingsCollection, bookings), onError),
    subscribeToCollection(carBookingsCollection, clientId, (bookings) => update(carBookingsCollection, bookings), onError),
    subscribeToCollection(propertyBookingsCollection, clientId, (bookings) => update(propertyBookingsCollection, bookings), onError),
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined).map(removeUndefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removeUndefined(item)]));
  }
  return value;
}

export async function addBooking(booking: Booking) {
  const collectionName = booking.serviceType === "Automobile" ? carBookingsCollection
    : booking.serviceType === "Immobilier" ? propertyBookingsCollection : bookingsCollection;
  try {
    await saveBooking(collectionName, booking);
  } catch (error) {
    console.error("Error adding booking to Firestore:", error);
    if (booking.serviceType === "Automobile" || booking.serviceType === "Immobilier") throw error;
  }
}

async function saveBooking(collectionName: string, booking: Booking) {
  await setDoc(doc(db, collectionName, booking.id), removeUndefined({
    ...booking,
    createdAt: new Date().toISOString(),
    acknowledgedByClient: false,
  }));
  if (booking.providerId && booking.providerCollection === "chauffeurs") {
    await setDoc(doc(db, booking.providerCollection, booking.providerId), { status: "indisponible" }, { merge: true });
  }
}

async function authenticatedPost(path: string, body: unknown) {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentification requise.");
  const token = await user.getIdToken();
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { Authorization: ["Bear", "er "].join("") + token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, payload: await response.json() as FirestoreRecord };
}

async function getProfessionalSessionFromApi(session: UserSession): Promise<UserSession | null> {
  const { response, payload } = await authenticatedPost("/api/professional-session", {});
  if (!response.ok) return null;
  const providerStatus = normalizeProviderStatus(payload.providerStatus);
  return {
    isLoggedIn: true,
    uid: session.uid,
    email: String(payload.email || session.email),
    fullName: String(payload.fullName || session.fullName),
    role: "prestataire",
    specialty: typeof payload.specialty === "string" ? payload.specialty : session.specialty,
    providerStatus,
    providerListing: payload.providerListing as ProviderListing | undefined,
  };
}

export async function createPropertyBooking(booking: unknown): Promise<string> {
  const { response, payload } = await authenticatedPost("/api/property-bookings", booking);
  if (!response.ok || !payload.id) throw new Error(String(payload.error || "La réservation n'a pas pu être enregistrée."));
  return String(payload.id);
}

export async function submitProperty(submission: unknown): Promise<string> {
  const { response, payload } = await authenticatedPost("/api/property-submissions", submission);
  if (!response.ok || !payload.id) throw new Error(String(payload.error || "La soumission n'a pas pu être envoyée."));
  return String(payload.id);
}

export async function submitVehicle(submission: unknown): Promise<string> {
  const { response, payload } = await authenticatedPost("/api/vehicle-submissions", submission);
  if (!response.ok || !payload.id) throw new Error(String(payload.error || "La demande de véhicule n'a pas pu être envoyée."));
  return String(payload.id);
}

export async function submitVehiclePurchaseRequest(request: unknown): Promise<string> {
  const { response, payload } = await authenticatedPost("/api/vehicle-purchase-requests", request);
  if (!response.ok || !payload.id) throw new Error(String(payload.error || "La demande d'achat n'a pas pu être enregistrée."));
  return String(payload.id);
}

export async function submitPartnershipRequest(request: unknown): Promise<string> {
  const response = await fetch(apiUrl("/api/partnership-requests"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = await response.json() as FirestoreRecord;
  if (!response.ok || !payload.id) throw new Error(String(payload.error || "La proposition de partenariat n'a pas pu être envoyée."));
  return String(payload.id);
}

export async function submitBookingReview(bookingId: string, rating: number, comment: string) {
  const { response, payload } = await authenticatedPost("/api/booking-reviews", { bookingId, rating, comment });
  if (!response.ok || typeof payload.rating !== "number" || typeof payload.reviewsCount !== "number") {
    throw new Error(String(payload.error || payload.detail || "Votre avis n'a pas pu être enregistré."));
  }
  return { rating: payload.rating, reviewsCount: payload.reviewsCount };
}

export async function uploadPropertySubmissionImage(image: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
    throw new Error("Choisissez une image JPEG, PNG ou WebP.");
  }
  if (image.size === 0 || image.size > 5 * 1024 * 1024) {
    throw new Error("La photo de référence ne doit pas dépasser 5 Mo.");
  }
  const { response, payload } = await authenticatedPost("/api/property-submission-uploads", {
    image: { contentType: image.type },
  });
  const upload = payload.upload as { url: string; fields: Record<string, string>; publicUrl: string } | undefined;
  if (!response.ok || !upload) throw new Error(String(payload.error || "Impossible de préparer l'envoi de la photo de référence."));
  const form = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", image);
  if (!(await fetch(upload.url, { method: "POST", body: form })).ok) {
    throw new Error("Impossible d'envoyer la photo de référence.");
  }
  return upload.publicUrl;
}

export async function uploadVehicleSubmissionImage(image: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new Error("Choisissez une image JPEG, PNG ou WebP.");
  if (image.size === 0 || image.size > 5 * 1024 * 1024) throw new Error("Chaque photo ne doit pas dépasser 5 Mo.");
  const { response, payload } = await authenticatedPost("/api/vehicle-submission-uploads", { image: { contentType: image.type } });
  const upload = payload.upload as { url: string; fields: Record<string, string>; publicUrl: string } | undefined;
  if (!response.ok || !upload) throw new Error(String(payload.error || "Impossible de préparer l'envoi de la photo du véhicule."));
  const form = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", image);
  if (!(await fetch(upload.url, { method: "POST", body: form })).ok) throw new Error("Impossible d'envoyer une photo du véhicule.");
  return upload.publicUrl;
}

async function findBooking(bookingId: string) {
  for (const collectionName of [bookingsCollection, carBookingsCollection, propertyBookingsCollection]) {
    const bookingRef = doc(db, collectionName, bookingId);
    const snapshot = await getDoc(bookingRef);
    if (snapshot.exists()) return { bookingRef, booking: snapshot.data() as Booking };
  }
  throw new Error("Réservation introuvable.");
}

export async function acknowledgeBooking(bookingId: string) {
  const { bookingRef } = await findBooking(bookingId);
  await updateDoc(bookingRef, { acknowledgedByClient: true });
}

export async function cancelBooking(bookingId: string) {
  try {
    const { bookingRef, booking } = await findBooking(bookingId);
    if (booking.providerId && booking.providerCollection === "chauffeurs") {
      await updateDoc(doc(db, booking.providerCollection, booking.providerId), { status: "disponible" });
    }
    await deleteDoc(bookingRef);
  } catch (error) {
    console.error("Error cancelling booking in Firestore:", error);
    throw error;
  }
}

export async function getProviderBookings(providerId: string): Promise<Booking[]> {
  if (!providerId) return [];
  const user = auth.currentUser;
  if (!user) throw new Error("Authentification requise.");
  const token = await user.getIdToken();
  const response = await fetch(apiUrl("/api/provider-missions"), {
    headers: { Authorization: ["Bear", "er "].join("") + token },
  });
  const payload = await response.json() as FirestoreRecord;
  if (!response.ok || !Array.isArray(payload.missions)) throw new Error(String(payload.error || payload.detail || "Vos missions n'ont pas pu être chargées."));
  return payload.missions as Booking[];
}

export async function requestProviderCompletion(bookingId: string, providerId: string) {
  if (!providerId) throw new Error("Prestataire introuvable.");
  const { response, payload } = await authenticatedPost(`/api/provider-missions/${encodeURIComponent(bookingId)}/complete`, {});
  if (!response.ok) throw new Error(String(payload.error || payload.detail || "La fin de prestation n'a pas pu être signalée."));
}

async function uploadProfessionalImages(images: File[], uploadType: "portfolio" | "avatar"): Promise<string[]> {
  if (images.length === 0) return [];
  const { response, payload } = await authenticatedPost("/api/portfolio-uploads", {
    uploadType,
    images: images.map((image) => ({ contentType: image.type })),
  });
  const uploads = payload.uploads as Array<{ url: string; fields: Record<string, string>; publicUrl: string }> | undefined;
  if (!response.ok || !uploads) throw new Error(String(payload.error || "Impossible de préparer l'envoi des images."));
  await Promise.all(uploads.map(async (upload, index) => {
    const form = new FormData();
    Object.entries(upload.fields).forEach(([key, value]) => form.append(key, value));
    form.append("file", images[index]);
    if (!(await fetch(upload.url, { method: "POST", body: form })).ok) {
      throw new Error("Impossible d'envoyer une image vers le stockage.");
    }
  }));
  return uploads.map((upload) => upload.publicUrl);
}

export async function updateProfessionalProfile(
  session: UserSession,
  profile: {
    fullName: string; phone: string; country: string; city: string; commune: string; bio: string;
    specialty: string; skills: string[]; priceRate: string; avatarUrl: string; portfolio: string[];
  },
  newPortfolioImages: File[] = [],
  newAvatarImage?: File,
) {
  const listing = session.providerListing;
  if (session.providerStatus !== "Confirmé") throw new Error("Votre dossier doit être approuvé avant toute modification du profil.");
  if (!listing || ("vehicleModel" in listing)) {
    throw new Error("Ce profil prestataire ne peut pas être modifié.");
  }
  if (newPortfolioImages.length > 6) throw new Error("Vous pouvez ajouter au maximum 6 images de portfolio à la fois.");

  const [uploadedPortfolio, uploadedAvatar] = await Promise.all([
    uploadProfessionalImages(newPortfolioImages, "portfolio"),
    newAvatarImage ? uploadProfessionalImages([newAvatarImage], "avatar") : Promise.resolve([]),
  ]);
  const portfolio = [...profile.portfolio, ...uploadedPortfolio].slice(0, 6);
  const avatarUrl = uploadedAvatar[0] || profile.avatarUrl || listing.avatarUrl;
  const listingUpdate = {
    name: profile.fullName, phone: profile.phone, country: profile.country, city: profile.city,
    commune: profile.commune, bio: profile.bio, specialty: profile.specialty, skills: profile.skills, priceRate: profile.priceRate,
    avatarUrl, portfolio,
  };
  await updateDoc(doc(db, providersCollection, listing.id), listingUpdate);
  return { avatarUrl, portfolio };
}

export async function updateProviderAvailability(session: UserSession, providerAvailability: "disponible" | "indisponible") {
  const listing = session.providerListing;
  if (session.providerStatus !== "Confirmé" || !listing || ("vehicleModel" in listing)) {
    throw new Error("Seuls les prestataires approuvés peuvent modifier leur disponibilité.");
  }
  const { response, payload } = await authenticatedPost("/api/provider-availability", { providerAvailability });
  if (!response.ok || payload.providerAvailability !== providerAvailability) {
    throw new Error(String(payload.error || payload.detail || "Votre disponibilité n'a pas pu être mise à jour."));
  }
}

export async function saveUser(session: UserSession) {
  if (!session.email) return;
  try {
    await setDoc(doc(db, usersCollection, session.email.toLowerCase()), {
      email: session.email.toLowerCase(), fullName: session.fullName, role: session.role,
      specialty: session.specialty || null, uid: session.uid || auth.currentUser?.uid || null, phone: session.phone || null,
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user to Firestore:", error);
  }
}

export async function registerClient(fullName: string, email: string, password: string, phone?: string): Promise<UserSession> {
  const normalizedEmail = email.toLowerCase().trim();
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const session: UserSession = {
    isLoggedIn: true, email: normalizedEmail, fullName, role: "client", phone, uid: credential.user.uid,
  };
  await setDoc(doc(db, usersCollection, normalizedEmail), { uid: credential.user.uid, ...session }, { merge: true });
  return session;
}

export async function loginClient(email: string, password: string): Promise<UserSession> {
  const normalizedEmail = email.toLowerCase().trim();
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const session = await getUser(normalizedEmail);
  if (!session || session.role !== "client") throw new Error("Ce compte n'est pas un compte client.");
  const authenticatedSession = { ...session, uid: credential.user.uid };
  await saveUser(authenticatedSession);
  return authenticatedSession;
}

export async function loginWithGoogleClient(): Promise<UserSession> {
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  const email = credential.user.email?.toLowerCase().trim();
  if (!email) throw new Error("Le compte Google sélectionné ne contient pas d'adresse e-mail.");
  const storedSession = await getUser(email);
  if (storedSession && storedSession.role !== "client") throw new Error("Ce compte Google est associé à un compte prestataire.");
  const session: UserSession = {
    ...(storedSession || {
      isLoggedIn: true, email, fullName: credential.user.displayName || email.split("@")[0], role: "client" as const,
    }),
    uid: credential.user.uid,
  };
  await saveUser(session);
  return session;
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) throw new Error("Veuillez saisir votre adresse e-mail avant de demander la réinitialisation.");
  await sendPasswordResetEmail(auth, normalizedEmail);
}

async function getUser(email: string): Promise<UserSession | null> {
  if (!email) return null;
  try {
    const snapshot = await getDoc(doc(db, usersCollection, email.toLowerCase()));
    if (!snapshot.exists()) return null;
    const data = record(snapshot.data());
    return {
      isLoggedIn: true, email: String(data.email), fullName: String(data.fullName), role: data.role as UserSession["role"],
      specialty: typeof data.specialty === "string" ? data.specialty : undefined,
      phone: typeof data.phone === "string" ? data.phone : undefined,
      uid: typeof data.uid === "string" ? data.uid : undefined,
    };
  } catch (error) {
    console.error("Error getting user from Firestore:", error);
    return null;
  }
}

export async function onboardProfessional(
  session: UserSession,
  password: string,
  driver?: Chauffeur,
  provider?: SecondaryProvider,
): Promise<UserSession> {
  const email = session.email.toLowerCase().trim();
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (typeof error !== "object" || error === null || !("code" in error) || String(error.code) !== "auth/email-already-in-use") {
      throw error;
    }
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (signInError) {
      if (typeof signInError === "object" && signInError !== null && "code" in signInError &&
        String(signInError.code) === "auth/invalid-credential") {
        throw new Error("Cette adresse e-mail possède déjà un compte. Utilisez le mot de passe de ce compte pour soumettre votre dossier prestataire.");
      }
      throw signInError;
    }
  }
  const accounts = await getDocs(query(collection(db, professionalAccountsCollection), where("uid", "==", credential.user.uid)));
  if (!accounts.empty) {
    const status = normalizeProviderStatus(record(accounts.docs[0].data()).status);
    throw new Error(status === "Refusé"
      ? "Un dossier prestataire existe déjà et a été refusé. Contactez l'équipe Goying avant une nouvelle soumission."
      : "Un dossier prestataire existe déjà pour ce compte.");
  }
  const listing = driver || provider;
  const application = {
    id: `application-${Date.now()}`,
    session: { ...session, uid: credential.user.uid, email, isLoggedIn: true },
    listing,
    specialty: session.specialty || "Général",
    status: "En attente",
    submittedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, professionalApplicationsCollection, application.id), application);
  await setDoc(doc(db, professionalAccountsCollection, credential.user.uid), {
    uid: credential.user.uid, email, fullName: session.fullName, role: "prestataire",
    specialty: session.specialty || "Général", status: "En attente", applicationId: application.id,
  });
  return { ...session, uid: credential.user.uid, email, isLoggedIn: true };
}

function normalizeProviderStatus(value: unknown): UserSession["providerStatus"] {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (["refuse", "rejete", "rejected", "declined"].includes(normalized)) return "Refusé";
  if (["confirme", "approuve", "approved"].includes(normalized)) return "Confirmé";
  return "En attente";
}

export async function loginProfessional(email: string, password: string): Promise<UserSession> {
  const normalizedEmail = email.toLowerCase().trim();
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const directAccount = await getDoc(doc(db, professionalAccountsCollection, credential.user.uid));
  const account = directAccount.exists()
    ? directAccount
    : (await getDocs(query(collection(db, professionalAccountsCollection), where("uid", "==", credential.user.uid)))).docs[0];
  if (!account?.exists()) throw new Error("Aucun compte prestataire ne correspond à cette adresse.");
  const data = record(account.data());
  return refreshProfessionalSession({
    isLoggedIn: true, uid: credential.user.uid, email: String(data.email), fullName: String(data.fullName),
    role: "prestataire", specialty: typeof data.specialty === "string" ? data.specialty : undefined,
    providerStatus: normalizeProviderStatus(data.status),
  });
}

export async function refreshProfessionalSession(session: UserSession): Promise<UserSession> {
  const currentUser = auth.currentUser;
  const uid = session.uid || (currentUser?.email?.toLowerCase() === session.email.toLowerCase() ? currentUser.uid : undefined);
  if (session.role !== "prestataire" || !uid) return session;
  try {
    const serverSession = await getProfessionalSessionFromApi({ ...session, uid });
    if (serverSession) return serverSession;
  } catch (error) {
    console.warn("Professional session API lookup failed; using Firestore fallback.", error);
  }
  const directAccount = await getDoc(doc(db, professionalAccountsCollection, uid));
  const account = directAccount.exists()
    ? directAccount
    : (await getDocs(query(collection(db, professionalAccountsCollection), where("uid", "==", uid)))).docs[0];
  const accountData = account?.exists() ? record(account.data()) : undefined;
  const directApplication = accountData?.applicationId
    ? await getDoc(doc(db, professionalApplicationsCollection, String(accountData.applicationId)))
    : undefined;
  let application = directApplication?.exists() ? directApplication : undefined;
  if (!application) {
    const ownedApplications = await getDocs(query(
      collection(db, professionalApplicationsCollection),
      where("session.uid", "==", uid)
    ));
    application = ownedApplications.docs.sort((first, second) =>
      String(record(second.data()).submittedAt || "").localeCompare(String(record(first.data()).submittedAt || ""))
    )[0];
  }
  const applicationData = application?.exists() ? record(application.data()) : undefined;
  const applicationStatus = normalizeProviderStatus(applicationData?.status);
  const accountStatus = normalizeProviderStatus(accountData?.status);
  const applicationListing = applicationData?.listing as ProviderListing | undefined;
  let providerListing: ProviderListing | undefined;
  if (applicationListing?.id) {
    const collectionName = "specialty" in applicationListing ? providersCollection : chauffeursCollection;
    const provider = await getDoc(doc(db, collectionName, applicationListing.id));
    if (provider.exists()) providerListing = { ...provider.data(), id: provider.id } as ProviderListing;
  }
  if (!providerListing && typeof accountData?.applicationId === "string" && accountData.applicationId) {
    const providers = await getDocs(query(collection(db, providersCollection),
      where("verified", "==", true), where("applicationId", "==", accountData.applicationId)));
    if (!providers.empty) providerListing = { ...providers.docs[0].data(), id: providers.docs[0].id } as ProviderListing;
  }
  if (!providerListing && session.email) {
    const providers = await getDocs(query(collection(db, providersCollection),
      where("verified", "==", true), where("email", "==", session.email.toLowerCase())));
    if (!providers.empty) providerListing = { ...providers.docs[0].data(), id: providers.docs[0].id } as ProviderListing;
  }
  const providerStatus = providerListing?.verified === true
    ? "Confirmé"
    : applicationStatus === "Refusé" || accountStatus === "Refusé"
      ? "Refusé"
      : applicationStatus === "Confirmé" || accountStatus === "Confirmé"
        ? "Confirmé"
        : "En attente";
  return {
    isLoggedIn: true,
    uid,
    email: String(accountData?.email || session.email),
    fullName: String(accountData?.fullName || session.fullName),
    role: "prestataire",
    specialty: typeof accountData?.specialty === "string" ? accountData.specialty : session.specialty,
    providerStatus, providerListing,
  };
}
