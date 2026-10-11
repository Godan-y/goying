import React, { useState } from "react";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";
import {
  Briefcase,
  Car,
  Sparkles,
  BookOpen,
  Home as HomeIcon,
  Scissors,
  ArrowLeft,
  CheckCircle,
  FileText,
  DollarSign,
  Phone,
  Compass,
  Clock,
  AlertCircle,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Chauffeur, SecondaryProvider, UserSession } from "../types";

interface OnboardingPortalProps {
  onClose: () => void;
  onRegisterProfessional: (
    session: UserSession,
    newDriver?: Chauffeur,
    newServiceProv?: SecondaryProvider,
    password?: string,
    portfolioImages?: File[]
  ) => Promise<void>;
}

export default function OnboardingPortal({
  onClose,
  onRegisterProfessional,
}: OnboardingPortalProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Form Fields
  const [nom, setNom] = useState("");
  const [postNom, setPostNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [country, setCountry] = useState("RDC");
  const [city, setCity] = useState("Kinshasa");
  const [commune, setCommune] = useState("");

  // Specialty Specific Fields
  const [driverLicense, setDriverLicense] = useState("");
  const [carModel, setCarModel] = useState("");
  const [driverServiceType, setDriverServiceType] = useState<"Chauffeur privé" | "Taxi" | "Les deux">("Chauffeur privé");
  const [driverTransmission, setDriverTransmission] = useState<"Automatique" | "Manuelle" | "Les deux">("Les deux");
  const [pricePerMonth, setPricePerMonth] = useState(350);
  const [driverPriceNegotiable, setDriverPriceNegotiable] = useState(false);

  const [housekeeperSkills, setHousekeeperSkills] = useState("");
  const [housekeeperPrice, setHousekeeperPrice] = useState(250);
  const [housekeeperPriceNegotiable, setHousekeeperPriceNegotiable] = useState(false);

  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [hairdresserPrice, setHairdresserPrice] = useState(25);
  const [hairdresserPriceNegotiable, setHairdresserPriceNegotiable] = useState(false);

  const [makeupPrice, setMakeupPrice] = useState(40);
  const [makeupPriceNegotiable, setMakeupPriceNegotiable] = useState(false);

  const [tutorDegree, setTutorDegree] = useState("");
  const [tutorSubject, setTutorSubject] = useState("");
  const [tutorPrice, setTutorPrice] = useState(300);
  const [tutorPriceNegotiable, setTutorPriceNegotiable] = useState(false);

  const specialtiesList = [
    {
      id: "chauffeur",
      title: "Chauffeur Privé",
      desc: "Conduisez des clients ou gérez des transferts d'aéroport.",
      icon: Car,
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      textColor: "text-blue-700",
      active: true,
    },
    {
      id: "menagere",
      title: "Ménager / Ménagère",
      desc: "Entretien de maisons, repassage et rangement.",
      icon: HomeIcon,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700",
      active: true,
    },
    {
      id: "coiffeur",
      title: "Coiffeur / Coiffeuse",
      desc: "Coupes de cheveux, soins capillaires et coiffage à domicile.",
      icon: Scissors,
      color: "from-purple-500 to-fuchsia-600",
      bg: "bg-purple-50",
      textColor: "text-purple-700",
      active: true,
    },
    {
      id: "maquilleuse",
      title: "Maquilleuse / Make-up",
      desc: "Maquillage événementiel, mariage ou shooting photo.",
      icon: Sparkles,
      color: "from-pink-500 to-rose-600",
      bg: "bg-pink-50",
      textColor: "text-pink-700",
      active: true,
    },
    {
      id: "professeur",
      title: "Professeur à domicile",
      desc: "Soutien scolaire, cours de langues, de musique ou sciences.",
      icon: BookOpen,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      textColor: "text-amber-700",
      active: true,
    },
    {
      id: "commissionnaire",
      title: "Commissionnaire",
      desc: "Négociateur de transactions et courtiers.",
      icon: Compass,
      color: "from-slate-400 to-slate-500",
      bg: "bg-slate-100",
      textColor: "text-slate-500",
      active: false, // Bientôt disponible !
    },
  ];

  const fullFullName = [nom, postNom, prenom].filter(Boolean).join(" ") || nom || "Prestataire";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError("");

    if (!nom || !prenom || !email || !password || !phone) {
      alert("Veuillez renseigner votre Nom, Prénom, Email, Mot de passe et Téléphone.");
      return;
    }
    const internationalPhone = toInternationalPhone(phone);
    if (!internationalPhone) {
      setSubmitError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }

    const session: UserSession = {
      isLoggedIn: true,
      email: email,
      fullName: fullFullName,
      role: "prestataire",
      specialty: selectedSpecialty || "Général",
      providerStatus: "En attente",
      phone: internationalPhone,
    };

    let newDriver: Chauffeur | undefined;
    let newServiceProv: SecondaryProvider | undefined;

    // Construct dynamically added pro
    const uniqueId = `dyn-pro-${Date.now()}`;
    const formattedBio = bio || "Prestataire qualifié et certifié par Goying.";

    if (selectedSpecialty === "chauffeur") {
      newDriver = {
        id: uniqueId,
        name: fullFullName,
        avatarUrl: "",
        rating: 5.0,
        reviewsCount: 1,
        pricePerMonth,
        currency: "$",
        priceNegotiable: driverPriceNegotiable,
        vehicleModel: carModel || "Berline Classique",
        serviceType: driverServiceType,
        transmission: driverTransmission,
        experienceYears: experienceYears,
        skills: [],
        country,
        city,
        commune,
        zones: [city, "Aéroport local"],
        bio: `${formattedBio} Permis de conduire : ${driverLicense}.`,
        verified: false, // En attente de validation
        status: "disponible",
        phone: internationalPhone,
        managementMode: "admin",
      };
    } else if (
      selectedSpecialty === "menagere" ||
      selectedSpecialty === "coiffeur" ||
      selectedSpecialty === "professeur" ||
      selectedSpecialty === "maquilleuse"
    ) {
      let priceRate = "";
      let skills: string[] = [];

      switch (selectedSpecialty) {
        case "menagere":
          priceRate = `${housekeeperPrice}$ / mois`;
          skills = housekeeperSkills
            ? housekeeperSkills.split(",").map((s) => s.trim())
            : ["Ménage", "Repassage", "Entretien quotidien"];
          break;
        case "coiffeur":
          priceRate = `à partir de $${hairdresserPrice}`;
          skills = ["Brushing", "Coiffure à domicile", "Soins"];
          break;
        case "maquilleuse":
          priceRate = `à partir de $${makeupPrice}`;
          skills = ["Teint impeccable", "Glow", "Mariage"];
          break;
        case "professeur":
          priceRate = `${tutorPrice}$ / mois`;
          skills = [
            tutorSubject || "Soutien scolaire",
            tutorDegree || "Enseignant certifié",
          ];
          break;
      }

      newServiceProv = {
        id: uniqueId,
        name: fullFullName,
        specialty: selectedSpecialty as "ménagère" | "coiffeur" | "professeur" | "maquilleuse",
        avatarUrl: "",
        rating: 5.0,
        reviewsCount: 1,
        priceRate: priceRate,
        priceNegotiable:
          selectedSpecialty === "menagere"
            ? housekeeperPriceNegotiable
            : selectedSpecialty === "coiffeur"
              ? hairdresserPriceNegotiable
              : selectedSpecialty === "maquilleuse"
                ? makeupPriceNegotiable
                : tutorPriceNegotiable,
        bio: formattedBio,
        location: `${city} & alentours`,
        country,
        city,
        commune,
        verified: false, // En attente de validation
        status: "disponible",
        skills: skills,
        experienceYears: experienceYears,
        managementMode: selectedSpecialty === "menagere" ? "admin" : "provider",
      };
    }

    setIsSubmitting(true);
    try {
      await onRegisterProfessional(session, newDriver, newServiceProv, password, portfolioImages);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting professional application:", error);
      setSubmitError(
        error instanceof Error
          ? `Votre dossier n'a pas pu être envoyé : ${error.message}`
          : "Votre dossier n'a pas pu être envoyé. Vérifiez votre connexion puis réessayez."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8" id="onboarding-submitted-view">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
        >
          {/* Header Bannière */}
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                <Clock className="h-9 w-9 animate-pulse" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  <ShieldCheck className="h-3.5 w-3.5" /> Dossier Réceptionné
                </span>
                <h2 className="mt-2 break-words text-2xl font-bold font-display leading-tight sm:text-3xl">
                  Votre dossier est en cours de traitement pour être validé
                </h2>
                <p className="mt-1 break-words text-sm text-orange-50">
                  Candidat(e) : <strong>{fullFullName}</strong> • Spécialité : <strong className="capitalize">{selectedSpecialty}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm shadow-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-slate-900">
                    Frais de traitement & activation : 10.000 FC
                  </h4>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                    Payez avec le même nom complet et le même numéro WhatsApp que ceux indiqués dans votre demande.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://vceccwzb.mychariow.shop/prd_w26ss0yl"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-orange-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-500 active:scale-[0.98] sm:text-base"
              >
                <DollarSign className="h-5 w-5" />
                Payer avec Chariow
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Retourner à l'accueil
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-sm font-semibold text-slate-800">
                Merci pour votre confiance.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Votre demande est en attente de vérification. Nous confirmerons votre profil après vérification manuelle du paiement.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation retour */}
      <button
        onClick={onClose}
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Retour à l'accueil
      </button>

      {/* Header section */}
      <div className="mb-10 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-3 border border-orange-100">
          <Briefcase className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Espace Prestataire Goying
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
          Développez votre activité en proposant vos services à des milliers de clients locaux.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedSpecialty ? (
          /* SECTION 1: SELECTION DE LA SPECIALITE */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
            id="onboarding-step-1"
          >
            <div className="text-center mb-6">
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Étape 1 : Choisissez votre métier
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specialtiesList.map((spec) => {
                const IconComp = spec.icon;
                return (
                  <div
                    key={spec.id}
                    id={`specialty-card-${spec.id}`}
                    onClick={() => {
                      if (spec.active) {
                        setSelectedSpecialty(spec.id);
                      }
                    }}
                    className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                      spec.active
                        ? "cursor-pointer border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5"
                        : "border-slate-100 bg-slate-50/70 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {/* Badge "Bientôt dispo" */}
                    {!spec.active && (
                      <span className="absolute top-3 right-3 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Bientôt disponible
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${spec.color} text-white mb-4 shadow-md`}>
                      <IconComp className="h-6 w-6" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{spec.title}</h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{spec.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* SECTION 2: FORMULAIRE PERSONNALISE */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl md:p-8"
            id="onboarding-step-2"
          >
            {/* Header Form */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">
                    Formulaire d'inscription : {selectedSpecialty}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Complétez vos coordonnées et compétences pour soumettre votre dossier.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSpecialty(null)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Changer de métier
              </button>
            </div>

            {/* Inscription Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations Générales */}
              <div className="bg-slate-50/50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Identité & Contact</h4>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nom (Requis)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mukendi"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Post-nom</label>
                    <input
                      type="text"
                      placeholder="Ex: Tshilombo"
                      value={postNom}
                      onChange={(e) => setPostNom(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Prénom (Requis)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Eric"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Mot de passe de connexion</label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="6 caractères minimum"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    >
                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Ce mot de passe est sécurisé par Firebase et ne sera pas enregistré dans votre dossier.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Adresse Email</label>
                    <input
                      type="email"
                      required
                      placeholder="eric@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Téléphone / WhatsApp</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: +243 973199473"
                        value={phone}
                        onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">{internationalPhoneHint}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Pays d'activité (Requis)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: RDC"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Ville d'activité (Requis)</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Kinshasa">Kinshasa (RDC)</option>
                      <option value="Lubumbashi">Lubumbashi (RDC)</option>
                      <option value="Goma">Goma (RDC)</option>
                      <option value="Kolwezi">Kolwezi (RDC)</option>
                      <option value="Matadi">Matadi (RDC)</option>
                      <option value="Bukavu">Bukavu (RDC)</option>
                      <option value="Abidjan">Abidjan (Côte d'Ivoire)</option>
                      <option value="Dakar">Dakar (Sénégal)</option>
                      <option value="Douala">Douala (Cameroun)</option>
                      <option value="Paris">Paris (France)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Commune (Requis)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ngaliema"
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Années d'expérience professionnelle</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={40}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Présentation bio courte</label>
                    <textarea
                      placeholder="Décrivez vos compétences, votre sérieux et vos atouts..."
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* SPECIFIC FIELDS FOR CHAUFFEUR */}
              {selectedSpecialty === "chauffeur" && (
                <div className="bg-blue-50/30 rounded-2xl p-4 sm:p-5 border border-blue-100 space-y-4">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    2. Documents & Véhicule requis
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Numéro de Permis de Conduire (Requis)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: AB-123456-D"
                        value={driverLicense}
                        onChange={(e) => setDriverLicense(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Type de service</label>
                      <select
                        value={driverServiceType}
                        onChange={(e) => setDriverServiceType(e.target.value as "Chauffeur privé" | "Taxi" | "Les deux")}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Chauffeur privé">Chauffeur privé</option>
                        <option value="Taxi">Taxi</option>
                        <option value="Les deux">Chauffeur privé et taxi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Transmission</label>
                      <select
                        value={driverTransmission}
                        onChange={(e) => setDriverTransmission(e.target.value as "Automatique" | "Manuelle" | "Les deux")}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Automatique">Automatique</option>
                        <option value="Manuelle">Manuelle</option>
                        <option value="Les deux">Automatique et manuelle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Modèle de votre Véhicule
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Peugeot 508 / Toyota Camry"
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                        Tarif mensuel souhaité (USD)
                        <DollarSign className="h-3 w-3 text-slate-400" />
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        required
                        value={pricePerMonth}
                        onChange={(e) => setPricePerMonth(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={driverPriceNegotiable}
                        onChange={(e) => setDriverPriceNegotiable(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Prix négociable avec le client
                    </label>
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR MENAGERE */}
              {selectedSpecialty === "menagere" && (
                <div className="bg-emerald-50/30 rounded-2xl p-4 sm:p-5 border border-emerald-100 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    2. Compétences d'entretien de maison
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Compétences spéciales (séparées par une virgule)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Repassage de lin, Grand nettoyage, Nettoyage vitres"
                      value={housekeeperSkills}
                      onChange={(e) => setHousekeeperSkills(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Tarif mensuel demandé (USD)
                    </label>
                    <input
                      type="number"
                      required
                      value={housekeeperPrice}
                      onChange={(e) => setHousekeeperPrice(parseInt(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={housekeeperPriceNegotiable}
                      onChange={(e) => setHousekeeperPriceNegotiable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Prix négociable avec le client
                  </label>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR COIFFEUR */}
              {selectedSpecialty === "coiffeur" && (
                <div className="bg-purple-50/30 rounded-2xl p-4 sm:p-5 border border-purple-100 space-y-4">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    2. Portfolio & Spécialités capillaires
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Photos de vos réalisations
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => setPortfolioImages(Array.from(e.target.files || []))}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">JPEG, PNG ou WebP, 6 images maximum et 5 Mo par image.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Tarif de base estimé pour une coupe (EUR)
                    </label>
                    <input
                      type="number"
                      required
                      value={hairdresserPrice}
                      onChange={(e) => setHairdresserPrice(parseInt(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={hairdresserPriceNegotiable}
                      onChange={(e) => setHairdresserPriceNegotiable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Prix négociable avec le client
                  </label>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR MAQUILLEUSE */}
              {selectedSpecialty === "maquilleuse" && (
                <div className="bg-pink-50/30 rounded-2xl p-4 sm:p-5 border border-pink-100 space-y-4">
                  <h4 className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    2. Univers Beauté & Maquillage
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Photos de votre book maquillage
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => setPortfolioImages(Array.from(e.target.files || []))}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">JPEG, PNG ou WebP, 6 images maximum et 5 Mo par image.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Tarif de base maquillage événementiel (EUR)
                    </label>
                    <input
                      type="number"
                      required
                      value={makeupPrice}
                      onChange={(e) => setMakeupPrice(parseInt(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={makeupPriceNegotiable}
                      onChange={(e) => setMakeupPriceNegotiable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                    />
                    Prix négociable avec le client
                  </label>
                </div>
              )}

              {/* SPECIFIC FIELDS FOR PROFESSEUR */}
              {selectedSpecialty === "professeur" && (
                <div className="bg-amber-50/30 rounded-2xl p-4 sm:p-5 border border-amber-100 space-y-4">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    2. Diplômes & Matières enseignées
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Plus haut diplôme universitaire (Requis)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Licence, Master 2, etc."
                        value={tutorDegree}
                        onChange={(e) => setTutorDegree(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Matière(s) de prédilection
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mathématiques, Français, Anglais"
                        value={tutorSubject}
                        onChange={(e) => setTutorSubject(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Tarif mensuel proposé (USD)
                      </label>
                      <input
                        type="number"
                        required
                        value={tutorPrice}
                        onChange={(e) => setTutorPrice(parseInt(e.target.value) || 0)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={tutorPriceNegotiable}
                        onChange={(e) => setTutorPriceNegotiable(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      Prix négociable avec le client
                    </label>
                  </div>
                </div>
              )}

              {/* Notice frais de validation */}
              <div className="rounded-xl bg-orange-50/70 p-4 border border-orange-100 text-xs text-orange-950 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-orange-900">Procédure de validation de dossier</p>
                  <p className="mt-0.5 text-orange-800">
                    Des frais d'examen et d'activation de <strong>10.000 FC</strong> sont requis pour la vérification de vos pièces justificatives. Les instructions de paiement s'afficheront après soumission.
                  </p>
                  <p className="mt-2 font-semibold text-red-700">
                    Important : si les frais de traitement ne sont pas payés dans les deux jours suivant la soumission, votre dossier sera rejeté.
                  </p>
                </div>
              </div>

              {/* Conditions & Submit */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                {submitError && (
                  <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {submitError}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  En soumettant ce formulaire, vous certifiez sur l'honneur l'exactitude des informations fournies. L'équipe Goying effectue un audit systématique avant l'octroi du badge de prestataire certifié.
                </p>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialty(null)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Précédent
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-100 transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Envoi du dossier…" : "Soumettre mon dossier"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
