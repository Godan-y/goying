import React, { useState } from "react";
import {
  Property,
  Vehicle,
  Chauffeur,
  SecondaryProvider,
  Booking,
  UserSession
} from "../types";
import {
  Home as HomeIcon,
  Search,
  Filter,
  MapPin,
  Maximize,
  BedDouble,
  Bath,
  CheckCircle,
  Clock,
  Car,
  Fuel,
  Gauge,
  Sliders,
  Star,
  Users,
  Compass,
  Briefcase,
  BookOpen,
  Calendar,
  Sparkles,
  Phone,
  Image as ImageIcon,
  Scissors
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageCarousel } from "./ImageCarousel";
import { Lightbox } from "./Lightbox";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";

interface ExpandableDescriptionProps {
  description: string;
  className?: string;
}

function ExpandableDescription({ description, className = "" }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = description.length > 120;

  return (
    <div className={className}>
      <p className={`break-words text-xs leading-relaxed text-slate-500 ${isLongDescription && !isExpanded ? "line-clamp-2" : ""}`}>
        {description}
      </p>
      {isLongDescription && (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="mt-1 inline-flex min-h-9 items-center py-1 text-left text-xs font-semibold text-indigo-600 hover:text-indigo-500"
        >
          {isExpanded ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </div>
  );
}

function mediaImages(imageUrls: string[] | undefined, fallback: string) {
  return Array.from(new Set([...(imageUrls || []), fallback].filter(Boolean)));
}

function complementaryInformationItems(value?: string): string[] {
  if (!value?.trim()) return [];
  const separator = /\r?\n|[;,]/;
  return separator.test(value)
    ? value.split(separator).map((item) => item.trim()).filter(Boolean)
    : [value.trim()];
}

/* ========================================== */
/*           1. REAL ESTATE VIEW              */
/* ========================================== */
interface RealEstateViewProps {
  properties: Property[];
  onBookProperty: (input: { propertyId: string; clientName: string; clientPhone: string; visitDate: string; visitTime: string }) => Promise<void>;
  onRequireLogin: () => void;
  session: UserSession;
}

export function RealEstateView({ properties, onBookProperty, onRequireLogin, session }: RealEstateViewProps) {
  const [filterType, setFilterType] = useState<"Tous" | "Location" | "Achat">("Tous");
  const [filterCategory, setFilterCategory] = useState<string>("Tous");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingHours, setBookingHours] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; alt: string } | null>(null);

  const categories = ["Tous", "Villa", "Appartement", "Bureau", "Maison", "Terrain", "Studio"];

  const filteredProperties = properties.filter((p) => {
    const matchesType = filterType === "Tous" || p.type === filterType;
    const matchesCategory = filterCategory === "Tous" || p.category === filterCategory;
    return matchesType && matchesCategory;
  });

  const openProperty = (property: Property) => {
    setSelectedProperty(property);
    setBookingError(null);
    setBookingSuccess(false);
    setClientName(session.fullName || "");
    setClientPhone(normalizePhoneInput(session.phone || ""));
    if (!session.isLoggedIn) {
      setBookingError("Connectez-vous pour réserver une maison. Votre demande restera ouverte après la connexion.");
      onRequireLogin();
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !bookingDate || !bookingHours) return;
    if (!clientName.trim()) {
      setBookingError("Veuillez renseigner votre nom complet.");
      return;
    }
    const internationalPhone = toInternationalPhone(clientPhone);
    if (!internationalPhone) {
      setBookingError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);
    try {
      if (!session.isLoggedIn) {
        setBookingError("Connectez-vous pour envoyer cette demande.");
        onRequireLogin();
        return;
      }
      await onBookProperty({
        propertyId: selectedProperty.id,
        clientName: clientName.trim(),
        clientPhone: internationalPhone,
        visitDate: bookingDate,
        visitTime: bookingHours,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedProperty(null);
        setBookingDate("");
        setBookingHours("");
      }, 2500);
    } catch (error) {
      console.error("Error adding property booking:", error);
      setBookingError("La réservation n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="realestate-view-container">
      {/* Search & Filter Header */}
      <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 mb-2">
            Espace Immobilier Goying
          </span>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Trouvez l'adresse parfaite
          </h2>
          <p className="mt-1.5 text-xs text-slate-300 sm:text-sm">
            Parcourez notre catalogue exclusif d'appartements, villas de prestige, bureaux professionnels et locaux commerciaux.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        {/* Type selector */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(["Tous", "Location", "Achat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                filterType === t
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category selector */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                filterCategory === cat
                  ? "bg-blue-600 text-white border-blue-600 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Real Estate Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200">
          <HomeIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Aucun bien ne correspond à vos filtres de recherche.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((p) => (
            <motion.div
              layout
              key={p.id}
              className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
            >
              {/* Image with Tag */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <ImageCarousel
                  images={mediaImages(p.imageUrls, p.imageUrl)}
                  alt={p.title}
                  onOpen={(index) => setLightbox({ images: mediaImages(p.imageUrls, p.imageUrl), index, alt: p.title })}
                  className="h-full w-full"
                >
                  <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
                    p.type === "Location" ? "bg-blue-600" : "bg-orange-600"
                  }`}>
                    À {p.type === "Location" ? "Louer" : "Vendre"}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {p.rating}
                  </span>
                </ImageCarousel>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  <span>{p.address}</span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {p.title}
                </h3>

                <p className="mt-2 overflow-hidden text-ellipsis text-xs leading-relaxed text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {p.description}
                </p>

                {/* Specs */}
                <div className="mt-4 flex items-center gap-3 border-t border-slate-50 pt-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Maximize className="h-3.5 w-3.5 text-slate-400" />
                    {p.surface} m²
                  </span>
                  {p.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                      {p.bedrooms} ch.
                    </span>
                  )}
                  {p.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5 text-slate-400" />
                      {p.bathrooms} sdb.
                    </span>
                  )}
                </div>

                {/* Footer price & CTA */}
                <div className="mt-auto pt-5 flex items-center justify-between border-t border-slate-50">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Prix</span>
                    <span className="font-display text-lg font-extrabold text-slate-900">
                      {p.price.toLocaleString()} {p.currency}
                      {p.type === "Location" && <span className="text-xs font-normal text-slate-500">/mois</span>}
                    </span>
                  </div>

                  <button
                    onClick={() => openProperty(p)}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all"
                  >
                    {p.type === "Location" ? "Planifier visite" : "Faire offre"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Property Details & Booking Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProperty(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 my-0 w-full max-w-lg max-h-[calc(100dvh-1rem)] overscroll-contain overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
            >
              <button
                type="button"
                aria-label={`Agrandir les photos de ${selectedProperty.title}`}
                onClick={() => setLightbox({ images: mediaImages(selectedProperty.imageUrls, selectedProperty.imageUrl), index: 0, alt: selectedProperty.title })}
                className="mb-4 block w-full cursor-zoom-in overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <img src={mediaImages(selectedProperty.imageUrls, selectedProperty.imageUrl)[0]} alt={selectedProperty.title} referrerPolicy="no-referrer" className="aspect-video w-full object-cover" />
              </button>

              <h3 className="font-display text-xl font-bold text-slate-900">
                {selectedProperty.title}
              </h3>
              {selectedProperty.address && (
                <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {selectedProperty.address}
                </p>
              )}
              <p className="mt-2 text-sm font-bold text-slate-800">
                {selectedProperty.price.toLocaleString()} {selectedProperty.currency}
                {selectedProperty.type === "Location" ? " / mois" : ""}
              </p>

              <div className="mt-3 text-slate-600 text-xs leading-relaxed space-y-2">
                {selectedProperty.description && <p>{selectedProperty.description}</p>}
                {selectedProperty.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedProperty.features.map((feat, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                  </div>
                )}
                {selectedProperty.informationsComplementaires && (
                  <div className="pt-2">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Informations complémentaires</p>
                    <div className="flex flex-wrap gap-1.5">
                      {complementaryInformationItems(selectedProperty.informationsComplementaires).map((information, index) => (
                        <span key={index} className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                          ✓ {information}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Success Animation */}
              {bookingSuccess ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-800">
                    Demande enregistrée avec succès !
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Un conseiller de l'agence vous contactera sous peu.
                  </p>
                </div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleBook} className="mt-5 space-y-4 border-t border-slate-100 pt-4 [&_input]:py-2.5 sm:mt-6 sm:pt-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Planifier un rendez-vous
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(normalizePhoneInput(e.target.value))}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Date souhaitée
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {bookingError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{bookingError}</p>}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Heure idéale
                      </label>
                      <input
                        type="time"
                        required
                        value={bookingHours}
                        onChange={(e) => setBookingHours(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedProperty(null)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSubmitting ? "Enregistrement…" : "Confirmer la demande"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Lightbox images={lightbox?.images || []} initialIndex={lightbox?.index} alt={lightbox?.alt} isOpen={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}

/* ========================================== */
/*           2. CAR RENTAL VIEW               */
/* ========================================== */
interface CarRentalViewProps {
  vehicles: Vehicle[];
  onAddBooking: (booking: Booking) => Promise<void>;
  session: UserSession;
}

export function CarRentalView({ vehicles, onAddBooking, session }: CarRentalViewProps) {
  const [filterCat, setFilterCat] = useState<string>("Tous");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [rentDays, setRentDays] = useState(1);
  const [rentDate, setRentDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [rentError, setRentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentSuccess, setRentSuccess] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; alt: string } | null>(null);

  const categories = ["Tous", "SUV", "Citadine", "Berline"];

  const filteredVehicles = vehicles.filter((v) => {
    return filterCat === "Tous" || v.category === filterCat;
  });

  const openVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRentError(null);
    setRentSuccess(false);
    setClientName(session.fullName || "");
    setClientPhone(normalizePhoneInput(session.phone || ""));
  };

  const handleRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !rentDate) return;
    if (!clientName.trim()) {
      setRentError("Veuillez renseigner votre nom complet.");
      return;
    }
    const internationalPhone = toInternationalPhone(clientPhone);
    if (!internationalPhone) {
      setRentError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }

    const totalCost = selectedVehicle.pricePerDay * rentDays;

    const newBooking: Booking = {
      id: `book-car-${Date.now()}`,
      serviceType: "Automobile",
      itemName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
      date: rentDate,
      status: "Confirmé",
      details: `Location confirmée pour une durée de ${rentDays} jour(s). Point de retrait : Agence Goying Auto.`,
      costInfo: `${totalCost}${selectedVehicle.currency} (${selectedVehicle.pricePerDay}€/j)`,
      clientName: clientName.trim(),
      clientEmail: session.email || undefined,
      clientWhatsApp: internationalPhone,
      clientId: session.uid || undefined,
      nom_client: clientName.trim(),
      telephone_client: internationalPhone,
      type_bien: "voiture",
      bien_id: selectedVehicle.id,
      titre_bien: `${selectedVehicle.brand} ${selectedVehicle.model}`,
      photo_bien: mediaImages(selectedVehicle.imageUrls, selectedVehicle.imageUrl)[0],
      localisation: selectedVehicle.location || undefined,
      prix: selectedVehicle.pricePerDay,
      devise: selectedVehicle.currency || undefined,
      description: selectedVehicle.description || undefined,
      date_reservation: new Date().toISOString(),
      statut: "Confirmé",
    };

    setIsSubmitting(true);
    setRentError(null);
    try {
      await onAddBooking(newBooking);
      setRentSuccess(true);
      setTimeout(() => {
        setRentSuccess(false);
        setSelectedVehicle(null);
        setRentDays(1);
        setRentDate("");
      }, 2500);
    } catch (error) {
      console.error("Error adding car booking:", error);
      setRentError("La réservation n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="carrental-view-container">
      {/* Banner */}
      <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 mb-2">
            Espace Automobile Goying
          </span>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Louez en toute sérénité
          </h2>
          <p className="mt-1.5 text-xs text-slate-300 sm:text-sm">
            Bénéficiez de véhicules récents, entièrement révisés, avec assurance tout risque incluse pour vos déplacements.
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
              filterCat === cat
                ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Car Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((v) => (
          <div
            key={v.id}
            className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg flex flex-col h-full"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <ImageCarousel
                images={mediaImages(v.imageUrls, v.imageUrl)}
                alt={`${v.brand} ${v.model}`}
                onOpen={(index) => setLightbox({ images: mediaImages(v.imageUrls, v.imageUrl), index, alt: `${v.brand} ${v.model}` })}
                className="h-full w-full"
              >
                <span className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase shadow-sm ${
                  v.isAvailable ? "bg-emerald-500" : "bg-slate-400"
                }`}>
                  {v.isAvailable ? "Disponible" : "Réservé"}
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {v.rating}
                </span>
              </ImageCarousel>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {v.category}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {v.brand} {v.model}
              </h3>
              {v.description && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">{v.description}</p>
              )}

              {/* Specs */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-50 py-3 text-[11px] font-medium text-slate-500">
                <div className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{v.transmission}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{v.fuel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{v.seats} places</span>
                </div>
              </div>

              {/* Footer pricing */}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Tarif / jour</span>
                  <span className="font-display text-base font-extrabold text-slate-900">
                    {v.pricePerDay} {v.currency}
                  </span>
                </div>

                <button
                  onClick={() => openVehicle(v)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    v.isAvailable
                      ? "bg-slate-900 hover:bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Louer maintenant
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredVehicles.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Aucune voiture disponible pour le moment.
          </p>
        )}
      </div>

      {/* Vehicle details & renting modal */}
      <AnimatePresence>
        {selectedVehicle && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVehicle(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 my-0 w-full max-w-lg max-h-[calc(100dvh-1rem)] overscroll-contain overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
            >
              <button
                type="button"
                aria-label={`Agrandir les photos de ${selectedVehicle.brand} ${selectedVehicle.model}`}
                onClick={() => setLightbox({ images: mediaImages(selectedVehicle.imageUrls, selectedVehicle.imageUrl), index: 0, alt: `${selectedVehicle.brand} ${selectedVehicle.model}` })}
                className="mb-4 block w-full cursor-zoom-in overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <img src={mediaImages(selectedVehicle.imageUrls, selectedVehicle.imageUrl)[0]} alt={`${selectedVehicle.brand} ${selectedVehicle.model}`} referrerPolicy="no-referrer" className="aspect-video w-full object-cover" />
              </button>

              <h3 className="font-display text-xl font-bold text-slate-900">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h3>
              <p className="text-xs font-semibold text-emerald-600 mt-1 capitalize">
                Catégorie : {selectedVehicle.category}
              </p>
              {selectedVehicle.location && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <MapPin className="h-3 w-3" /> {selectedVehicle.location}
                </p>
              )}
              <p className="mt-2 text-sm font-bold text-slate-800">
                {selectedVehicle.pricePerDay.toLocaleString()} {selectedVehicle.currency} / jour
              </p>
              {selectedVehicle.description && (
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{selectedVehicle.description}</p>
              )}

              {/* Features badges */}
              {selectedVehicle.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                {selectedVehicle.features.map((feat, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                  >
                    ✓ {feat}
                  </span>
                ))}
                </div>
              )}

              {/* Booking success overlay */}
              {rentSuccess ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100 animate-pulse">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-800">
                    Location validée avec succès !
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Un reçu vous a été envoyé par email. Récupérez les clés en agence.
                  </p>
                </div>
              ) : (
                /* Renting Form */
                <form onSubmit={handleRent} className="mt-5 space-y-4 border-t border-slate-100 pt-4 [&_input]:py-2.5 sm:mt-6 sm:pt-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Paramètres de location
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(normalizePhoneInput(e.target.value))}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Date de départ
                      </label>
                      <input
                        type="date"
                        required
                        value={rentDate}
                        onChange={(e) => setRentDate(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {rentError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{rentError}</p>}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nombre de jours
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        required
                        value={rentDays}
                        onChange={(e) => setRentDays(parseInt(e.target.value) || 1)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Estimation */}
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-slate-500">Estimation totale :</span>
                    <span className="font-display font-extrabold text-slate-900 text-sm">
                      {selectedVehicle.pricePerDay * rentDays} {selectedVehicle.currency}
                    </span>
                  </div>

                  <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(null)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSubmitting ? "Enregistrement…" : "Payer & Valider"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Lightbox images={lightbox?.images || []} initialIndex={lightbox?.index} alt={lightbox?.alt} isOpen={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}

/* ========================================== */
/*           3. CHAUFFEUR VIEW                */
/* ========================================== */
interface ChauffeurViewProps {
  chauffeurs: Chauffeur[];
  onAddBooking: (booking: Booking) => void;
  session: UserSession;
}

export function ChauffeurView({ chauffeurs, onAddBooking, session }: ChauffeurViewProps) {
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);
  const [chauffeurSearch, setChauffeurSearch] = useState("");
  const [rideDetails, setRideDetails] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [clientWhatsApp, setClientWhatsApp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceLocationType, setServiceLocationType] = useState<"Maison" | "Entreprise">("Maison");
  const [rideSuccess, setRideSuccess] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; alt: string } | null>(null);

  const handleHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChauffeur || !rideDate) return;
    const internationalPhone = toInternationalPhone(clientWhatsApp);
    if (!internationalPhone) {
      setPhoneError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }
    setPhoneError("");

    const newBooking: Booking = {
      id: `book-ch-${Date.now()}`,
      serviceType: "Chauffeur",
      itemName: selectedChauffeur.name,
      date: rideDate,
      status: "En attente",
      details: `Trajet programmé : ${rideDetails}. Prise en charge ${serviceLocationType} : ${serviceAddress}. Tél chauffeur : ${selectedChauffeur.phone}`,
      costInfo: `${selectedChauffeur.pricePerMonth} ${selectedChauffeur.currency} / mois${selectedChauffeur.priceNegotiable ? " (négociable)" : ""}`,
      clientName: session.fullName || "Client",
      clientEmail: session.email || undefined,
      clientId: session.uid,
      clientWhatsApp: internationalPhone,
      serviceAddress,
      serviceLocationType,
      providerId: selectedChauffeur.id,
      providerCollection: "chauffeurs",
      provider: selectedChauffeur,
    };

    onAddBooking(newBooking);
    setRideSuccess(true);
    setTimeout(() => {
      setRideSuccess(false);
      setSelectedChauffeur(null);
      setRideDetails("");
      setRideDate("");
      setClientWhatsApp("");
      setServiceAddress("");
      setServiceLocationType("Maison");
    }, 2500);
  };

  const normalizedChauffeurSearch = chauffeurSearch.trim().toLowerCase();
  const filteredChauffeurs = chauffeurs.filter((chauffeur) =>
    chauffeur.status === "disponible" && [
      chauffeur.name,
      chauffeur.country,
      chauffeur.city,
      chauffeur.commune,
      chauffeur.serviceType,
      chauffeur.transmission,
      chauffeur.vehicleModel,
      ...chauffeur.zones,
    ].some((value) => value.toLowerCase().includes(normalizedChauffeurSearch))
  );

  return (
    <div className="space-y-6" id="chauffeur-view-container">
      {/* Banner */}
      <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 mb-2">
            Espace Chauffeur Goying
          </span>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Chauffeurs Privés Qualifiés
          </h2>
          <p className="mt-1.5 text-xs text-slate-300 sm:text-sm">
            Voyagez avec des professionnels expérimentés et certifiés. Service de transport fiable, discret et de qualité supérieure.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={chauffeurSearch}
          onChange={(e) => setChauffeurSearch(e.target.value)}
          placeholder="Rechercher par pays, ville, commune ou service..."
          className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label="Rechercher un chauffeur"
        />
      </div>

      {/* Directory list */}
      <div className="space-y-4">
        {filteredChauffeurs.map((ch) => (
          <div
            key={ch.id}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-start md:items-center"
          >
            {/* Avatar & Experience */}
            <div className="relative shrink-0">
              <button type="button" aria-label={`Agrandir la photo de ${ch.name}`} onClick={() => setLightbox({ images: [ch.avatarUrl], alt: ch.name })} className="block cursor-zoom-in rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                <img src={ch.avatarUrl} alt={ch.name} referrerPolicy="no-referrer" className="h-20 w-20 rounded-2xl border border-slate-100 object-cover" />
              </button>
              {ch.verified && (
                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-blue-500 p-1 text-white shadow-md">
                  <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" />
                </span>
              )}
            </div>

            {/* General Bio Info */}
            <div className="min-w-0 flex-grow space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words font-display text-lg font-bold text-slate-900">{ch.name}</h3>
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-100">
                  {ch.experienceYears} ans exp.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="min-w-0 break-all font-bold text-indigo-600 flex items-center gap-1">
                  🚗 {ch.vehicleModel}
                </span>
                <span className="break-words font-medium text-slate-500">
                  {ch.serviceType} · {ch.transmission}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {ch.rating} ({ch.reviewsCount} avis)
                </span>
              </div>

              <ExpandableDescription description={ch.bio} className="pt-1" />

              <p className="break-words text-[11px] font-semibold text-slate-500 pt-1">
                📍 {ch.country} · {ch.city} · {ch.commune}
              </p>

              {/* Zones */}
              <div className="flex flex-wrap gap-1 pt-2">
                {ch.zones.map((zone, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-100"
                  >
                    📍 {zone}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Rate & CTA */}
            <div className="w-full min-w-0 md:w-auto md:text-right border-t md:border-t-0 border-slate-50 pt-4 md:pt-0 shrink-0 flex md:flex-col justify-between items-center gap-2">
              <div className="md:mb-3">
                <span className="text-xs text-slate-400 block font-medium">Tarif mensuel</span>
                <span className="break-words font-display text-base font-extrabold text-slate-900">
                  {ch.pricePerMonth} {ch.currency} <span className="text-xs font-normal text-slate-500">/ mois</span>
                </span>
                <span className={`mt-1 block text-[10px] font-semibold ${ch.priceNegotiable ? "text-emerald-600" : "text-slate-400"}`}>
                  {ch.priceNegotiable ? "Prix négociable" : "Prix fixe"}
                </span>
              </div>

              <button
                onClick={() => setSelectedChauffeur(ch)}
                className="whitespace-nowrap rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-100 transition-all"
              >
                Réserver Chauffeur
              </button>
            </div>
          </div>
        ))}
        {filteredChauffeurs.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Aucun chauffeur ne correspond à votre recherche.
          </p>
        )}
      </div>

      {/* Booking Chauffeur Modal */}
      <AnimatePresence>
        {selectedChauffeur && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedChauffeur(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 my-0 w-full max-w-md max-h-[calc(100dvh-1rem)] overscroll-contain overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3 sm:gap-4">
                <button type="button" aria-label={`Agrandir la photo de ${selectedChauffeur.name}`} onClick={() => setLightbox({ images: [selectedChauffeur.avatarUrl], alt: selectedChauffeur.name })} className="shrink-0 cursor-zoom-in rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                  <img src={selectedChauffeur.avatarUrl} alt={selectedChauffeur.name} referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
                </button>
                <div className="min-w-0">
                  <h3 className="break-words font-display text-lg font-bold text-slate-900">
                    Réserver {selectedChauffeur.name}
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium">
                    {selectedChauffeur.vehicleModel}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {selectedChauffeur.serviceType} · {selectedChauffeur.transmission}
                  </p>
                </div>
              </div>

              {rideSuccess ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-800">
                    Demande de trajet envoyée !
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Le chauffeur va confirmer votre demande sous 15 minutes par WhatsApp.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleHire} className="space-y-4 [&_input]:py-2.5 [&_select]:py-2.5 [&_textarea]:py-2.5">
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Vos coordonnées</p>
                    <p className="text-xs font-semibold text-slate-800">{session.fullName || "Client"}</p>
                    {session.email && <p className="text-[11px] text-slate-500">{session.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Numéro WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +243 85 70 68 014"
                      value={clientWhatsApp}
                      onChange={(e) => setClientWhatsApp(normalizePhoneInput(e.target.value))}
                      className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    {phoneError && <p role="alert" className="mt-1 text-[11px] text-red-700">{phoneError}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lieu</label>
                      <select
                        value={serviceLocationType}
                        onChange={(e) => setServiceLocationType(e.target.value as "Maison" | "Entreprise")}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Maison">Maison</option>
                        <option value="Entreprise">Entreprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Adresse complète de prise en charge</label>
                      <input
                        type="text"
                        required
                        placeholder="Rue, numéro, commune, ville"
                        value={serviceAddress}
                        onChange={(e) => setServiceAddress(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Date & Heure de prise en charge
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Détails de l'itinéraire (Départ → Arrivée)
                    </label>
                    <textarea
                      placeholder="Ex: Aéroport DSS vers Hôtel de Ville, Dakar"
                      rows={3}
                      required
                      value={rideDetails}
                      onChange={(e) => setRideDetails(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedChauffeur(null)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 sm:w-auto"
                    >
                      Confirmer réservation
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Lightbox images={lightbox?.images || []} alt={lightbox?.alt} isOpen={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}

/* ========================================== */
/*        4. SECONDARY SERVICES VIEW          */
/* ========================================== */
interface SecondaryServicesViewProps {
  providers: SecondaryProvider[];
  onAddBooking: (booking: Booking) => void;
  session: UserSession;
}

export function SecondaryServicesView({ providers, onAddBooking, session }: SecondaryServicesViewProps) {
  const [activeSpec, setActiveSpec] = useState<"ménagère" | "coiffeur" | "professeur" | "maquilleuse">("ménagère");
  const [providerSearch, setProviderSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<SecondaryProvider | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [clientWhatsApp, setClientWhatsApp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceLocationType, setServiceLocationType] = useState<"Maison" | "Entreprise">("Maison");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index?: number; alt: string } | null>(null);

  const specsList = [
    { id: "ménagère" as const, label: "Ménagères", icon: HomeIcon, color: "text-emerald-600 bg-emerald-50" },
    { id: "coiffeur" as const, label: "Coiffeurs", icon: Scissors, color: "text-purple-600 bg-purple-50" },
    { id: "professeur" as const, label: "Professeurs", icon: BookOpen, color: "text-amber-600 bg-amber-50" },
    { id: "maquilleuse" as const, label: "Maquilleuses", icon: Sparkles, color: "text-pink-600 bg-pink-50" },
  ];

  const normalizedProviderSearch = providerSearch.trim().toLowerCase();
  const filteredProviders = providers.filter((provider) =>
    provider.status === "disponible" &&
    provider.specialty === activeSpec && [
      provider.name,
      provider.country,
      provider.city,
      provider.commune,
      provider.location,
      ...provider.skills,
    ].some((value) => value.toLowerCase().includes(normalizedProviderSearch))
  );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !bookingDate) return;
    const internationalPhone = toInternationalPhone(clientWhatsApp);
    if (!internationalPhone) {
      setPhoneError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }
    setPhoneError("");

    const newBooking: Booking = {
      id: `book-sec-${Date.now()}`,
      serviceType: "Service à la personne",
      itemName: `${selectedProvider.name} (${selectedProvider.specialty})`,
      date: `${bookingDate} à ${bookingTime}`,
      status: "En attente",
      details: `Prestation chez le client (${serviceLocationType}). Remarques : ${bookingNotes || "Aucune consigne spécifique"}.`,
      costInfo: selectedProvider.priceRate,
      clientName: session.fullName || "Client",
      clientEmail: session.email || undefined,
      clientId: session.uid,
      clientWhatsApp: internationalPhone,
      serviceAddress,
      serviceLocationType,
      providerId: selectedProvider.id,
      providerCollection: "providers",
      provider: selectedProvider,
    };

    onAddBooking(newBooking);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedProvider(null);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
      setClientWhatsApp("");
      setServiceAddress("");
      setServiceLocationType("Maison");
    }, 2500);
  };

  return (
    <div className="space-y-6" id="secondaryservices-view-container">
      {/* Banner */}
      <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300 mb-2">
            Services à la personne Goying
          </span>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Des experts chez vous
          </h2>
          <p className="mt-1.5 text-xs text-slate-300 sm:text-sm">
            Réservez des profils qualifiés et évalués pour l'entretien, l'accompagnement scolaire ou la beauté à domicile.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-100 pb-4">
        {specsList.map((spec) => {
          const IconComp = spec.icon;
          const isActive = activeSpec === spec.id;
          return (
            <button
              key={spec.id}
              onClick={() => setActiveSpec(spec.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-bold border transition-all ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <IconComp className="h-4 w-4 shrink-0" />
              <span>{spec.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={providerSearch}
          onChange={(e) => setProviderSearch(e.target.value)}
          placeholder="Rechercher par pays, ville, commune ou nom..."
          className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          aria-label="Rechercher un prestataire"
        />
      </div>

      {/* Profile list */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filteredProviders.map((prov) => (
          <div
            key={prov.id}
            className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 flex flex-col h-full"
          >
            {/* Header profile info */}
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <button type="button" aria-label={`Agrandir la photo de ${prov.name}`} onClick={() => setLightbox({ images: [prov.avatarUrl], alt: prov.name })} className="shrink-0 cursor-zoom-in rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600">
                <img src={prov.avatarUrl} alt={prov.name} referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl border border-slate-100 object-cover" />
              </button>
              <div className="min-w-0 flex-grow space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="min-w-0 break-words font-display text-sm font-bold leading-tight text-slate-900 sm:text-base">
                    {prov.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                    Vérifié
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 capitalize">
                  {prov.experienceYears} ans d'expérience
                </p>
                <p className="break-words text-[11px] font-semibold leading-relaxed text-slate-500">
                  📍 {prov.country} · {prov.city} · {prov.commune}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium pt-0.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>{prov.rating} ({prov.reviewsCount} avis)</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <ExpandableDescription description={prov.bio} className="mt-3.5 flex-grow" />

            {/* Skills & Portfolio info */}
            <div className="mt-4 pt-4 border-t border-slate-50">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Compétences clés :
              </span>
              <div className="flex flex-wrap gap-1">
                {prov.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-100"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio realization books */}
            {prov.portfolio && prov.portfolio.length > 0 && (
              <div className="mt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Galerie réalisations :
                </span>
                <div className="flex flex-wrap gap-2">
                  {prov.portfolio.map((imgUrl, idx) => (
                    <button key={idx} type="button" aria-label={`Agrandir la réalisation ${idx + 1} de ${prov.name}`} onClick={() => setLightbox({ images: prov.portfolio || [], index: idx, alt: `Réalisation de ${prov.name}` })} className="cursor-zoom-in overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600">
                      <img src={imgUrl} alt={`Réalisation ${idx + 1} de ${prov.name}`} referrerPolicy="no-referrer" className="h-12 w-16 border border-slate-100 object-cover transition-transform hover:scale-105" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Rate & CTA */}
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Tarif</span>
                <span className="block break-words font-display text-sm font-bold text-slate-900">
                  {prov.priceRate}
                </span>
                <span className={`mt-1 block text-[10px] font-semibold ${prov.priceNegotiable ? "text-emerald-600" : "text-slate-400"}`}>
                  {prov.priceNegotiable ? "Prix négociable" : "Prix fixe"}
                </span>
              </div>

              <button
                onClick={() => setSelectedProvider(prov)}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 sm:w-auto sm:py-2"
              >
                Prendre RDV
              </button>
            </div>
          </div>
        ))}
        {filteredProviders.length === 0 && (
          <p className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Aucun prestataire ne correspond à votre recherche.
          </p>
        )}
      </div>

      {/* Appointment Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProvider(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-10 my-0 w-full max-w-md max-h-[calc(100dvh-1rem)] overscroll-contain overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3 sm:gap-4">
                <button type="button" aria-label={`Agrandir la photo de ${selectedProvider.name}`} onClick={() => setLightbox({ images: [selectedProvider.avatarUrl], alt: selectedProvider.name })} className="shrink-0 cursor-zoom-in rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600">
                  <img src={selectedProvider.avatarUrl} alt={selectedProvider.name} referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
                </button>
                <div className="min-w-0">
                  <h3 className="break-words font-display text-lg font-bold text-slate-900">
                    Prendre RDV avec {selectedProvider.name}
                  </h3>
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">
                    {selectedProvider.specialty}
                  </p>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-800">
                    Rendez-vous réservé !
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    {selectedProvider.name} vous contactera rapidement pour organiser l'intervention.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4 [&_input]:py-2.5 [&_select]:py-2.5 [&_textarea]:py-2.5">
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Vos coordonnées
                    </p>
                    <p className="text-xs font-semibold text-slate-800">{session.fullName || "Client"}</p>
                    {session.email && <p className="text-[11px] text-slate-500">{session.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Numéro WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +243 85 70 68 014"
                      value={clientWhatsApp}
                      onChange={(e) => setClientWhatsApp(normalizePhoneInput(e.target.value))}
                      className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-orange-500"
                    />
                    {phoneError && <p role="alert" className="mt-1 text-[11px] text-red-700">{phoneError}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Lieu
                      </label>
                      <select
                        value={serviceLocationType}
                        onChange={(e) => setServiceLocationType(e.target.value as "Maison" | "Entreprise")}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option value="Maison">Maison</option>
                        <option value="Entreprise">Entreprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Adresse complète d'intervention
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Rue, numéro, commune, ville"
                        value={serviceAddress}
                        onChange={(e) => setServiceAddress(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Date d'intervention
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Heure idéale
                      </label>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Consignes ou demandes spécifiques
                    </label>
                    <textarea
                      placeholder="Ex: Précisez vos attentes, l'adresse exacte d'intervention, s'il y a des animaux..."
                      rows={3}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(null)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 sm:w-auto"
                    >
                      Réserver le rendez-vous
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Lightbox images={lightbox?.images || []} initialIndex={lightbox?.index} alt={lightbox?.alt} isOpen={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}
