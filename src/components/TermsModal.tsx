import { FileText, ShieldCheck, X } from "lucide-react";
import { motion } from "motion/react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "1. Objet de la plateforme",
    content:
      "Goying met en relation des clients avec des prestataires et présente des offres de services, de véhicules et d'immobilier. La plateforme facilite la demande, le suivi et la communication autour d'une réservation.",
  },
  {
    title: "2. Comptes et informations fournies",
    content:
      "Vous devez fournir des informations exactes lors de la création d'un compte ou d'une demande. Vous êtes responsable de la confidentialité de votre mot de passe et de l'utilisation de votre compte.",
  },
  {
    title: "3. Réservations et locations",
    content:
      "Toute demande de réservation est soumise à la disponibilité affichée, à la confirmation concernée et aux conditions particulières communiquées pour le service. Le client doit renseigner des coordonnées correctes afin de permettre le suivi de sa demande.",
  },
  {
    title: "4. Prestataires",
    content:
      "Les prestataires sont tenus de présenter une offre exacte, de respecter leurs engagements et de maintenir leurs informations à jour. Les profils qui nécessitent une validation ne sont visibles ou actifs qu'après l'examen de leur dossier.",
  },
  {
    title: "5. Avis et comportement",
    content:
      "Les avis doivent refléter une expérience réelle et rester respectueux. Les contenus trompeurs, diffamatoires, illégaux ou portant atteinte aux droits d'autrui peuvent être retirés.",
  },
  {
    title: "6. Données personnelles",
    content:
      "Les informations demandées sont utilisées pour créer le compte, gérer les réservations et assurer le fonctionnement de Goying. Ne communiquez jamais votre mot de passe à un tiers.",
  },
  {
    title: "7. Modification et contact",
    content:
      "Goying peut faire évoluer ces conditions et les fonctionnalités de la plateforme. En continuant à utiliser le service après une mise à jour, vous acceptez les conditions révisées.",
  },
];

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-2xl sm:p-6 md:p-8"
        id="terms-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:right-4 sm:top-4"
          aria-label="Fermer les conditions générales"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="mb-5 flex shrink-0 items-start gap-3 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 id="terms-modal-title" className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Conditions générales
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Dernière mise à jour : 22 septembre 2026
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-600 sm:pr-2 sm:text-sm">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-900">
            En utilisant Goying, vous acceptez les présentes conditions générales.
          </div>
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="font-semibold text-slate-900">{section.title}</h3>
              <p className="mt-1">{section.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-5 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="hidden items-center gap-1.5 text-[11px] text-slate-500 sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Utilisation responsable de la plateforme
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:ml-auto sm:w-auto"
          >
            J&apos;ai compris
          </button>
        </div>
      </motion.div>
    </div>
  );
}
