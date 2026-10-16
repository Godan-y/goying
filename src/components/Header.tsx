import React, { useState } from "react";
import { User, KeyRound, Clock, LogOut, Briefcase, Menu, X } from "lucide-react";
import { UserSession, Booking } from "../types";
import { motion, AnimatePresence } from "motion/react";
import LanguageSelector from "./LanguageSelector";

interface HeaderProps {
  session: UserSession;
  bookings: Booking[];
  onNavigateHome: () => void;
  onOpenLogin: () => void;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
  onOpenBookings: () => void;
  onOpenOnboarding: () => void;
  onOpenProfile: () => void;
  onOpenPropertySubmission: () => void;
}

function providerSpecialtyLabel(specialty?: string): string {
  const normalized = specialty
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const labels: Record<string, string> = {
    chauffeur: "Chauffeur",
    menagere: "Ménager / Ménagère",
    coiffeur: "Coiffeur / Coiffeuse",
    maquilleuse: "Maquilleuse / Make-up",
    professeur: "Professeur à domicile",
  };
  return normalized ? labels[normalized] || "Prestataire" : "Prestataire";
}

function readableText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized && !["undefined", "null"].includes(normalized.toLowerCase())
    ? normalized
    : undefined;
}

export default function Header({
  session,
  bookings,
  onNavigateHome,
  onOpenLogin,
  onLogout,
  isLoggingOut,
  onOpenBookings,
  onOpenOnboarding,
  onOpenProfile,
  onOpenPropertySubmission,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const specialtyLabel = providerSpecialtyLabel(session.specialty);
  const accountName = readableText(session.fullName)
    || readableText(session.providerListing?.name)
    || "Compte prestataire";

  return (
    <header className="fixed inset-x-0 top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-5 xl:px-8">
        <button
          type="button"
          id="header-logo-container"
          onClick={() => {
            onNavigateHome();
            setIsMenuOpen(false);
          }}
          className="flex shrink-0 items-center space-x-2 text-left transition-transform duration-200 active:scale-95"
        >
          <img src="/goying-services-logo.png" alt="Goying" className="h-9 w-9 object-contain xl:h-11 xl:w-11" />
          <span className="whitespace-nowrap font-display text-base font-black tracking-tight text-slate-900 xl:text-xl">
            Goying
          </span>
        </button>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 lg:flex xl:gap-2" id="header-desktop-nav" aria-label="Navigation principale">
          <button
            type="button"
            onClick={onOpenPropertySubmission}
            className="shrink-0 rounded-full border border-orange-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-orange-700 transition-colors hover:bg-orange-50 xl:px-3 xl:py-2.5 xl:text-xs"
          >
            Soumettre une maison
          </button>
          {session.role !== "prestataire" && (
            <button
              type="button"
              id="nav-btn-onboarding"
              onClick={onOpenOnboarding}
              className="flex shrink-0 items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-2 text-[11px] font-semibold text-orange-700 transition-colors hover:bg-orange-100 hover:text-orange-800 xl:gap-1.5 xl:px-3 xl:py-2.5 xl:text-xs"
            >
              <Briefcase className="h-4 w-4" />
              Devenir prestataire
            </button>
          )}
          {bookings.length > 0 && (
            <button
              type="button"
              id="nav-btn-bookings"
              onClick={onOpenBookings}
              className="relative flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 xl:gap-1.5 xl:px-3 xl:py-2.5 xl:text-xs"
            >
              <Clock className="h-4 w-4 text-slate-500" />
              <span>Mes Réservations</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white leading-none">
                {bookings.length}
              </span>
            </button>
          )}

          {session.isLoggedIn ? (
            <div className="ml-0.5 flex shrink-0 items-center gap-1.5 border-l border-slate-100 pl-2 xl:ml-1 xl:gap-2 xl:pl-3">
              <div className="flex min-w-0 max-w-20 flex-col text-right xl:max-w-36">
                <span className="truncate text-[11px] font-semibold text-slate-800 xl:text-xs">
                  {accountName}
                </span>
                <span className="truncate text-[9px] text-slate-500 capitalize xl:text-[10px]">
                  {session.role === "prestataire"
                    ? `${specialtyLabel} · ${session.providerStatus || "En attente"}`
                    : "Client"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {session.role === "prestataire" && (
                  <button type="button" onClick={onOpenProfile} title="Mon profil" className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 xl:h-11 xl:w-11">
                    <User className="h-4 w-4" />
                  </button>
                )}
                <button
                  id="nav-btn-logout"
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => void onLogout()}
                  title="Se déconnecter"
                  className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60 xl:h-11 xl:w-11"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              id="nav-btn-login"
              onClick={onOpenLogin}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200/50 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-orange-300" />
              <span>Se connecter</span>
            </button>
          )}
          <LanguageSelector />
        </nav>

        <div className="flex shrink-0 items-center lg:hidden" id="header-mobile-controls">
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-white shadow-lg lg:hidden"
          >
            <div className="px-4 py-4 space-y-3 flex flex-col">
              <button
                onClick={() => {
                  onOpenPropertySubmission();
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center rounded-xl border border-orange-100 bg-orange-50/75 px-4 py-3 text-left text-sm font-semibold text-orange-700 transition-all hover:bg-orange-100"
              >
                Soumettre une maison
              </button>

              {/* Devenir prestataire */}
              {session.role !== "prestataire" && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-orange-700 rounded-xl bg-orange-50/75 border border-orange-100 hover:bg-orange-100 transition-all text-left"
                >
                  <Briefcase className="h-4 w-4" />
                  Devenir prestataire
                </button>
              )}

              {bookings.length > 0 && (
                <button
                  onClick={() => {
                    onOpenBookings();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-slate-500" />Mes réservations</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">{bookings.length}</span>
                </button>
              )}

              {/* Connected User details or Login Button */}
              {session.isLoggedIn ? (
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{accountName}</div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {session.role === "prestataire"
                          ? `${specialtyLabel} · ${session.providerStatus || "En attente"}`
                          : "Client"}
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {session.role === "prestataire" && (
                    <button
                      onClick={() => {
                        onOpenProfile();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      <User className="h-4 w-4" />
                      Mon profil prestataire
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => void onLogout().then(() => setIsMenuOpen(false))}
                    className="flex min-h-11 w-full touch-manipulation items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenLogin();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200/50 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all mt-2"
                >
                  <KeyRound className="h-4 w-4 text-orange-300" />
                  Se connecter
                </button>
              )}

              <div className="mt-2 border-t border-slate-100 pt-3">
                <LanguageSelector />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
