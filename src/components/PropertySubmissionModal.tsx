import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Home, X } from "lucide-react";
import { submitProperty, uploadPropertySubmissionImage } from "../lib/firebase";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";
import { ACTIVITY_COUNTRIES, citiesForCountry, cityForArea } from "../lib/geography";

interface Props { isOpen: boolean; onClose: () => void; reporterName: string; reporterPhone: string; onNotify: (message: string) => void; }
const initial = { category: "Villa", reporterName: "", reporterPhone: "", country: "", city: "", province: "", commune: "", quartier: "", avenue: "" };

export default function PropertySubmissionModal({ isOpen, onClose, reporterName, reporterPhone, onNotify }: Props) {
  const [form, setForm] = useState(initial);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const submissionRequestId = useRef<string | null>(null);
  const availableCities = citiesForCountry(form.country);
  const selectedArea = cityForArea(form.country, form.city);
  useEffect(() => {
    if (isOpen && !confirmed) {
      setForm((current) => ({
        ...current,
        reporterName: current.reporterName || reporterName,
        reporterPhone: current.reporterPhone || normalizePhoneInput(reporterPhone),
      }));
    }
  }, [confirmed, isOpen, reporterName, reporterPhone]);
  if (!isOpen) return null;
  const close = () => {
    if (!submitting) {
      setConfirmed(false);
      setError("");
      setReferenceImage(null);
      submissionRequestId.current = null;
      onClose();
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const internationalPhone = toInternationalPhone(form.reporterPhone);
    if (!internationalPhone) {
      setError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }
    if (!referenceImage) {
      setError("Ajoutez une photo de référence de la maison.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      submissionRequestId.current ??= crypto.randomUUID();
      const referencePhotoUrl = await uploadPropertySubmissionImage(referenceImage);
      await submitProperty({ ...form, reporterPhone: internationalPhone, referencePhotoUrl, submissionRequestId: submissionRequestId.current });
      setConfirmed(true);
      onNotify("Votre maison a été soumise avec succès.");
      setForm(initial);
      setReferenceImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La soumission n'a pas pu être envoyée.");
    } finally { setSubmitting(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
    <div className="absolute inset-0 bg-slate-900/60" onClick={close} />
    <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="property-submission-title">
      <button type="button" onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X className="h-5 w-5" /></button>
      {confirmed ? <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-4 break-words text-xl font-bold text-slate-900">Merci pour votre confiance.</h2>
        <p className="mx-auto mt-2 max-w-md break-words text-sm leading-relaxed text-slate-600">Merci d'avoir soumis votre bien à Goying. Notre équipe prendra contact avec vous et organisera une visite à l'adresse indiquée afin de vérifier les informations et de prendre les photos nécessaires.</p>
        <button type="button" onClick={close} className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white min-[360px]:w-auto">Fermer</button>
      </div> : <form onSubmit={submit} className="space-y-4">
        <div className="pr-8"><Home className="mb-2 h-6 w-6 text-orange-600" /><h2 id="property-submission-title" className="text-xl font-bold text-slate-900">Soumettre une maison à Goying</h2><p className="mt-1 text-xs text-slate-500">Indiquez les informations demandées pour que l’équipe Goying puisse examiner votre signalement.</p></div>
        {error && <p role="alert" className="break-words rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Nom complet<input required readOnly value={form.reporterName} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600" /></label>
          {([["reporterPhone","Numéro WhatsApp"],["province","Province"],["quartier","Quartier"],["avenue","Avenue"]] as const).map(([key,label]) => <label key={key} className="text-xs font-semibold text-slate-600">{label}<input required type={key === "reporterPhone" ? "tel" : "text"} inputMode={key === "reporterPhone" ? "tel" : undefined} placeholder={key === "reporterPhone" ? "+243 857068014" : undefined} value={form[key]} onChange={(e) => setForm({ ...form, [key]: key === "reporterPhone" ? normalizePhoneInput(e.target.value) : e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>)}
          <label className="text-xs font-semibold text-slate-600">Pays<select required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, city: "", commune: "" })} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Sélectionnez votre pays</option>{ACTIVITY_COUNTRIES.map((country) => <option key={country.name} value={country.name}>{country.label}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Ville<select required value={form.city} disabled={!form.country} onChange={(e) => setForm({ ...form, city: e.target.value, commune: "" })} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"><option value="">Sélectionnez votre ville</option>{availableCities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}</select></label>
          {selectedArea?.subdivisions && <label className="text-xs font-semibold text-slate-600">{selectedArea.subdivisionLabel || "Subdivision administrative"}<select required value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Sélectionnez votre commune</option>{selectedArea.subdivisions.map((commune) => <option key={commune} value={commune}>{commune}</option>)}</select></label>}
          <label className="text-xs font-semibold text-slate-600">Catégorie<select value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">{["Villa","Terrain","Appartement","Studio","Bureau","Maison"].map(x=><option key={x}>{x}</option>)}</select></label>
        </div>
        <p className="text-[11px] text-slate-500">{internationalPhoneHint}</p>
        <label className="block text-xs font-semibold text-slate-600">Photo de référence de la maison<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setReferenceImage(event.target.files?.[0] || null)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-700" /><span className="mt-1 block font-normal text-slate-500">JPEG, PNG ou WebP, 5 Mo maximum.</span></label>
        <p className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-xs text-orange-800">En soumettant une maison sur Goying, vous pouvez recevoir une commission de la part de l'équipe Goying, selon les conditions convenues avec l'équipe.</p>
        <button disabled={submitting} className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Envoi…" : "Soumettre le bien"}</button>
      </form>}
    </div>
  </div>;
}
