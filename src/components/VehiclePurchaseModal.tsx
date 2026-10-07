import { FormEvent, ReactNode, useEffect, useState } from "react";
import { CheckCircle2, Fuel, Gauge, MapPin, ShieldCheck, Sliders, X } from "lucide-react";
import { submitVehiclePurchaseRequest } from "../lib/firebase";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";
import { UserSession, VehicleSale } from "../types";

interface VehiclePurchaseModalProps {
  sale: VehicleSale | null;
  session: UserSession;
  onClose: () => void;
  onRequireLogin: () => void;
}

export default function VehiclePurchaseModal({ sale, session, onClose, onRequireLogin }: VehiclePurchaseModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsApp, setBuyerWhatsApp] = useState("");
  const [buyerCommune, setBuyerCommune] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!sale) return;
    setBuyerName(session.fullName || "");
    setBuyerWhatsApp(session.phone || "");
    setBuyerCommune("");
    setConsent(false);
    setError("");
    setIsSubmitted(false);
  }, [sale, session.fullName, session.phone]);

  if (!sale) return null;

  const close = () => {
    if (!isSubmitting) onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session.isLoggedIn || !session.uid) {
      setError("Connectez-vous à votre compte pour confirmer votre demande d'achat.");
      onRequireLogin();
      return;
    }

    const normalizedPhone = toInternationalPhone(buyerWhatsApp);
    if (!buyerName.trim()) {
      setError("Veuillez renseigner votre nom complet.");
      return;
    }
    if (!normalizedPhone) {
      setError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }
    if (!consent) {
      setError("Vous devez accepter d'être contacté par l'équipe Goying.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await submitVehiclePurchaseRequest({
        vehicleId: sale.id,
        buyerName: buyerName.trim(),
        buyerWhatsApp: normalizedPhone,
        buyerCommune: buyerCommune.trim(),
        consent,
      });
      setIsSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "La demande d'achat n'a pas pu être enregistrée.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={close} />
      <section className="relative z-10 my-0 flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="vehicle-purchase-title">
        <button type="button" aria-label="Fermer" onClick={close} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm hover:bg-slate-100"><X className="h-5 w-5" /></button>
        {isSubmitted ? (
          <div className="px-5 py-12 text-center sm:px-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Demande d'achat enregistrée</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">Votre demande a bien été enregistrée. L'équipe Goying va vérifier la disponibilité du véhicule et contacter le vendeur. Nous vous contacterons ensuite sur WhatsApp afin de vous mettre en relation avec le vendeur.</p>
            <p className="mx-auto mt-4 max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-800">Le paiement se fera uniquement sur place après vérification du véhicule. Aucun paiement en ligne n'est demandé.</p>
            <button type="button" onClick={close} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Fermer</button>
          </div>
        ) : (
          <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
            <div className="pr-10">
              <h2 id="vehicle-purchase-title" className="text-xl font-bold text-slate-900">Confirmer l'achat</h2>
              <p className="mt-1 text-sm text-slate-500">Votre demande sera prise en charge par l'équipe Goying.</p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img src={sale.imageUrl} alt={`${sale.brand} ${sale.model}`} referrerPolicy="no-referrer" className="aspect-[16/7] w-full object-cover" />
              <div className="p-4">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-slate-900">{sale.brand} {sale.model}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <span>Année {sale.year}</span><span className="text-slate-300">•</span><span className="rounded-md bg-white px-2 py-1">{sale.vehicleType}</span><span className="text-slate-300">•</span><span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">{sale.condition}</span>
                    </div>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="break-words text-xl font-extrabold text-slate-900 sm:text-2xl">{sale.priceUsd.toLocaleString("en-US")} $</p>
                    {sale.priceNegotiable && <span className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Prix négociable</span>}
                  </div>
                </div>
                <h4 className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Caractéristiques techniques</h4>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-4">
                  <VehicleDetail label="Kilométrage" value={`${sale.mileage.toLocaleString("fr-FR")} km`} icon={<Gauge className="h-4 w-4" />} />
                  <VehicleDetail label="Carburant" value={sale.fuel} icon={<Fuel className="h-4 w-4" />} />
                  <VehicleDetail label="Transmission" value={sale.transmission} icon={<Sliders className="h-4 w-4" />} />
                  <VehicleDetail label="Localisation" value={[sale.city, sale.commune].filter(Boolean).join(", ") || "À confirmer"} icon={<MapPin className="h-4 w-4" />} />
                </div>
                {sale.description && <>
                  <h4 className="mt-5 border-t border-slate-200 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Description du véhicule</h4>
                  <p className="mt-3 break-words rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-600">{sale.description}</p>
                </>}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-900"><ShieldCheck className="h-5 w-5" />Paiement sur place</div>
              <p className="mt-2 text-sm leading-relaxed text-amber-800">Aucun paiement en ligne n'est demandé. Le paiement sera effectué sur place après vérification du véhicule et confirmation de la transaction.</p>
            </div>

            {error && <p role="alert" className="mt-4 break-words rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <fieldset className="mt-5 space-y-3">
              <legend className="text-sm font-bold text-slate-900">Vos informations</legend>
              <label className="block text-xs font-semibold text-slate-600">Nom complet *
                <input required value={buyerName} onChange={(event) => setBuyerName(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Numéro WhatsApp *
                <input required type="tel" value={buyerWhatsApp} onChange={(event) => setBuyerWhatsApp(normalizePhoneInput(event.target.value))} placeholder="+243 857068014" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Adresse ou commune <span className="font-normal text-slate-400">(facultatif)</span>
                <input value={buyerCommune} onChange={(event) => setBuyerCommune(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500" />
              </label>
              <label className="flex cursor-pointer items-start gap-2 pt-1 text-xs leading-relaxed text-slate-600">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600" />
                J'accepte d'être contacté par l'équipe Goying concernant cet achat.
              </label>
            </fieldset>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto">Annuler</button>
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{isSubmitting ? "Enregistrement..." : "Confirmer l'achat"}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function VehicleDetail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 flex items-start gap-1 break-words text-xs font-semibold text-slate-700"><span className="shrink-0 text-amber-500">{icon}</span>{value}</p>
  </div>;
}
