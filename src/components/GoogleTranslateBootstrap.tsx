import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string
        ) => unknown;
      };
    };
  }
}

export default function GoogleTranslateBootstrap() {
  useEffect(() => {
    const initialize = () => {
      if (!window.google?.translate?.TranslateElement || document.querySelector("#google_translate_element select")) {
        return;
      }
      new window.google.translate.TranslateElement(
        { pageLanguage: "fr", includedLanguages: "fr,en,ln", autoDisplay: false },
        "google_translate_element"
      );
    };

    window.googleTranslateElementInit = initialize;
    if (window.google?.translate?.TranslateElement) {
      initialize();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-translate]");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.googleTranslate = "true";
      document.head.appendChild(script);
    }
  }, []);

  return <div id="google_translate_element" className="hidden" aria-hidden="true" />;
}
