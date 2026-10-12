import { useEffect, useState } from "react";
import { ClipboardCheck, CircleAlert, Power, Upload, UserRound, X, Trash2 } from "lucide-react";
import { Booking, Chauffeur, SecondaryProvider, UserSession } from "../types";
import { getProviderBookings, requestProviderCompletion, updateProfessionalProfile, updateProviderAvailability } from "../lib/firebase";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";
import { isKinshasaCommune, KINSHASA_COMMUNES } from "../lib/kinshasaCommunes";
import { Lightbox } from "./Lightbox";

interface ProfessionalProfileModalProps {
  isOpen: boolean;
  session: UserSession;
  onClose: () => void;
  onSaved: (session: UserSession) => void;
}

function hasPersonalAvailabilityControl(listing: Partial<SecondaryProvider | Chauffeur> | undefined) {
  return Boolean(listing) && !("vehicleModel" in listing);
}

export default function ProfessionalProfileModal({
  isOpen,
  session,
  onClose,
  onSaved,
}: ProfessionalProfileModalProps) {
  const listing = session.providerListing;
  const isApproved = session.providerStatus === "Confirmé";
  const isRejected = session.providerStatus === "Refusé";
  const listingData = (listing || {}) as Partial<Chauffeur & SecondaryProvider>;
  const listingRecord = listingData as Record<string, unknown>;
  const storedPhone = [listingData.phone, listingRecord.telephone, listingRecord.whatsapp, listingRecord.whatsApp]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0) || "";
  const [fullName, setFullName] = useState(listing?.name || session.fullName);
  const [phone, setPhone] = useState(() => toInternationalPhone(storedPhone) || normalizePhoneInput(storedPhone));
  const [country, setCountry] = useState(listingData.country || "");
  const [city, setCity] = useState(listingData.city || "");
  const [commune, setCommune] = useState(listingData.commune || "");
  const [bio, setBio] = useState(listingData.bio || "");
  const [specialty, setSpecialty] = useState(session.specialty || "");
  const [skills, setSkills] = useState((listingData.skills || []).join(", "));
  const [priceRate, setPriceRate] = useState(String(listingData.priceRate || ""));
  const [portfolio, setPortfolio] = useState<string[]>(listingData.portfolio || []);
  const [newPortfolioImages, setNewPortfolioImages] = useState<File[]>([]);
  const [avatarUrl, setAvatarUrl] = useState(listingData.avatarUrl || "");
  const [newAvatarImage, setNewAvatarImage] = useState<File | undefined>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [missions, setMissions] = useState<Booking[]>([]);
  const [missionsError, setMissionsError] = useState("");
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [requestingCompletionId, setRequestingCompletionId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index?: number; alt: string } | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [providerAvailability, setProviderAvailability] = useState<"disponible" | "indisponible">(
    listingData.providerAvailability === "indisponible" ? "indisponible" : "disponible"
  );
  const isAdminUnavailable = listingData.status === "indisponible";
  const hasAvailabilityControl = hasPersonalAvailabilityControl(listingData);
  const hasLegacyCommune = Boolean(commune) && !isKinshasaCommune(commune);

  useEffect(() => {
    if (!isOpen || !isApproved || !listing?.id || !hasAvailabilityControl) return;
    setIsMissionsLoading(true);
    setMissionsError("");
    void getProviderBookings(listing.id)
      .then(setMissions)
      .catch((err) => {
        console.error("Error loading provider missions:", err);
        setMissionsError("Impossible de charger vos missions.");
      })
      .finally(() => setIsMissionsLoading(false));
  }, [hasAvailabilityControl, isApproved, isOpen, listing?.id]);

  if (!isOpen) return null;
  if (isRejected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
        <section className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="provider-rejected-title">
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <X className="h-7 w-7" />
          </div>
          <h2 id="provider-rejected-title" className="mt-4 text-xl font-bold text-slate-900">Dossier prestataire refusé</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Votre dossier n'a pas été approuvé. Votre profil n'est pas visible par les clients et vous ne pouvez pas recevoir de missions.
          </p>
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            Contactez l'équipe Goying pour connaître le motif du refus et les démarches à suivre avant toute nouvelle soumission.
          </p>
          <button type="button" onClick={onClose} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
            Fermer
          </button>
        </section>
      </div>
    );
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isApproved) {
      setError("Votre dossier doit être approuvé avant toute modification du profil.");
      return;
    }
    const internationalPhone = toInternationalPhone(phone);
    if (!internationalPhone) {
      setError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const normalizedSkills = skills.split(",").map((skill) => skill.trim()).filter(Boolean);
      const updatedProfile = await updateProfessionalProfile(session, {
        fullName, phone: internationalPhone, country, city, commune, bio, specialty, skills: normalizedSkills, priceRate, avatarUrl,
        portfolio: portfolio.filter(Boolean),
      }, newPortfolioImages, newAvatarImage);
      onSaved({
        ...session,
        fullName,
        phone: internationalPhone,
        specialty,
        providerListing: {
          ...(listing || {}),
          name: fullName, phone: internationalPhone, country, city, commune, bio, specialty, skills: normalizedSkills, priceRate,
          avatarUrl: updatedProfile.avatarUrl,
          portfolio: updatedProfile.portfolio,
        } as UserSession["providerListing"],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  const requestCompletion = async (mission: Booking) => {
    if (!listing?.id) return;
    setMissionsError("");
    setRequestingCompletionId(mission.id);
    try {
      await requestProviderCompletion(mission.id, listing.id);
      setMissions((current) => current.map((item) =>
        item.id === mission.id
          ? { ...item, status: "À valider", providerCompletionRequested: true, providerCompletedAt: new Date().toISOString() }
          : item
      ));
    } catch (err) {
      setMissionsError(err instanceof Error ? err.message : "Impossible de signaler la fin de la prestation.");
    } finally {
      setRequestingCompletionId(null);
    }
  };

  const toggleAvailability = async () => {
    if (!listing || !hasAvailabilityControl) return;
    const nextAvailability = providerAvailability === "disponible" ? "indisponible" : "disponible";
    setIsUpdatingAvailability(true);
    setError("");
    try {
      await updateProviderAvailability(session, nextAvailability);
      setProviderAvailability(nextAvailability);
      onSaved({
        ...session,
        providerListing: { ...listing, providerAvailability: nextAvailability } as UserSession["providerListing"],
      });
    } catch (availabilityError) {
      setError(availabilityError instanceof Error ? availabilityError.message : "Impossible de modifier votre disponibilité.");
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <form onSubmit={save} className="relative z-10 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Mon profil prestataire</h2>
        <p className={`mt-1 text-xs ${isApproved ? "text-emerald-600" : "text-amber-700"}`}>
          {isApproved
            ? "Votre dossier a été approuvé. Vous pouvez modifier vos informations."
            : "Votre dossier est en attente de validation. Vous pourrez modifier votre profil après son approbation par l'équipe Goying."}
        </p>
        {!isApproved && !isRejected && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-relaxed text-red-700">
            Important : si les frais de traitement ne sont pas payés dans les deux jours suivant la soumission, votre dossier sera rejeté.
          </p>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        {isApproved && hasAvailabilityControl && (
          <button type="button" disabled={isUpdatingAvailability} onClick={() => void toggleAvailability()} className="absolute right-14 top-3 inline-flex max-w-[calc(100%-5.5rem)] items-center justify-center gap-1.5 break-words rounded-xl border border-slate-200 bg-white px-2 py-2 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:top-4 sm:px-3 sm:text-xs">
            <Power className="h-3.5 w-3.5" />{isUpdatingAvailability ? "Mise à jour..." : providerAvailability === "disponible" ? "Je suis indisponible" : "Je suis disponible"}
          </button>
        )}
        {isApproved && hasAvailabilityControl && (
          <section className={`mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isAdminUnavailable ? "border-red-200 bg-red-50" : providerAvailability === "indisponible" ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-emerald-50"}`}>
            <div className="flex min-w-0 items-start gap-2">
              <CircleAlert className={`mt-0.5 h-5 w-5 shrink-0 ${isAdminUnavailable ? "text-red-600" : providerAvailability === "indisponible" ? "text-amber-600" : "text-emerald-600"}`} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{isAdminUnavailable ? "Indisponibilité définie par Goying" : providerAvailability === "indisponible" ? "Vous êtes actuellement indisponible" : "Vous êtes disponible"}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{isAdminUnavailable ? "Votre profil n'est pas visible publiquement, mais vous conservez l'accès complet à vos informations et pouvez les modifier." : providerAvailability === "indisponible" ? "Votre profil reste visible publiquement, mais les clients ne peuvent pas prendre rendez-vous avec vous." : "Les clients peuvent actuellement prendre rendez-vous avec vous."}</p>
              </div>
            </div>
          </section>
        )}
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          {avatarUrl ? (
            <button type="button" aria-label="Agrandir la photo de profil" onClick={() => setLightbox({ images: [avatarUrl], alt: "Photo de profil" })} className="cursor-zoom-in rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
              <img src={avatarUrl} alt="Photo de profil" className="h-16 w-16 rounded-2xl object-cover" />
            </button>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
              <UserRound className="h-8 w-8" />
            </div>
          )}
          <label className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 ${isApproved ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-50"}`}>
            <span className="inline-flex items-center gap-1.5"><Upload className="h-4 w-4" /> Ajouter une photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setNewAvatarImage(event.target.files?.[0])}
              disabled={!isApproved}
              className="sr-only"
            />
          </label>
          {newAvatarImage && <span className="text-xs text-slate-500">{newAvatarImage.name}</span>}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Nom complet", fullName, setFullName],
            ["Téléphone / WhatsApp", phone, setPhone],
            ["Pays", country, setCountry],
            ["Ville", city, setCity],
            ["Spécialité", specialty, setSpecialty],
            ["Compétences clés", skills, setSkills],
            ["Tarif", priceRate, setPriceRate],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="text-xs font-semibold text-slate-600">
              {label as string}
              <input type={label === "Téléphone / WhatsApp" ? "tel" : "text"} placeholder={label === "Téléphone / WhatsApp" ? "+243 857068014" : label === "Compétences clés" ? "Ex. Brushing, Tresses, Soins" : undefined} value={value as string} disabled={!isApproved} onChange={(e) => (setter as (value: string) => void)(label === "Téléphone / WhatsApp" ? normalizePhoneInput(e.target.value) : e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" />
            </label>
          ))}
          <label className="text-xs font-semibold text-slate-600">
            Commune
            <select required value={commune} disabled={!isApproved} onChange={(event) => setCommune(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100">
              <option value="">Sélectionnez votre commune</option>
              {hasLegacyCommune && <option value={commune}>{commune} (valeur existante)</option>}
              {KINSHASA_COMMUNES.map((communeName) => <option key={communeName} value={communeName}>{communeName}</option>)}
            </select>
          </label>
          <p className="text-[11px] text-slate-500 sm:col-span-2">{internationalPhoneHint}</p>
          <p className="text-[11px] text-slate-500 sm:col-span-2">Séparez chaque compétence par une virgule.</p>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Présentation
            <textarea value={bio} disabled={!isApproved} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" />
          </label>
        </div>
        <div className="mt-5">
          <label className="text-xs font-semibold text-slate-600">Portfolio</label>
          <div className="mt-2 space-y-2">
            {portfolio.map((image, index) => (
              <div key={`${image}-${index}`} className="flex gap-2">
                <button type="button" aria-label={`Agrandir le portfolio ${index + 1}`} onClick={() => setLightbox({ images: portfolio, index, alt: `Portfolio ${index + 1}` })} className="cursor-zoom-in rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                  <img src={image} alt={`Portfolio ${index + 1}`} className="h-16 w-16 rounded-xl object-cover" />
                </button>
                <button type="button" disabled={!isApproved} onClick={() => setPortfolio((items) => items.filter((_, i) => i !== index))} className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <input type="file" disabled={!isApproved} accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setNewPortfolioImages(Array.from(e.target.files || []))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" />
            <p className="text-[11px] text-slate-500">JPEG, PNG ou WebP, 6 images maximum et 5 Mo par image.</p>
          </div>
          {hasAvailabilityControl && (
            <section className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Mes missions</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Signalez une mission terminée ; l'administration validera ensuite sa fin.
              </p>
              {missionsError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{missionsError}</p>}
              <div className="mt-3 space-y-2">
                {isMissionsLoading ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Chargement de vos missions...</p>
                ) : missionsError ? null : missions.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Aucune mission ne vous est attribuée pour le moment.</p>
                ) : (
                  missions.map((mission) => (
                    <div key={mission.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{mission.itemName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{mission.date} · {mission.status}</p>
                        </div>
                        {(mission.status === "Confirmé" || mission.status === "En cours") && (
                          <button
                            type="button"
                            disabled={requestingCompletionId === mission.id}
                            onClick={() => void requestCompletion(mission)}
                            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {requestingCompletionId === mission.id ? "Envoi..." : "Prestation terminée"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
        <button disabled={saving || !isApproved} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Enregistrement..." : isApproved ? "Enregistrer les modifications" : "Dossier en attente de validation"}
        </button>
      </form>
      <Lightbox images={lightbox?.images || []} initialIndex={lightbox?.index} alt={lightbox?.alt} isOpen={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}
