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
  onLogout: () => void;
  onOpenBookings: () => void;
  onOpenOnboarding: () => void;
  onOpenProfile: () => void;
  onOpenPropertySubmission: () => void;
}

export default function Header({
  session,
  bookings,
  onNavigateHome,
  onOpenLogin,
  onLogout,
  onOpenBookings,
  onOpenOnboarding,
  onOpenProfile,
  onOpenPropertySubmission,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Goying */}
        <div
          id="header-logo-container"
          onClick={() => {
            onNavigateHome();
            setIsMenuOpen(false);
          }}
          className="flex cursor-pointer items-center space-x-1.5 sm:space-x-2 transition-transform duration-200 active:scale-95 shrink-0"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-200">
            <span className="font-display text-lg sm:text-xl font-bold text-white">G</span>
          </div>
          <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Goying<span className="text-orange-500">.</span>
          </span>
        </div>

        {/* Desktop Navigation Menu */}
        <div className="hidden md:flex items-center gap-2" id="header-desktop-nav">
          <button
            onClick={onOpenPropertySubmission}
            className="rounded-full border border-orange-200 bg-white px-2.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 lg:px-3"
          >
            Soumettre une maison
          </button>
          {/* Rejoindre en tant que pro */}
          {session.role !== "prestataire" && (
            <button
              id="nav-btn-onboarding"
              onClick={onOpenOnboarding}
              className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-2 text-xs font-medium text-orange-700 transition-all hover:bg-orange-100 hover:text-orange-800 lg:gap-1.5 lg:px-4 lg:text-sm"
            >
              <Briefcase className="h-4 w-4" />
              Espace Prestataire
            </button>
          )}
          {/* Bookings Tracker */}
          {bookings.length > 0 && (
            <button
              id="nav-btn-bookings"
              onClick={onOpenBookings}
              className="relative flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 lg:gap-1.5 lg:px-4 lg:text-sm"
            >
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="hidden lg:inline">Mes Réservations</span>
              <span className="lg:hidden">Réservations</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white leading-none">
                {bookings.length}
              </span>
            </button>
          )}

          {/* Connection Trigger or Profil Dropdown */}
          {session.isLoggedIn ? (
            <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
              <div className="flex flex-col text-right">
                <span className="max-w-20 text-xs font-semibold text-slate-800 line-clamp-1 lg:max-w-none">
                  {session.fullName}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {session.role === "prestataire"
                    ? `${session.specialty} · ${session.providerStatus || "En attente"}`
                    : "Client"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {session.role === "prestataire" && (
                  <button onClick={onOpenProfile} title="Mon profil" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <User className="h-4 w-4" />
                  </button>
                )}
                <button
                  id="nav-btn-logout"
                  onClick={onLogout}
                  title="Se déconnecter"
                  className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              id="nav-btn-login"
              onClick={onOpenLogin}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200/50 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-orange-300" />
              <span>Se connecter</span>
            </button>
          )}
          <LanguageSelector />
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden items-center space-x-2" id="header-mobile-controls">
          {/* Always show Bookings Tracker if there are bookings to let mobile users check bookings easily */}
          {bookings.length > 0 && (
            <button
              id="nav-btn-bookings-mobile"
              onClick={onOpenBookings}
              className="relative flex items-center justify-center h-9 w-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              title="Mes Réservations"
            >
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
                {bookings.length}
              </span>
            </button>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <LanguageSelector />
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
            className="overflow-hidden border-t border-slate-100 bg-white shadow-lg md:hidden"
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

              {/* Espace Prestataire */}
              {session.role !== "prestataire" && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-orange-700 rounded-xl bg-orange-50/75 border border-orange-100 hover:bg-orange-100 transition-all text-left"
                >
                  <Briefcase className="h-4 w-4" />
                  Espace Prestataire
                </button>
              )}


              {/* Connected User details or Login Button */}
              {session.isLoggedIn ? (
                <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{session.fullName}</div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {session.role === "prestataire" ? `Pro: ${session.specialty}` : "Client"}
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
