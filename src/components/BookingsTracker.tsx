import { Clock, X, Trash2, Calendar, CheckCircle2, Star, AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { Booking } from "../types";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "motion/react";

interface BookingsTrackerProps {
  isOpen: boolean;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onCancelBooking: (id: string) => Promise<void>;
  onAcknowledgeBooking: (id: string) => Promise<void>;
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
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [acknowledgingBookingId, setAcknowledgingBookingId] = useState<string | null>(null);
  const [acknowledgementErrorBookingId, setAcknowledgementErrorBookingId] = useState<string | null>(null);
  const [acknowledgementError, setAcknowledgementError] = useState("");

  useEffect(() => {
    if (!deleteSuccess) return;
    const timer = window.setTimeout(() => setDeleteSuccess(false), 4000);
    return () => window.clearTimeout(timer);
  }, [deleteSuccess]);

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

  const confirmDelete = async () => {
    if (!bookingToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onCancelBooking(bookingToDelete.id);
      setBookingToDelete(null);
      setDeleteSuccess(true);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "La réservation n'a pas pu être supprimée. Veuillez réessayer.");
    } finally {
      setIsDeleting(false);
    }
  };

  const acknowledgeBooking = async (bookingId: string) => {
    if (acknowledgingBookingId) return;
    setAcknowledgingBookingId(bookingId);
    setAcknowledgementErrorBookingId(null);
    setAcknowledgementError("");
    try {
      await onAcknowledgeBooking(bookingId);
    } catch (error) {
      setAcknowledgementErrorBookingId(bookingId);
      setAcknowledgementError(error instanceof Error ? error.message : "Votre confirmation n'a pas pu être enregistrée. Veuillez réessayer.");
    } finally {
      setAcknowledgingBookingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
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
        className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl"
        id="bookings-tracker-container"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Clock className="h-5 w-5 shrink-0 text-orange-500" />
            <h2 className="min-w-0 break-words font-display text-base font-bold text-slate-900 sm:text-lg">
              Suivi de mes réservations
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le suivi de mes réservations"
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of bookings */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4 sm:p-6" id="bookings-tracker-list">
          {deleteSuccess && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              Réservation supprimée avec succès.
            </p>
          )}
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
              <p className="mt-1 break-words text-xs text-slate-500">{error}</p>
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
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pr-6">
                  <span className="max-w-full break-words rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 capitalize">
                    {book.serviceType}
                  </span>
                  <span
                    className={`inline-flex max-w-full items-center gap-1 break-words rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                <h4 className="break-words text-sm font-bold text-slate-900">{book.itemName}</h4>
                <p className="mt-1 break-words text-xs leading-relaxed text-slate-500 line-clamp-2">
                  {book.details}
                </p>

                {/* Footer price & cancel action */}
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                  <div className="min-w-0">
                    <span className="text-slate-400 font-medium">Planifié le :</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">
                      📅 {book.date}
                    </span>
                  </div>

                  <div className="min-w-0 break-words min-[360px]:text-right">
                    <span className="text-slate-400 font-medium">Tarif estimé :</span>
                    <span className="font-extrabold text-slate-900 block mt-0.5">
                      {book.costInfo}
                    </span>
                  </div>
                </div>

                {book.status === "Confirmé" && (
                  <button type="button"
                    disabled={acknowledgingBookingId === book.id}
                    onClick={() => void acknowledgeBooking(book.id)}
                    className="mt-3 flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {acknowledgingBookingId === book.id ? "Enregistrement…" : "OK, j'ai pris connaissance"}
                  </button>
                )}
                {book.status === "Confirmé" && acknowledgementErrorBookingId === book.id && acknowledgementError && (
                  <p role="alert" className="mt-2 break-words rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {acknowledgementError}
                  </p>
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
                      {reviewError && <p role="alert" className="mt-2 break-words text-xs text-red-700">{reviewError}</p>}
                      <div className="mt-2 flex flex-col gap-2 min-[360px]:flex-row">
                        <button type="button" onClick={() => { setReviewBookingId(null); setRating(0); setComment(""); setReviewError(""); }} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white min-[360px]:w-auto">Annuler</button>
                        <button type="submit" disabled={rating === 0 || submittingReview} className="w-full rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 min-[360px]:w-auto">{submittingReview ? "Enregistrement…" : "Envoyer mon avis"}</button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" onClick={() => { setReviewBookingId(book.id); setRating(0); setComment(""); setReviewError(""); }} className="mt-3 inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100">
                      <Star className="h-4 w-4" /> Donner mon avis
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => { setBookingToDelete(book); setDeleteError(""); }}
                  title="Supprimer cette réservation"
                  aria-label={`Supprimer la réservation ${book.itemName}`}
                  className="absolute right-2 top-2 z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:bg-red-50 focus-visible:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 active:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 min-[360px]:w-auto"
          >
            Fermer le panneau
          </button>
        </div>
      </motion.div>

      {bookingToDelete && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4" role="presentation">
          <div className="absolute inset-0 bg-slate-950/40" />
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-booking-title" className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 id="delete-booking-title" className="text-base font-bold text-slate-900">Supprimer cette réservation ?</h3>
            <p className="mt-2 break-words text-sm leading-relaxed text-slate-600">Voulez-vous vraiment supprimer cette réservation ?</p>
            {deleteError && <p role="alert" className="mt-3 break-words rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{deleteError}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 min-[360px]:flex-row min-[360px]:justify-end">
              <button type="button" disabled={isDeleting} onClick={() => { setBookingToDelete(null); setDeleteError(""); }} className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60">
                Annuler
              </button>
              <button type="button" disabled={isDeleting} onClick={() => void confirmDelete()} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isDeleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
