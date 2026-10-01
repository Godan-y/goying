import { Clock, X, Trash2, Calendar, CheckCircle2, Star, AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { Booking } from "../types";
import { FormEvent, useState } from "react";
import { motion } from "motion/react";

interface BookingsTrackerProps {
  isOpen: boolean;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onCancelBooking: (id: string) => void;
  onAcknowledgeBooking: (id: string) => void;
  onSubmitReview: (booking: Booking, rating: number, comment: string) => Promise<void>;
}

export default function BookingsTracker({
  isOpen,
  bookings,
  isLoading,
  error,
  onClose,
  onRetry,
  onCancelBooking,
  onAcknowledgeBooking,
  onSubmitReview,
}: BookingsTrackerProps) {
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  if (!isOpen) return null;

  const submitReview = async (event: FormEvent, booking: Booking) => {
    event.preventDefault();
    if (rating === 0 || submittingReview) return;
    setSubmittingReview(true);
    setReviewError("");
    try {
      await onSubmitReview(booking, rating, comment);
      setReviewBookingId(null);
      setRating(0);
      setComment("");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Votre avis n'a pas pu être enregistré.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Main Panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        id="bookings-tracker-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Suivi de mes réservations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of bookings */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4" id="bookings-tracker-list">
          {isLoading && bookings.length === 0 ? (
            <div aria-busy="true" className="space-y-3 py-5">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                Chargement de vos réservations…
              </div>
              {[0, 1].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="h-3 w-1/3 rounded bg-slate-200" /><div className="mt-3 h-4 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-3 w-full rounded bg-slate-100" /></div>)}
            </div>
          ) : error && bookings.length === 0 ? (
            <div role="alert" className="py-8 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-red-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Impossible de charger vos réservations</p>
              <p className="mt-1 text-xs text-slate-500">{error}</p>
              <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"><RefreshCw className="h-3.5 w-3.5" />Réessayer</button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Calendar className="mx-auto h-12 w-12 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">
                Vous n'avez pas encore de réservations.
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explorez l'immobilier, l'automobile ou nos services à la personne pour effectuer votre première demande !
              </p>
            </div>
          ) : (
            bookings.map((book) => (
              <div
                key={book.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-slate-200 hover:bg-white"
              >
                {/* Top strip */}
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 capitalize">
                    {book.serviceType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      book.status === "Confirmé"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {book.status === "Confirmé" ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                    )}
                    {book.status}
                  </span>
                </div>

                {/* Body */}
                <h4 className="text-sm font-bold text-slate-900">{book.itemName}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {book.details}
                </p>

                {/* Footer price & cancel action */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Planifié le :</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">
                      📅 {book.date}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 font-medium">Tarif estimé :</span>
                    <span className="font-extrabold text-slate-900 block mt-0.5">
                      {book.costInfo}
                    </span>
                  </div>
                </div>

                {book.status === "Confirmé" && (
                  <button
                    onClick={() => onAcknowledgeBooking(book.id)}
                    className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    OK, j'ai pris connaissance
                  </button>
                )}

                {book.status === "Terminé" && book.providerId && book.providerCollection && (
                  book.reviewedAt ? (
                    <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Merci, votre avis a été enregistré.
                    </p>
                  ) : reviewBookingId === book.id ? (
                    <form onSubmit={(event) => submitReview(event, book)} className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <p className="text-xs font-bold text-slate-800">Évaluez cette prestation</p>
                      <div className="mt-2 flex gap-1" aria-label="Note sur 5 étoiles">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button key={value} type="button" onClick={() => setRating(value)} className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600" aria-label={`${value} étoile${value > 1 ? "s" : ""}`}>
                            <Star className={`h-5 w-5 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                          </button>
                        ))}
                      </div>
                      <label className="mt-2 block text-xs font-medium text-slate-700">Commentaire <span className="font-normal text-slate-500">(facultatif)</span>
                        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
                      </label>
                      {reviewError && <p role="alert" className="mt-2 text-xs text-red-700">{reviewError}</p>}
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => { setReviewBookingId(null); setRating(0); setComment(""); setReviewError(""); }} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white">Annuler</button>
                        <button type="submit" disabled={rating === 0 || submittingReview} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{submittingReview ? "Enregistrement…" : "Envoyer mon avis"}</button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" onClick={() => { setReviewBookingId(book.id); setRating(0); setComment(""); setReviewError(""); }} className="mt-3 inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100">
                      <Star className="h-4 w-4" /> Donner mon avis
                    </button>
                  )
                )}

                {/* Cancel Hover Button */}
                <button
                  onClick={() => onCancelBooking(book.id)}
                  title="Annuler cette réservation"
                  className="absolute top-2 right-2 rounded-lg p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Fermer le panneau
          </button>
        </div>
      </motion.div>
    </div>
  );
}
