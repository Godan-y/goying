import { useEffect } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.22),_transparent_38%)]" />
      <motion.section
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex max-w-sm flex-col items-center"
        aria-label="Chargement de Goying"
      >
        <motion.div
          animate={{ rotate: [0, -4, 4, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-4xl font-black shadow-2xl shadow-blue-600/40"
        >
          G
        </motion.div>
        <div className="mt-5 flex items-center gap-2">
          <h1 className="font-display text-4xl font-black tracking-tight">Goying<span className="text-orange-400">.</span></h1>
          <Sparkles className="h-5 w-5 text-orange-300" aria-hidden="true" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Vos besoins, nos solutions.</p>
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin text-orange-300" aria-hidden="true" />
          Préparation de votre expérience
        </div>
      </motion.section>
    </main>
  );
}
