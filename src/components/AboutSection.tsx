import { X, Target, Heart, ShieldCheck, MessageCircle, GraduationCap, Code2 } from "lucide-react";
import { motion } from "motion/react";

interface AboutSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutSection({ isOpen, onClose }: AboutSectionProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative z-10 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-white p-5 sm:p-6 md:p-8 shadow-2xl"
        id="about-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 bg-slate-50 hover:text-slate-800 transition-colors border border-slate-150 shadow-sm z-20 active:scale-95"
          aria-label="Fermer"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Brand Header */}
        <div className="mb-4 sm:mb-5 flex flex-col items-center text-center shrink-0 pt-2 sm:pt-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-2.5 shadow-inner">
            <Heart className="h-5.5 w-5.5" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            À propos de Goying
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium">
            Faciliter votre quotidien, en toute confiance.
          </p>
        </div>

        {/* Mission Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed" id="about-modal-body">
          <p>
            <strong className="text-slate-900">Goying</strong> est une plateforme multiservices moderne et centralisée. Notre vocation est d'éliminer le stress de la recherche de prestataires fiables en vous connectant instantanément aux compétences professionnelles locales les plus qualifiées.
          </p>

          <p>
            Que vous cherchiez la maison de vos rêves, un véhicule haut de gamme pour vos déplacements, un chauffeur privé ponctuel, ou des professionnels qualifiés pour vos services à la personne (ménagères, coiffeurs, professeurs, maquilleuses), Goying centralise tout au même endroit avec une expérience fluide et sécurisée.
          </p>

          {/* Core Values Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2 rounded-xl bg-blue-50/50 p-2.5 sm:p-3 border border-blue-50">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Vérifié</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Profils et pièces justificatives audités.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-orange-50/50 p-2.5 sm:p-3 border border-orange-50">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Proximité</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Des experts actifs juste à côté de chez vous.</p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
              <div className="flex items-start gap-3">
                <img
                  src="/gode-mukeng-mukanz.png"
                  alt="Gode Mukeng Mukanz, développeur web"
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                />
                <div>
                  <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600"><Code2 className="h-3.5 w-3.5" />Développeur Web & Mobiles</p>
                  <h3 className="mt-0.5 text-sm font-bold text-slate-900">Gode Mukeng Mukanz</h3>
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-600">
                    <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                    Licencié en gestion informatique à l'Université Pédagogique Nationale.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Vous recherchez un site web moderne, rapide et adapté à votre activité ? Gode accompagne les entreprises et porteurs de projets dans la création de plateformes professionnelles, claires et pensées pour convertir vos visiteurs en clients.
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-800">WhatsApp : +243 857068014</p>
              <a
                href="https://wa.me/243857068014?text=Bonjour%20Gode%2C%20je%20souhaite%20discuter%20d%27un%20projet%20de%20site%20web."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-500 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                Discuter de mon projet sur WhatsApp
              </a>
          </section>
        </div>

        {/* Call to action (Shrink-0 / Bottom-anchored) */}
        <div className="mt-4 border-t border-slate-100 pt-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-full bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 active:scale-95 transition-colors shadow-sm"
          >
            Compris, merci !
          </button>
        </div>
      </motion.div>
    </div>
  );
}
