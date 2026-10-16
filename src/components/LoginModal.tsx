import React, { useEffect, useState } from "react";
import { X, Mail, Lock, User, LogIn, Briefcase, Eye, EyeOff } from "lucide-react";
import { UserSession } from "../types";
import {
  loginClient,
  loginProfessional,
  loginWithGoogleClient,
  registerClient,
  requestPasswordReset,
} from "../lib/firebase";
import { internationalPhoneHint, normalizePhoneInput, toInternationalPhone } from "../lib/phone";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onNotify: (message: string) => void;
  onOpenOnboarding: () => void;
}

function getAuthenticationErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Adresse e-mail ou mot de passe incorrect. Vérifiez vos informations ou créez un compte client.";
    case "auth/email-already-in-use":
      return "Cette adresse e-mail possède déjà un compte. Connectez-vous ou réinitialisez votre mot de passe.";
    case "auth/invalid-email":
      return "Veuillez saisir une adresse e-mail valide.";
    case "auth/weak-password":
      return "Votre mot de passe doit contenir au moins 6 caractères.";
    case "auth/too-many-requests":
      return "Trop de tentatives ont été effectuées. Attendez quelques minutes avant de réessayer.";
    case "auth/network-request-failed":
      return "La connexion Internet semble indisponible. Vérifiez votre réseau puis réessayez.";
    default:
      return error instanceof Error && error.message
        ? error.message
        : "La connexion n'a pas abouti. Vérifiez vos informations et réessayez.";
  }
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onNotify,
  onOpenOnboarding,
}: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [loginMode, setLoginMode] = useState<"client" | "prestataire">("client");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState("");
  const [isGoogleLoginPending, setIsGoogleLoginPending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setPasswordResetMessage("");
      setIsGoogleLoginPending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || (loginMode === "client" && isRegister && (!fullName || !phone))) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }
    const internationalPhone = loginMode === "client" && isRegister ? toInternationalPhone(phone) : null;
    if (loginMode === "client" && isRegister && !internationalPhone) {
      setError(`Numéro WhatsApp invalide. ${internationalPhoneHint}`);
      return;
    }

    try {
      if (loginMode === "prestataire") {
        const providerSession = await loginProfessional(email, password);
        onLoginSuccess(providerSession);
        onNotify("Connexion prestataire réussie.");
        onClose();
      } else if (isRegister) {
        const formattedName = fullName.charAt(0).toUpperCase() + fullName.slice(1);
        const newSession = await registerClient(formattedName, email, password, internationalPhone!);
        onLoginSuccess(newSession);
        onNotify("Votre compte client a été créé avec succès.");
        onClose();
      } else {
        const existingSession = await loginClient(email, password);
        onLoginSuccess(existingSession);
        onNotify("Connexion réussie.");
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(getAuthenticationErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoginPending) return;

    setError("");
    setPasswordResetMessage("");
    setIsGoogleLoginPending(true);
    try {
      const clientSession = await loginWithGoogleClient();
      onLoginSuccess(clientSession);
      onNotify("Connexion Google réussie.");
      onClose();
    } catch (err) {
      console.error("Google client login failed:", err);
      if (err instanceof Error && err.message.includes("auth/cancelled-popup-request")) {
        setError("La demande Google précédente a été annulée. Attendez la fermeture de la fenêtre Google, puis réessayez.");
      } else {
        setError(err instanceof Error ? err.message : "La connexion avec Google a échoué.");
      }
    } finally {
      setIsGoogleLoginPending(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setPasswordResetMessage("");
    try {
      await requestPasswordReset(email);
      setPasswordResetMessage("Si cette adresse possède un compte, un lien de réinitialisation vient d'être envoyé.");
    } catch (err) {
      console.error("Password reset request failed:", err);
      setError(getAuthenticationErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <div
        className="relative z-10 my-auto w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6 md:p-8"
        id="login-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fermer la connexion"
          className="absolute right-3 top-3 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6 text-center">
          <h2 className="break-words font-display text-2xl font-bold text-slate-900">
            {loginMode === "prestataire"
              ? "Connexion prestataire"
              : isRegister
                ? "Créer un compte client"
                : "Bienvenue sur Goying"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {loginMode === "prestataire"
              ? "Consultez le statut de votre dossier Goying"
              : isRegister
              ? "Rejoignez la communauté et simplifiez votre quotidien"
              : "Connectez-vous pour louer, réserver et planifier"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
          {error && (
            <div className="break-words rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
              {error}
            </div>
          )}
          {passwordResetMessage && (
            <div className="break-words rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
              {passwordResetMessage}
            </div>
          )}

          {loginMode === "client" && isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nom complet
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouassi Konan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {loginMode === "client" && isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: +243 857068014"
                value={phone}
                onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">{internationalPhoneHint}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresse Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={passwordVisible ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isRegister && (
              <button
                type="button"
                onClick={handlePasswordReset}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 hover:bg-blue-500 transition-colors"
          >
            {isRegister ? (
              <>
                <span aria-hidden="true">👤</span>
                S'enregistrer
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Se connecter
              </>
            )}
          </button>

          {loginMode === "client" && (
            <>
              <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                ou
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoginPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-base font-bold text-[#4285F4]">G</span>
                {isGoogleLoginPending ? "Ouverture de Google..." : "Continuer avec Google"}
              </button>
            </>
          )}
        </form>

        {/* Account and role options */}
        <div className="mt-4 space-y-2 text-center">
          {loginMode === "client" && (
            <button
              type="button"
              onClick={() => {
                setIsRegister((current) => !current);
                setError("");
                setPasswordResetMessage("");
              }}
              className="block w-full text-xs font-semibold text-blue-600 hover:underline"
            >
              {isRegister
                ? "Vous avez déjà un compte ? Connectez-vous"
                : "Nouveau sur Goying ? Créer un compte"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setLoginMode(loginMode === "client" ? "prestataire" : "client");
              setIsRegister(false);
              setError("");
              setPasswordResetMessage("");
            }}
            className="block w-full text-xs font-semibold text-slate-500 hover:text-blue-600 hover:underline"
          >
            {loginMode === "prestataire"
              ? "Vous êtes client ? Se connecter en tant que client"
              : "Vous êtes prestataire ? Se connecter à votre espace"}
          </button>
        </div>

        {/* Employee / Professional Portal Redirect */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
            Vous offrez des services ?
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-100 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all"
            id="login-modal-provider-onboarding-link"
          >
            <Briefcase className="h-3.5 w-3.5" />
            Rejoindre Goying en tant que professionnel
          </button>
        </div>
      </div>
    </div>
  );
}
