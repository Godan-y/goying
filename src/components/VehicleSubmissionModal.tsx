import { FormEvent, useEffect, useRef, useState } from "react";
import { Car, CheckCircle2, X } from "lucide-react";
import { submitVehicle, uploadVehicleSubmissionImage } from "../lib/firebase";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";
import { ACTIVITY_COUNTRIES, citiesForCountry, cityForArea } from "../lib/geography";
import { UserSession } from "../types";

interface VehicleSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
}

const initialForm = {
  ownerName: "", ownerPhone: "", address: "", preferredContact: "WhatsApp",
  brand: "", model: "", year: "", color: "", vehicleType: "Berline",
  transmission: "Automatique", fuel: "Essence", seats: "", mileage: "", condition: "Bon état",
  listingIntent: "À vendre", desiredPrice: "", pricePeriod: "Vente",
  additionalInformation: "", country: "", city: "", commune: "", visitAddress: "", availableDays: "", availableHours: "", locationComment: "",
  consent: false,
};

export default function VehicleSubmissionModal({ isOpen, onClose, session }: VehicleSubmissionModalProps) {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const requestId = useRef<string | null>(null);
  const availableCities = citiesForCountry(form.country);
  const selectedArea = cityForArea(form.country, form.city);

  useEffect(() => {
    if (isOpen && !submitted) {
      setForm((current) => ({ ...current, ownerName: current.ownerName || session.fullName, ownerPhone: current.ownerPhone || session.phone || "" }));
    }
  }, [isOpen, session.fullName, session.phone, submitted]);

  if (!isOpen) return null;

  const close = () => {
    if (submitting) return;
    setForm(initialForm);
    setPhotos([]);
    setError("");
    setSubmitted(false);
    requestId.current = null;
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const ownerPhone = toInternationalPhone(form.ownerPhone);
    if (!ownerPhone) {
      setError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }
    if (!form.consent) {
      setError("Vous devez accepter d'être contacté par l'équipe Goying.");
      return;
    }
    if (photos.length > 6) {
      setError("Vous pouvez ajouter au maximum 6 photos.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const photoUrls = await Promise.all(photos.map(uploadVehicleSubmissionImage));
      await submitVehicle({ ...form, ownerPhone, photoUrls, submissionRequestId: requestId.current });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "La demande n'a pas pu être envoyée.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: keyof typeof initialForm, value: string | boolean) => setForm({ ...form, [key]: value });
  const showPricePeriod = form.listingIntent !== "À vendre";

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={close} />
    <section className="relative z-10 max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="vehicle-submission-title">
      <button type="button" onClick={close} aria-label="Fermer" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      {submitted ? <div className="py-8 text-center sm:py-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-4 break-words text-xl font-bold text-slate-900">Votre demande a bien été envoyée</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Notre équipe vous contactera prochainement afin de convenir d’un rendez-vous pour vérifier le véhicule et recueillir les informations nécessaires.</p>
        <button type="button" onClick={close} className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white min-[360px]:w-auto">Fermer</button>
      </div> : <form onSubmit={submit} className="space-y-5">
        <div className="pr-10"><Car className="mb-2 h-7 w-7 text-emerald-600" /><h2 id="vehicle-submission-title" className="break-words text-xl font-bold text-slate-900">Soumettre mon véhicule</h2><p className="mt-1 break-words text-sm text-slate-500">Goying vous contacte et se déplace pour vérifier le véhicule, les documents et prendre les photos officielles avant toute annonce.</p></div>
        {error && <p role="alert" className="break-words rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <fieldset className="space-y-3"><legend className="text-sm font-bold text-slate-900">Informations du propriétaire</legend><div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom complet *" value={form.ownerName} onChange={(value) => update("ownerName", value)} />
          <Field label="Téléphone / WhatsApp *" type="tel" placeholder="+243 857068014" value={form.ownerPhone} onChange={(value) => update("ownerPhone", normalizePhoneInput(value))} />
          <Field label="Adresse ou quartier *" value={form.address} onChange={(value) => update("address", value)} />
          <Select label="Moyen de contact préféré *" value={form.preferredContact} onChange={(value) => update("preferredContact", value)} options={["WhatsApp", "Téléphone", "Email"]} />
        </div><p className="text-[11px] text-slate-500">{internationalPhoneHint}</p></fieldset>
        <fieldset className="space-y-3"><legend className="text-sm font-bold text-slate-900">Informations sur le véhicule</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Marque *" value={form.brand} onChange={(value) => update("brand", value)} />
          <Field label="Modèle *" value={form.model} onChange={(value) => update("model", value)} />
          <Field label="Année *" type="number" min="1900" max={String(new Date().getFullYear() + 1)} value={form.year} onChange={(value) => update("year", value)} />
          <Field label="Couleur *" value={form.color} onChange={(value) => update("color", value)} />
          <Select label="Type de véhicule *" value={form.vehicleType} onChange={(value) => update("vehicleType", value)} options={["Berline", "SUV", "Citadine", "Pick-up", "Utilitaire", "Moto", "Autre"]} />
          <Select label="Boîte de vitesses *" value={form.transmission} onChange={(value) => update("transmission", value)} options={["Automatique", "Manuelle"]} />
          <Select label="Carburant *" value={form.fuel} onChange={(value) => update("fuel", value)} options={["Essence", "Diesel", "Électrique", "Hybride"]} />
          <Field label="Nombre de places *" type="number" min="1" max="100" value={form.seats} onChange={(value) => update("seats", value)} />
          <Field label="Kilométrage approximatif *" type="number" min="0" value={form.mileage} onChange={(value) => update("mileage", value)} />
          <Select label="État général *" value={form.condition} onChange={(value) => update("condition", value)} options={["Excellent état", "Bon état", "État moyen", "À réparer"]} />
        </div></fieldset>
        <fieldset className="space-y-3"><legend className="text-sm font-bold text-slate-900">Type de demande</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Votre demande *" value={form.listingIntent} onChange={(value) => update("listingIntent", value)} options={["À vendre", "À louer", "Vente ou location"]} />
          <Field label={form.listingIntent === "À vendre" ? "Prix de vente souhaité *" : "Prix souhaité *"} type="number" min="0" value={form.desiredPrice} onChange={(value) => update("desiredPrice", value)} />
          {showPricePeriod && <Select label="Période de location *" value={form.pricePeriod} onChange={(value) => update("pricePeriod", value)} options={["Par jour", "Par semaine", "Par mois"]} />}
        </div></fieldset>
        <label className="block text-xs font-semibold text-slate-600">Informations complémentaires<textarea rows={3} maxLength={1500} value={form.additionalInformation} onChange={(event) => update("additionalInformation", event.target.value)} placeholder="État du moteur, entretien récent, documents disponibles ou autres particularités…" className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
        <label className="block text-xs font-semibold text-slate-600">Photos du véhicule <span className="font-normal text-slate-500">(facultatif)</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhotos(Array.from(event.target.files || []))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><span className="mt-1 block break-words font-normal leading-relaxed text-slate-500">Vous pouvez ajouter jusqu'à 6 photos (JPEG, PNG ou WebP, 5 Mo par photo). L’équipe Goying se déplacera pour prendre les photos officielles de l’annonce.</span></label>
        <fieldset className="space-y-3"><legend className="text-sm font-bold text-slate-900">Disponibilité pour une visite</legend><div className="grid gap-3 sm:grid-cols-2">
          <Select label="Pays *" value={form.country} onChange={(value) => setForm({ ...form, country: value, city: "", commune: "" })} options={ACTIVITY_COUNTRIES.map((country) => country.name)} placeholder="Sélectionnez votre pays" />
          <Select label="Ville *" value={form.city} onChange={(value) => setForm({ ...form, city: value, commune: "" })} options={availableCities.map((city) => city.name)} placeholder="Sélectionnez votre ville" disabled={!form.country} />
          {selectedArea?.subdivisions && <Select label={`${selectedArea.subdivisionLabel || "Subdivision administrative"} *`} value={form.commune} onChange={(value) => update("commune", value)} options={selectedArea.subdivisions} placeholder={`Sélectionnez votre ${String(selectedArea.subdivisionLabel || "subdivision").toLowerCase()}`} />}
          <Field label="Adresse ou lieu approximatif *" value={form.visitAddress} onChange={(value) => update("visitAddress", value)} />
          <Field label="Jours disponibles *" value={form.availableDays} placeholder="Ex : lundi à samedi" onChange={(value) => update("availableDays", value)} />
          <Field label="Heures disponibles *" value={form.availableHours} placeholder="Ex : 9h à 17h" onChange={(value) => update("availableHours", value)} />
        </div><label className="block text-xs font-semibold text-slate-600">Commentaire concernant la localisation<textarea rows={2} maxLength={800} value={form.locationComment} onChange={(event) => update("locationComment", event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></fieldset>
        <label className="flex items-start gap-2 text-xs font-medium text-slate-700"><input required type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600" />J’accepte d’être contacté par l’équipe Goying concernant cette demande.</label>
        <button disabled={submitting} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Envoi en cours…" : "Envoyer ma demande"}</button>
      </form>}
    </section>
  </div>;
}

function Field({ label, value, onChange, type = "text", placeholder, min, max }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; min?: string; max?: string }) {
  return <label className="text-xs font-semibold text-slate-600">{label}<input required type={type} min={min} max={max} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>;
}

function Select({ label, value, onChange, options, placeholder, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; placeholder?: string; disabled?: boolean }) {
  return <label className="text-xs font-semibold text-slate-600">{label}<select required value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100">{placeholder && <option value="">{placeholder}</option>}{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
