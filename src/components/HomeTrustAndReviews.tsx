import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PublicReview } from "../lib/firebase";

interface HomeTrustAndReviewsProps {
  availableListings: number;
  verifiedProviders: number;
  isCatalogLoading: boolean;
  hasCatalogError: boolean;
  reviews: PublicReview[];
  onExploreServices: () => void;
  onOpenBookings: () => void;
  onRequireLogin: () => void;
  isLoggedIn: boolean;
}

export default function HomeTrustAndReviews({
  availableListings,
  verifiedProviders,
  isCatalogLoading,
  hasCatalogError,
  reviews,
  onExploreServices,
  onOpenBookings,
  onRequireLogin,
  isLoggedIn,
}: HomeTrustAndReviewsProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const openReviewFlow = () => {
    setIsReviewDialogOpen(false);
    if (isLoggedIn) {
      onOpenBookings();
      return;
    }
    onRequireLogin();
  };

  return (
    <>
      <section className="border-y border-slate-200 bg-slate-50 py-14 sm:py-18" aria-labelledby="why-goying-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Engagements & fiabilité
            </div>
            <h2 id="why-goying-title" className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Pourquoi choisir Goying ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Les services dont vous avez besoin, au même endroit.
            </p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">Des prestataires vérifiés</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nous vérifions les informations et les documents des prestataires selon notre procédure de vérification.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">Tous vos services au même endroit</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ménage, coiffure, cours, immobilier et véhicules : trouvez les services adaptés à vos besoins sur une seule plateforme.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">Des échanges plus simples</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Contactez les personnes concernées, posez vos questions et convenez des conditions avant de confirmer votre prestation.
              </p>
            </article>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onExploreServices}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition-colors hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              Explorer tous nos services
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-18" aria-labelledby="reviews-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
              <Sparkles className="h-3.5 w-3.5" />
              Témoignages & avis clients
            </div>
            <h2 id="reviews-title" className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Avis de la communauté Goying
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Seuls les avis liés à une réservation terminée peuvent être publiés.
            </p>
          </div>

          {!hasCatalogError && (
            <div className="mx-auto mt-8 grid max-w-5xl divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4 text-center">
                <p className="text-2xl font-extrabold text-slate-900">{isCatalogLoading ? "…" : availableListings}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Annonces disponibles</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{isCatalogLoading ? "…" : verifiedProviders}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Profils vérifiés</p>
              </div>
            </div>
          )}

          {reviews.length ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {reviews.map((review) => (
                <article key={review.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">{review.serviceType}</span>
                    <span className="flex text-amber-400" aria-label={`${review.rating} étoiles sur 5`}>
                      {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-slate-200"}`} />)}
                    </span>
                  </div>
                  {review.itemName && <p className="mt-4 text-xs font-semibold text-slate-500">Prestation : <span className="text-slate-700">{review.itemName}</span></p>}
                  <blockquote className="mt-3 flex-1 text-sm leading-6 text-slate-600">« {review.comment} »</blockquote>
                  {review.createdAt && <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] text-slate-500">Avis publié le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(review.createdAt))}</p>}
                </article>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <Star className="mx-auto h-7 w-7 text-orange-500" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-bold text-slate-900">Pas encore d&apos;avis publié</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Les témoignages affichés ici proviennent uniquement de réservations terminées et évaluées.</p>
            </div>
          )}

          <aside className="mt-8 flex flex-col gap-5 rounded-2xl bg-slate-900 px-6 py-7 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="max-w-2xl">
              <h3 className="font-display text-xl font-bold">Vous aussi, partagez votre expérience avec Goying</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Votre avis après une réservation terminée aide la communauté à choisir en confiance.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewDialogOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Donner mon avis
            </button>
          </aside>
        </div>
      </section>

      <AnimatePresence>
        {isReviewDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Fermer la fenêtre d'avis"
              className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewDialogOpen(false)}
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-dialog-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsReviewDialogOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <h2 id="review-dialog-title" className="mt-4 pr-8 font-display text-xl font-bold text-slate-900">
                Partagez votre avis sur Goying
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Les avis sont liés à une réservation terminée afin de garantir des retours authentiques et utiles.
              </p>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <p className="text-sm leading-6 text-slate-600">Sélectionnez une réservation terminée dans votre suivi, puis attribuez votre note et votre commentaire.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openReviewFlow}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <UsersRound className="h-4 w-4" />
                {isLoggedIn ? "Voir mes réservations" : "Me connecter pour donner mon avis"}
              </button>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
