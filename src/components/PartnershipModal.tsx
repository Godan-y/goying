import { FormEvent, useState } from "react";
import { Building2, CheckCircle2, MessageCircle, Send, X } from "lucide-react";
import { submitPartnershipRequest } from "../lib/firebase";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm = {
  organizationName: "",
  entityType: "Institution publique / Ministère",
  contactName: "",
  officialEmail: "",
  phone: "",
  collaborationArea: "",
};

export default function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    if (submitting) return;
    setForm(initialForm);
    setError("");
    setSubmitted(false);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const phone = toInternationalPhone(form.phone);
    if (!phone) {
      setError(`Numéro de téléphone invalide. ${internationalPhoneHint}`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitPartnershipRequest({ ...form, phone });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "La proposition n'a pas pu être envoyée.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMessage = `Bonjour Goying, je vous contacte au sujet d'une proposition de partenariat.\n\nOrganisation : ${form.organizationName}\nType : ${form.entityType}\nContact : ${form.contactName}\nDomaine : ${form.collaborationArea}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={close} />
      <section className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="partnership-title">
        <button type="button" onClick={close} aria-label="Fermer" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Proposition enregistrée</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              Merci pour votre intérêt. Votre proposition est enregistrée de manière sécurisée. Vous pouvez maintenant nous contacter sur WhatsApp pour un échange plus rapide.
            </p>
            <a
              href={`https://wa.me/243973199473?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Continuer sur WhatsApp
            </a>
            <button type="button" onClick={close} className="mt-3 block w-full text-sm font-semibold text-slate-600 hover:text-slate-900">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="pr-8">
              <Building2 className="mb-2 h-7 w-7 text-blue-600" />
              <h2 id="partnership-title" className="text-xl font-bold text-slate-900">Devenir partenaire de Goying</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Construisons ensemble des solutions utiles, fiables et adaptées aux besoins locaux.</p>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Nom de l'organisation / entreprise *
                <input required value={form.organizationName} placeholder="Ex : Agence d'Assainissement / Entreprise X" onChange={(event) => setForm({ ...form, organizationName: event.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">Type d'entité *
                <select required value={form.entityType} onChange={(event) => setForm({ ...form, entityType: event.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option>Institution publique / Ministère</option>
                  <option>Entreprise privée</option>
                  <option>ONG / Association</option>
                  <option>Organisation internationale</option>
                  <option>Établissement scolaire / Université</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Domaine principal de collaboration *
                <select required value={form.collaborationArea} onChange={(event) => setForm({ ...form, collaborationArea: event.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="" disabled>Choisissez un domaine</option>
                  <option>Services et accompagnement de proximité</option>
                  <option>Mobilité et transport</option>
                  <option>Immobilier et logement</option>
                  <option>Digitalisation et solutions web</option>
                  <option>Formation et éducation</option>
                  <option>Autre partenariat stratégique</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Personne de contact *
                <input required value={form.contactName} placeholder="Nom et titre" onChange={(event) => setForm({ ...form, contactName: event.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">Email officiel *
                <input required type="email" value={form.officialEmail} placeholder="contact@organisation.org" onChange={(event) => setForm({ ...form, officialEmail: event.target.value })} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Téléphone / WhatsApp *
                <input required type="tel" inputMode="tel" value={form.phone} placeholder="+243 857068014" onChange={(event) => setForm({ ...form, phone: normalizePhoneInput(event.target.value) })} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <span className="mt-1 block text-[11px] font-normal text-slate-500">{internationalPhoneHint}</span>
              </label>
            </div>
            <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
              <Send className="h-4 w-4" />
              {submitting ? "Envoi en cours…" : "Envoyer la proposition de partenariat"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
