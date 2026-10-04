export enum ServiceCategory {
  Immobilier = "immobilier",
  Automobile = "automobile",
  Chauffeur = "chauffeur",
  Commissionnaire = "commissionnaire",
}

export interface Property {
  id: string;
  title: string;
  type: "Achat" | "Location";
  category: "Appartement" | "Maison" | "Bureau" | "Villa";
  price: number;
  currency: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  surface: number; // in m²
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  features: string[];
  rating: number;
  reviewsCount: number;
  contactName: string;
  phone?: string;
  informationsComplementaires?: string;
  isAvailable?: boolean;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: "Citadine" | "SUV" | "Berline" | "Sport" | "Utilitaire";
  pricePerDay: number;
  currency: string;
  transmission: "Automatique" | "Manuelle";
  fuel: "Essence" | "Diesel" | "Électrique" | "Hybride";
  seats: number;
  imageUrl: string;
  imageUrls?: string[];
  description?: string;
  location?: string;
  rating: number;
  reviewsCount: number;
  features: string[];
  isAvailable: boolean;
}

export interface VehicleSale {
  id: string;
  brand: string;
  model: string;
  year: number;
  vehicleType: string;
  condition: string;
  fuel: string;
  transmission: string;
  mileage: number;
  priceUsd: number;
  priceNegotiable: boolean;
  city: string;
  commune: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  status: "Disponible";
  createdAt?: string;
}

export interface Chauffeur {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  reviewsCount: number;
  pricePerMonth: number;
  currency: string;
  priceNegotiable: boolean;
  vehicleModel: string;
  serviceType: "Chauffeur privé" | "Taxi" | "Les deux";
  transmission: "Automatique" | "Manuelle" | "Les deux";
  experienceYears: number;
  country: string;
  city: string;
  commune: string;
  status: "disponible" | "indisponible";
  zones: string[];
  bio: string;
  verified: boolean;
  phone: string;
  managementMode: "admin" | "provider";
}

export interface SecondaryProvider {
  id: string;
  name: string;
  specialty: "ménagère" | "coiffeur" | "professeur" | "maquilleuse";
  avatarUrl: string;
  rating: number;
  reviewsCount: number;
  priceRate: string;
  priceNegotiable: boolean;
  bio: string;
  location: string;
  country: string;
  city: string;
  commune: string;
  status: "disponible" | "indisponible";
  verified: boolean;
  skills: string[];
  portfolio?: string[];
  experienceYears: number;
  managementMode: "admin" | "provider";
}

export interface Booking {
  id: string;
  serviceType: "Immobilier" | "Automobile" | "Chauffeur" | "Service à la personne";
  itemName: string;
  date: string;
  status: "Confirmé" | "En attente" | "En cours" | "À valider" | "Terminé";
  details: string;
  costInfo: string;
  clientName?: string;
  clientEmail?: string;
  clientWhatsApp?: string;
  serviceAddress?: string;
  serviceLocationType?: "Maison" | "Entreprise";
  providerId?: string;
  providerCollection?: "chauffeurs" | "providers";
  provider?: Chauffeur | SecondaryProvider;
  acknowledgedByClient?: boolean;
  createdAt?: string;
  providerCompletionRequested?: boolean;
  providerCompletedAt?: string;
  adminCompletedAt?: string;
  reviewedAt?: string;
  clientId?: string;
  nom_client?: string;
  telephone_client?: string;
  type_bien?: "maison" | "voiture";
  bien_id?: string;
  titre_bien?: string;
  photo_bien?: string;
  localisation?: string;
  prix?: number;
  devise?: string;
  description?: string;
  informations_complementaires?: string;
  date_reservation?: string;
  statut?: Booking["status"];
}

export interface UserSession {
  isLoggedIn: boolean;
  email: string;
  fullName: string;
  role: "client" | "prestataire";
  specialty?: string;
  providerStatus?: "En attente" | "Confirmé" | "Refusé";
  providerListing?: Chauffeur | SecondaryProvider;
  phone?: string;
  uid?: string;
}

export interface ProfessionalApplication {
  id: string;
  session: UserSession;
  listing?: Chauffeur | SecondaryProvider;
  specialty: string;
  status: "En attente" | "Confirmé" | "Refusé";
  submittedAt: string;
}
