import { Languages } from "lucide-react";

type Language = "fr" | "en" | "ln";

const languages: Array<{ code: Language; label: string }> = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ln", label: "Lingala" },
];

function currentLanguage(): Language {
  const translatedLanguage = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("googtrans="))
    ?.split("=")[1]
    ?.split("/")
    .pop();
  return translatedLanguage === "en" || translatedLanguage === "ln" ? translatedLanguage : "fr";
}

export default function LanguageSelector({ className = "" }: { className?: string }) {
  const language = currentLanguage();

  const changeLanguage = (nextLanguage: Language) => {
    if (nextLanguage === "fr") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    } else {
      document.cookie = `googtrans=/fr/${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`;
    }
    window.location.reload();
  };

  return (
    <label className={`flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-slate-600 ${className}`}>
      <Languages className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
      <span className="sr-only">Choisir la langue</span>
      <select
        value={language}
        onChange={(event) => changeLanguage(event.target.value as Language)}
        className="max-w-20 bg-transparent text-[11px] font-semibold outline-none"
        aria-label="Choisir la langue"
      >
        {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
    </label>
  );
}
