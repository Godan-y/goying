import { FormEvent, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { motion } from "motion/react";

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
}

const quickQuestions = [
  "Réserver une maison",
  "Créer un compte ou se connecter",
  "Soumettre une maison",
  "Suivre ma réservation",
  "Contacter l'équipe",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getSupportResponse(question: string) {
  const text = normalizeText(question);

  if (/(compte|connexion|connecter|mot de passe|google|email)/.test(text)) {
    return "Utilisez « Se connecter » en haut de la page. Les clients peuvent créer un compte avec leur nom, e-mail et mot de passe, ou continuer avec Google. Si vous avez oublié votre mot de passe, choisissez « Réinitialiser le mot de passe » dans la fenêtre de connexion.";
  }
  if (/(maison|immobilier|visite|bien)/.test(text) && /(reserver|reservation|planif|louer|acheter)/.test(text)) {
    return "Dans « Immobilier », choisissez une maison disponible puis cliquez sur « Planifier visite » ou « Faire offre ». La connexion est obligatoire : renseignez vos coordonnées, la date et l'heure. La maison est réservée uniquement après la confirmation affichée.";
  }
  if (/(soumettre|proposer|publier).*(maison|bien)|(maison|bien).*(soumettre|proposer|publier)/.test(text)) {
    return "Connectez-vous puis cliquez sur « Soumettre une maison ». Indiquez uniquement la catégorie, l'adresse demandée et votre numéro WhatsApp. Votre bien reste en attente d'examen et n'est jamais publié automatiquement. Vous pouvez recevoir une commission selon les conditions convenues avec l'équipe Goying.";
  }
  if (/(contact|equipe|équipe|telephone|whatsapp)/.test(text)) {
    return "Pour joindre l'équipe Goying, utilisez le support de l'application ou WhatsApp au +243 973199473. Précisez votre nom et le sujet de votre demande afin que nous puissions vous orienter.";
  }
  if (/(reserver|reservation|suivi|annul|mission|statut)/.test(text)) {
    return "Ouvrez le service souhaité, choisissez une offre puis remplissez le formulaire de demande. Vous pouvez suivre vos demandes depuis « Mes Réservations ». Une réservation terminée peut ensuite être évaluée lorsque son statut est « Terminé ».";
  }
  if (/(prestataire|coiffeur|maquille|professeur|devenir pro|dossier)/.test(text)) {
    return "Pour devenir prestataire, ouvrez « Espace Prestataire » et remplissez votre dossier. Les profils autonomes validés peuvent compléter leur profil, ajouter une photo et un portfolio. Les candidatures Chauffeur et Ménager/Ménagère sont traitées par l'administration.";
  }
  if (/(chauffeur|menager|menagere)/.test(text)) {
    return "Les chauffeurs et ménagers/ménagères sont ajoutés et gérés par l'administration. Pour postuler à l'un de ces postes, écrivez au +243 973199473 en précisant le poste souhaité.";
  }
  if (/(voiture|vehicule|automobile|location)/.test(text)) {
    return "Dans « Automobile », choisissez un véhicule disponible puis cliquez sur « Louer maintenant ». Indiquez votre nom complet, votre numéro WhatsApp, la date de départ et le nombre de jours. Vous pouvez faire défiler et agrandir les photos du véhicule.";
  }
  if (/(avis|etoile|note|evaluer)/.test(text)) {
    return "Après la fin d'une prestation et sa validation par l'administration, le bouton « Évaluer ce prestataire » apparaît dans votre suivi. Vous pouvez attribuer de 1 à 5 étoiles et ajouter un commentaire facultatif.";
  }
  if (/(portfolio|photo|profil|image)/.test(text)) {
    return "Les prestataires validés peuvent ajouter une photo de profil et, pour les métiers concernés, de 1 à 6 images de portfolio. Les formats acceptés sont JPEG, PNG et WebP, dans la limite de 5 Mo par image.";
  }

  return "Je peux vous guider sur les comptes, les réservations, les locations de voiture, les prestataires, les portfolios et les avis. Essayez par exemple : « Comment réserver un service ? »";
}

export default function SupportChatModal({ isOpen, onClose }: SupportChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Bonjour ! Je suis l'assistant Goying. Comment puis-je vous aider ?",
    },
  ]);
  const [question, setQuestion] = useState("");

  if (!isOpen) return null;

  const sendQuestion = (event: FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    const messageId = Date.now();
    setMessages((current) => [
      ...current,
      { id: messageId, role: "user", text: trimmedQuestion },
      { id: messageId + 1, role: "assistant", text: getSupportResponse(trimmedQuestion) },
    ]);
    setQuestion("");
  };

  const askQuickQuestion = (quickQuestion: string) => {
    const messageId = Date.now();
    setMessages((current) => [
      ...current,
      { id: messageId, role: "user", text: quickQuestion },
      { id: messageId + 1, role: "assistant", text: getSupportResponse(quickQuestion) },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative z-10 flex h-[min(680px,calc(100dvh-1rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[min(680px,calc(100dvh-2rem))] sm:rounded-3xl"
        id="support-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-chat-title"
      >
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="support-chat-title" className="break-words font-display text-base font-bold sm:text-lg">Assistant Goying</h2>
              <p className="text-[11px] text-blue-100">Réponses instantanées sur l&apos;application</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
            aria-label="Fermer l'assistance client"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm ${
                message.role === "user"
                  ? "rounded-br-sm bg-blue-600 text-white"
                  : "rounded-bl-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
              }`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickQuestions.map((quickQuestion) => (
              <button
                type="button"
                key={quickQuestion}
                onClick={() => askQuickQuestion(quickQuestion)}
                className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                {quickQuestion}
              </button>
            ))}
          </div>
          <form onSubmit={sendQuestion} className="flex items-center gap-2">
            <label htmlFor="support-question" className="sr-only">Votre question</label>
            <input
              id="support-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Écrivez votre question..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white sm:text-sm"
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
              aria-label="Envoyer la question"
              disabled={!question.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <MessageCircle className="h-3 w-3" />
            Cet assistant utilise les informations de Goying et ne collecte pas votre conversation.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
