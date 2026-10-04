import { useState, useEffect, useCallback } from "react";
import { Property, Vehicle, VehicleSale, Chauffeur, SecondaryProvider, Booking, UserSession } from "./types";
import Header from "./components/Header";
import AboutSection from "./components/AboutSection";
import LoginModal from "./components/LoginModal";
import OnboardingPortal from "./components/OnboardingPortal";
import BookingsTracker from "./components/BookingsTracker";
import ProfessionalProfileModal from "./components/ProfessionalProfileModal";
import {
  RealEstateView,
  CarRentalView,
  ChauffeurView,
  SecondaryServicesView,
} from "./components/ServiceViews";
import {
  getProperties,
  getVehicles,
  getVehicleSales,
  getChauffeurs,
  getProviders,
  getBookings,
  subscribeToBookings,
  addBooking as firebaseAddBooking,
  cancelBooking as firebaseCancelBooking,
  acknowledgeBooking as firebaseAcknowledgeBooking,
  onboardProfessional,
  createPropertyBooking,
  submitBookingReview as firebaseSubmitBookingReview,
  logoutCurrentUser,
  refreshProfessionalSession,
} from "./lib/firebase";
import TermsModal from "./components/TermsModal";
import SupportChatModal from "./components/SupportChatModal";
import PropertySubmissionModal from "./components/PropertySubmissionModal";
import PartnershipModal from "./components/PartnershipModal";
import VehicleSubmissionModal from "./components/VehicleSubmissionModal";
import GoogleTranslateBootstrap from "./components/GoogleTranslateBootstrap";
import SplashScreen from "./components/SplashScreen";
import { CatalogLoadingState, DataErrorState } from "./components/DataLoadingState";
import {
  Home as HomeIcon,
  Car,
  Compass,
  ArrowRight,
  ShieldCheck,
  Star,
  Sparkles,
  Users,
  Briefcase,
  AlertCircle,
  Clock,
  Heart,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Application Data States (for dynamic interactive modification)
  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSales, setVehicleSales] = useState<VehicleSale[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [providers, setProviders] = useState<SecondaryProvider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isVehicleSalesLoading, setIsVehicleSalesLoading] = useState(true);
  const [vehicleSalesError, setVehicleSalesError] = useState<string | null>(null);

  // Navigation State
  const [activeView, setActiveView] = useState<
    "home" | "immobilier" | "automobile" | "chauffeur" | "autres-services" | "onboarding-pro"
  >("home");

  // User Authentication State (loaded from localStorage with dynamic safety)
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const stored = localStorage.getItem("goying_session");
      if (stored) {
        const savedSession = JSON.parse(stored) as UserSession;
        if (savedSession.email === "invite@goying.com") {
          localStorage.removeItem("goying_session");
        } else {
          return savedSession;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      isLoggedIn: false,
      email: "",
      fullName: "",
      role: "client",
    };
  });

  // UI Modal / Notification States
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isProfessionalProfileOpen, setIsProfessionalProfileOpen] = useState(false);
  const [commissionerAlert, setCommissionerAlert] = useState(false);
  const [bookingToast, setBookingToast] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPropertySubmissionOpen, setIsPropertySubmissionOpen] = useState(false);
  const [isVehicleSubmissionOpen, setIsVehicleSubmissionOpen] = useState(false);
  const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);
  const [showSubmissionPrompt, setShowSubmissionPrompt] = useState(false);

  const loadCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const [pList, vList, cList, provList] = await Promise.all([
        getProperties(),
        getVehicles(),
        getChauffeurs(),
        getProviders(),
      ]);
      setProperties(pList);
      setVehicles(vList);
      setChauffeurs(cList);
      setProviders(provList);
    } catch (error) {
      console.error("Error loading the catalog:", error);
      setCatalogError(error instanceof Error ? error.message : "La connexion aux données a échoué. Vérifiez votre réseau puis réessayez.");
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const loadVehicleSales = useCallback(async () => {
    setIsVehicleSalesLoading(true);
    setVehicleSalesError(null);
    try {
      setVehicleSales(await getVehicleSales());
    } catch (error) {
      console.error("Error loading vehicle sales:", error);
      setVehicleSalesError(error instanceof Error ? error.message : "Les véhicules à vendre n'ont pas pu être chargés.");
    } finally {
      setIsVehicleSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicleSales();
  }, [loadVehicleSales]);

  const loadBookings = useCallback(async (userId: string) => {
    setIsBookingsLoading(true);
    setBookingsError(null);
    try {
      setBookings(await getBookings(userId));
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookingsError(error instanceof Error ? error.message : "Vos réservations n'ont pas pu être chargées.");
    } finally {
      setIsBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session.isLoggedIn || !session.uid) {
      setBookings([]);
      setBookingsError(null);
      setIsBookingsLoading(false);
      return;
    }
    void loadBookings(session.uid);
    return subscribeToBookings(session.uid, setBookings, (error) => {
      console.error("Booking subscription failed:", error);
      setBookingsError("La mise à jour de vos réservations a échoué. Réessayez dans quelques instants.");
    });
  }, [loadBookings, session.isLoggedIn, session.uid]);

  // Persist session to localStorage
  useEffect(() => {
    if (session.isLoggedIn) {
      localStorage.setItem("goying_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("goying_session");
    }
  }, [session]);

  useEffect(() => {
    if (!session.isLoggedIn || session.role !== "prestataire") return;
    let active = true;
    void refreshProfessionalSession(session)
      .then((refreshedSession) => {
        if (active) setSession((current) =>
          current.providerStatus === refreshedSession.providerStatus &&
          current.providerListing?.id === refreshedSession.providerListing?.id
            ? current
            : refreshedSession
        );
      })
      .catch((error) => console.error("Professional status refresh failed:", error));
    return () => { active = false; };
  }, [session.isLoggedIn, session.role, session.uid, session.providerStatus, session.providerListing?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (activeView === "home" && !showSubmissionPrompt && !isLoginOpen && !isBookingsOpen && !isProfessionalProfileOpen && !isPropertySubmissionOpen && !isAboutOpen && !isTermsOpen && !isSupportOpen) {
        setShowSubmissionPrompt(true);
      }
    }, 120000);
    return () => window.clearInterval(timer);
  }, [activeView, isAboutOpen, isBookingsOpen, isLoginOpen, isProfessionalProfileOpen, isPropertySubmissionOpen, isSupportOpen, isTermsOpen, showSubmissionPrompt]);

  // Handle Dynamic Bookings Addition
  const handleAddBooking = async (newBooking: Booking) => {
    if (!session.isLoggedIn || !session.uid) {
      throw new Error("Connectez-vous à votre compte pour effectuer une réservation.");
    }
    if (session.role === "prestataire" && newBooking.providerId === session.providerListing?.id) {
      throw new Error("Vous ne pouvez pas prendre rendez-vous avec votre propre profil prestataire.");
    }

    // Save to Firestore
    await firebaseAddBooking(newBooking);

    if (newBooking.providerId && newBooking.providerCollection) {
      if (newBooking.providerCollection === "chauffeurs") {
        setChauffeurs((prev) => prev.map((provider) =>
          provider.id === newBooking.providerId ? { ...provider, status: "indisponible" } : provider
        ));
      } else {
        setProviders((prev) => prev.map((provider) =>
          provider.id === newBooking.providerId ? { ...provider, status: "indisponible" } : provider
        ));
      }
    }

    setBookingToast(`Réservation ajoutée ! Retrouvez "${newBooking.itemName}" dans votre suivi.`);
    setTimeout(() => setBookingToast(null), 4000);
  };

  // Handle Cancellation
  const handleCancelBooking = async (id: string) => {
    const cancelledBooking = bookings.find((booking) => booking.id === id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    await firebaseCancelBooking(id);
    if (cancelledBooking?.providerId && cancelledBooking.providerCollection) {
      const updateProvider = cancelledBooking.providerCollection === "chauffeurs"
        ? (provider: Chauffeur) => provider.id === cancelledBooking.providerId ? { ...provider, status: "disponible" as const } : provider
        : undefined;
      if (updateProvider) setChauffeurs((prev) => prev.map(updateProvider));
      else setProviders((prev) => prev.map((provider) => provider.id === cancelledBooking.providerId ? { ...provider, status: "disponible" } : provider));
    }
  };

  const handleAcknowledgeBooking = async (id: string) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== id));
    try {
      await firebaseAcknowledgeBooking(id);
    } catch (err) {
      console.error("Error acknowledging booking:", err);
    }
  };

  const handleSubmitBookingReview = async (booking: Booking, rating: number, comment: string) => {
    const result = await firebaseSubmitBookingReview(booking.id, rating, comment);
    setBookings((previous) => previous.map((item) =>
      item.id === booking.id ? { ...item, reviewedAt: new Date().toISOString() } : item
    ));
    if (booking.providerId && booking.providerCollection) {
      if (booking.providerCollection === "chauffeurs") {
        setChauffeurs((previous) => previous.map((provider) =>
          provider.id === booking.providerId ? { ...provider, ...result } : provider
        ));
      } else {
        setProviders((previous) => previous.map((provider) =>
          provider.id === booking.providerId ? { ...provider, ...result } : provider
        ));
      }
    }
  };


  // Handle dynamic professional onboarding registration
  const handleRegisterProfessional = async (
    newSession: UserSession,
    newDriver?: Chauffeur,
    newServiceProv?: SecondaryProvider,
    password?: string
  ) => {
    // Save to Firestore
    const registeredSession = await onboardProfessional(newSession, password || "", newDriver, newServiceProv);
    setSession({ ...registeredSession, providerStatus: "En attente" });
  };

  const handleCommissionnaireClick = () => {
    setCommissionerAlert(true);
    setTimeout(() => {
      setCommissionerAlert(false);
    }, 4500);
  };

  const handleSplashComplete = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  if (isSplashVisible) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased flex flex-col" id="goying-app-root">
      <GoogleTranslateBootstrap />
      {/* Dynamic Overlay Notification (Toast) */}
      <AnimatePresence>
        {bookingToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl border border-slate-800 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-orange-400 shrink-0" />
                <span>{bookingToast}</span>
              </span>
              <button onClick={() => setBookingToast(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {commissionerAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="rounded-2xl bg-orange-600 px-4 py-3 text-xs font-semibold text-white shadow-xl border border-orange-500 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-white shrink-0" />
                <span>Ce service sera bientôt disponible ! Notre équipe finalise ce module.</span>
              </span>
              <button onClick={() => setCommissionerAlert(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Navigation Bar */}
      <Header
        session={session}
        bookings={bookings}
        onNavigateHome={() => setActiveView("home")}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          void logoutCurrentUser().catch((error) => console.error("Firebase sign-out failed:", error));
          setBookings([]);
          setSession({ isLoggedIn: false, email: "", fullName: "", role: "client" });
          setActiveView("home");
        }}
        onOpenBookings={() => setIsBookingsOpen(true)}
        onOpenOnboarding={() => setActiveView("onboarding-pro")}
        onOpenProfile={() => setIsProfessionalProfileOpen(true)}
        onOpenPropertySubmission={() => session.isLoggedIn ? setIsPropertySubmissionOpen(true) : setIsLoginOpen(true)}
      />

      {/* Main Content Render */}
      <main className="flex-grow pt-16">
        <AnimatePresence mode="wait">
          {activeView === "home" && (
            <motion.div
              key="view-home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero Banner Section */}
              <section className="relative overflow-hidden bg-white py-16 sm:py-24 border-b border-slate-100" id="hero-section">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="text-center space-y-6 max-w-3xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      <span>Votre quotidien simplifié, au meilleur tarif</span>
                    </div>

                    <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                      Simplifiez vos besoins locaux avec{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Goying
                      </span>
                    </h1>

                    <p className="mx-auto max-w-xl text-sm sm:text-base text-slate-500 leading-relaxed">
                      Trouvez une maison, louez une voiture ou engagez des professionnels qualifiés et certifiés. Une plateforme unique pour tous vos besoins de confiance.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                      <button
                        onClick={() => setActiveView("autres-services")}
                        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        Voir d'autres services
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setIsAboutOpen(true)}
                        className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        En savoir plus
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtle backgrounds */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 h-72 w-72 rounded-full bg-blue-400/5 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 right-0 -translate-y-1/2 h-72 w-72 rounded-full bg-orange-400/5 blur-3xl pointer-events-none" />
              </section>

              {/* Major Grid Services Catalog */}
              <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="major-services-grid">
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                    Nos Services Majeurs
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Explorez nos quatre piliers de solutions rapides et sécurisées pour votre confort quotidien.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Trouver une maison */}
                  <div
                    id="service-card-immobilier"
                    onClick={() => setActiveView("immobilier")}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 shadow-inner">
                        <HomeIcon className="h-6 w-6" />
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Trouver une maison
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        Achat ou location d'appartements, de duplexes et d'espaces professionnels de standing.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-blue-600">
                      <span>Espace Immobilier</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Card 2: Louer une voiture */}
                  <div
                    id="service-card-automobile"
                    onClick={() => setActiveView("automobile")}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 shadow-inner">
                        <Car className="h-6 w-6" />
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Louer une voiture
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        Citadines maniables, berlines tout confort ou SUV familiaux pour tous vos voyages.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-emerald-600">
                      <span>Espace Automobile</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Card 3: Trouver un chauffeur */}
                  <div
                    id="service-card-chauffeur"
                    onClick={() => setActiveView("chauffeur")}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5 shadow-inner">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Trouver un chauffeur
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        Répertoire de conducteurs professionnels, ponctuels et certifiés pour vos trajets quotidiens.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-600">
                      <span>Conducteurs certifiés</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Card 4: Espace Commissionnaire (DISABLED / SOON) */}
                  <div
                    id="service-card-commissionnaire"
                    onClick={handleCommissionnaireClick}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/50 p-5 opacity-70 transition-all duration-300 hover:shadow-md flex flex-col justify-between relative"
                  >
                    <span className="absolute top-4 right-4 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                      Bientôt dispo
                    </span>
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-5 shadow-inner">
                        <Compass className="h-6 w-6" />
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-400">
                        Espace Commissionnaire
                      </h3>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                        Négociateurs de premier choix et intermédiaires agréés pour sécuriser vos transactions.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>En cours de développement</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Services Callout Button */}
                <div className="mt-12 text-center">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">
                    Besoin d'autres compétences ?
                  </p>
                  <button
                    onClick={() => setActiveView("autres-services")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600 shadow-md shadow-orange-100 transition-colors"
                  >
                    Découvrir d'autres services à la personne
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>

              {/* Security & trust section */}
              <section className="bg-white border-t border-b border-slate-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="grid gap-8 md:grid-cols-3">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Prestataires Qualifiés</h4>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          Chaque prestataire inscrit sur Goying fait l'objet d'un audit de sa pièce d'identité et de ses compétences.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Gain de temps</h4>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          Plus besoin de chercher des heures. Réservez une voiture, planifiez une visite immobilière ou trouvez un cours de soutien scolaire en quelques clics.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                        <Heart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Confiance Mutuelle</h4>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          Évaluez vos prestations et facilitez le quotidien des professionnels tout comme des clients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeView === "immobilier" && (
            <motion.div
              key="view-immobilier"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
            >
              <button
                onClick={() => setActiveView("home")}
                className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 gap-1"
              >
                ← Retour Accueil
              </button>
              {isCatalogLoading && properties.length === 0 ? <CatalogLoadingState label="des maisons" /> :
                catalogError && properties.length === 0 ? <DataErrorState message={catalogError} onRetry={() => void loadCatalog()} /> :
                  <RealEstateView
                    properties={properties}
                    session={session}
                    onRequireLogin={() => setIsLoginOpen(true)}
                    onBookProperty={async (input) => {
                      await createPropertyBooking(input);
                      setBookingToast("Demande immobilière enregistrée. Retrouvez-la dans votre suivi.");
                      setTimeout(() => setBookingToast(null), 4000);
                    }}
                  />}
            </motion.div>
          )}

          {activeView === "automobile" && (
            <motion.div
              key="view-automobile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
            >
              <button
                onClick={() => setActiveView("home")}
                className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 gap-1"
              >
                ← Retour Accueil
              </button>
              {isCatalogLoading && vehicles.length === 0 ? <CatalogLoadingState label="des voitures" /> :
                catalogError && vehicles.length === 0 ? <DataErrorState message={catalogError} onRetry={() => void loadCatalog()} /> :
                  <CarRentalView
                    vehicles={vehicles}
                    onAddBooking={handleAddBooking}
                    onRequireLogin={() => setIsLoginOpen(true)}
                    onOpenVehicleSubmission={() => session.isLoggedIn ? setIsVehicleSubmissionOpen(true) : setIsLoginOpen(true)}
                    vehicleSales={vehicleSales}
                    isVehicleSalesLoading={isVehicleSalesLoading}
                    vehicleSalesError={vehicleSalesError}
                    onRetryVehicleSales={() => void loadVehicleSales()}
                    session={session}
                  />}
            </motion.div>
          )}

          {activeView === "chauffeur" && (
            <motion.div
              key="view-chauffeur"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
            >
              <button
                onClick={() => setActiveView("home")}
                className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 gap-1"
              >
                ← Retour Accueil
              </button>
              {isCatalogLoading && chauffeurs.length === 0 ? <CatalogLoadingState label="des chauffeurs" /> :
                catalogError && chauffeurs.length === 0 ? <DataErrorState message={catalogError} onRetry={() => void loadCatalog()} /> :
                  <ChauffeurView chauffeurs={chauffeurs} onAddBooking={handleAddBooking} onRequireLogin={() => setIsLoginOpen(true)} session={session} />}
            </motion.div>
          )}

          {activeView === "autres-services" && (
            <motion.div
              key="view-autres-services"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
            >
              <button
                onClick={() => setActiveView("home")}
                className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 gap-1"
              >
                ← Retour Accueil
              </button>
              {isCatalogLoading && providers.length === 0 ? <CatalogLoadingState label="des prestataires" /> :
                catalogError && providers.length === 0 ? <DataErrorState message={catalogError} onRetry={() => void loadCatalog()} /> :
                  <SecondaryServicesView
                    providers={providers}
                    onAddBooking={handleAddBooking}
                    onRequireLogin={() => setIsLoginOpen(true)}
                    session={session}
                  />}
            </motion.div>
          )}

          {activeView === "onboarding-pro" && (
            <motion.div
              key="view-onboarding"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <OnboardingPortal
                onClose={() => setActiveView("home")}
                onRegisterProfessional={(newSession, newDriver, newServiceProv, password) => {
                  return handleRegisterProfessional(newSession, newDriver, newServiceProv, password);
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Branding section */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-12" id="goying-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 font-display text-base font-bold text-white">
                  G
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-white">
                  Goying<span className="text-orange-500">.</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
                Première plateforme de confiance reliant besoins locaux et prestataires qualifiés.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
              <button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition-colors text-left">
                À propos de nous
              </button>
              <button onClick={() => setActiveView("onboarding-pro")} className="hover:text-white transition-colors text-left">
                Devenir Prestataire
              </button>
              <button onClick={() => setIsPartnershipOpen(true)} className="hover:text-white transition-colors text-left">
                Devenir partenaire
              </button>
              <button onClick={() => setIsTermsOpen(true)} className="hover:text-white transition-colors">
                Conditions Générales
              </button>
              <button onClick={() => setIsSupportOpen(true)} className="hover:text-white transition-colors">
                Support client
              </button>
              <button onClick={() => session.isLoggedIn ? setIsPropertySubmissionOpen(true) : setIsLoginOpen(true)} className="hover:text-white transition-colors">
                Soumettre une maison
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500">
            <p>© {new Date().getFullYear()} Goying Inc. Tous droits réservés.</p>
            <p className="mt-2 sm:mt-0">Fait avec excellence pour un quotidien simplifié.</p>
          </div>
        </div>
      </footer>

      {/* Overlay Modals */}
      <AboutSection isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <SupportChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <PropertySubmissionModal
        isOpen={isPropertySubmissionOpen}
        onClose={() => setIsPropertySubmissionOpen(false)}
        reporterName={session.fullName}
        reporterPhone={session.phone || ""}
      />
      <PartnershipModal isOpen={isPartnershipOpen} onClose={() => setIsPartnershipOpen(false)} />
      <VehicleSubmissionModal isOpen={isVehicleSubmissionOpen} onClose={() => setIsVehicleSubmissionOpen(false)} session={session} />
      {showSubmissionPrompt && !isPropertySubmissionOpen && (
        <div className="fixed bottom-5 right-5 z-40 max-w-xs rounded-2xl border border-orange-100 bg-white p-4 shadow-xl">
          <button aria-label="Fermer" onClick={() => setShowSubmissionPrompt(false)} className="absolute right-2 top-2 text-slate-400"><X className="h-4 w-4" /></button>
          <p className="pr-4 text-sm font-bold text-slate-800">Vous connaissez une maison à louer ou à vendre ?</p>
          <p className="mt-1 text-xs text-slate-600">Soumettez-la sur Goying et découvrez les conditions pour recevoir une commission.</p>
          <button onClick={() => { setShowSubmissionPrompt(false); session.isLoggedIn ? setIsPropertySubmissionOpen(true) : setIsLoginOpen(true); }} className="mt-2 text-xs font-bold text-orange-600">Soumettre une maison</button>
        </div>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(newSession) => setSession(newSession)}
        onOpenOnboarding={() => {
          setIsLoginOpen(false);
          setActiveView("onboarding-pro");
        }}
      />

      <BookingsTracker
        isOpen={isBookingsOpen}
        bookings={bookings}
        isLoading={isBookingsLoading}
        error={bookingsError}
        onClose={() => setIsBookingsOpen(false)}
        onRetry={() => session.uid && void loadBookings(session.uid)}
        onCancelBooking={handleCancelBooking}
        onAcknowledgeBooking={handleAcknowledgeBooking}
        onSubmitReview={handleSubmitBookingReview}
      />

      <ProfessionalProfileModal
        isOpen={isProfessionalProfileOpen}
        session={session}
        onClose={() => setIsProfessionalProfileOpen(false)}
        onSaved={setSession}
      />
    </div>
  );
}
