import { FileText, ShieldCheck, X } from "lucide-react";
import { motion } from "motion/react";

export const POLICY_VERSION = "2026-10-17";

export const policyLabels = {
  general: "Conditions générales d'utilisation",
  providers: "Prestataires indépendants",
  placement: "Placement des ménagères et chauffeurs",
  propertyRental: "Maisons à louer",
  propertySale: "Maisons à vendre",
  vehicleRental: "Voitures à louer",
  vehicleSale: "Voitures à vendre",
  privacy: "Politique de confidentialité",
} as const;

export type PolicyId = keyof typeof policyLabels;

interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export const policySections: Record<PolicyId, PolicySection[]> = {
  general: [
    { heading: "Utilisation de la plateforme", paragraphs: ["Goying est une plateforme de mise en relation et de présentation de services. Chaque utilisateur doit fournir des informations exactes, utiliser la plateforme légalement et respecter les autres utilisateurs.", "Les fonctionnalités, catégories et modalités peuvent évoluer. Lisez les conditions applicables avant d'utiliser un service ou de conclure une transaction."] },
    { heading: "Transactions et responsabilités", paragraphs: ["Sauf indication écrite contraire, les utilisateurs restent responsables de vérifier l'identité de leur interlocuteur, les documents utiles, l'état du bien ou du véhicule, les prix, les paiements et les conditions de leur accord.", "Goying n'est pas présenté comme propriétaire, vendeur, bailleur, employeur ou garant d'une transaction, sauf lorsque son rôle réel et contractuel le prévoit."] },
    { heading: "Contenus et signalements", paragraphs: ["Les contenus frauduleux, trompeurs, illégaux, discriminatoires, menaçants ou portant atteinte aux droits d'autrui sont interdits. Goying peut examiner un signalement, demander des justificatifs, suspendre un profil ou retirer un contenu en cas de suspicion raisonnable de violation des règles."] },
  ],
  providers: [
    { heading: "Profil et activité", paragraphs: ["Les prestataires indépendants peuvent demander l'activation d'un profil pour présenter leurs compétences et services autorisés. Ils sont responsables de l'exactitude de leurs informations, qualifications, tarifs, délais, conditions, sécurité et obligations légales.", "Les frais de création et d'activation applicables sont ceux confirmés sur la plateforme avant paiement. Aucun taux non confirmé n'est présenté comme définitif."] },
    { heading: "Modèle actuel", paragraphs: ["Selon le modèle actuel, Goying ne prélève pas de commission mensuelle obligatoire sur les revenus des prestataires indépendants. Toute mise en avant payante, prestation supplémentaire ou commission par mission doit être décrite et acceptée avant son activation.", "Les éventuelles conditions de remboursement des frais de profil doivent être communiquées avant paiement."] },
  ],
  placement: [
    { heading: "Conditions d'emploi", paragraphs: ["Goying peut faciliter la mise en relation entre des candidats, notamment ménagères et chauffeurs, et des employeurs. Le poste, les tâches, horaires, lieu, rémunération, congés, période d'essai et droits de chacun doivent être définis dans un contrat conforme au droit applicable."] },
    { heading: "Frais de placement : validation requise", paragraphs: ["Le modèle envisagé prévoit un frais de placement ponctuel payé par l'employeur à Goying après un placement réussi. Ce frais est distinct du salaire du travailleur et ne constitue pas une retenue sur celui-ci.", "Le montant, le payeur, le moment du paiement et les règles de remboursement ne sont pas activés ni affichés comme une règle définitive tant qu'ils n'ont pas été validés juridiquement en République démocratique du Congo."] },
  ],
  propertyRental: [
    { heading: "Annonces et location", paragraphs: ["Les annonces de maisons à louer sont créées, vérifiées et gérées par l'administration de Goying. Les propriétaires ou mandataires doivent fournir des informations, photos autorisées, prix, localisation et documents exacts.", "Aucun frais de publication n'est prévu dans le modèle actuel. Une commission ne peut être due qu'après une location effectivement conclue, selon des conditions communiquées et acceptées à l'avance par la partie concernée."] },
    { heading: "Vérifications", paragraphs: ["Le bailleur et le locataire doivent vérifier le bien, convenir des conditions et établir les documents nécessaires. Une annonce ne garantit ni le titre de propriété, ni l'absence de défauts, ni la disponibilité du bien."] },
  ],
  propertySale: [
    { heading: "Annonces et vente", paragraphs: ["Les annonces de maisons à vendre sont créées et gérées par l'administration. Le vendeur doit fournir des informations exactes et justifier son identité ainsi que son droit de vendre.", "Aucun frais de publication n'est prévu dans le modèle actuel. Une commission ne peut être due qu'après une vente effectivement conclue, selon des conditions communiquées et acceptées à l'avance."] },
    { heading: "Vérifications", paragraphs: ["L'acheteur et le vendeur doivent effectuer les vérifications juridiques et documentaires nécessaires, puis formaliser la vente selon le droit applicable en RDC. La publication ne garantit ni la propriété, ni la conformité, ni la disponibilité."] },
  ],
  vehicleRental: [
    { heading: "Annonces et location", paragraphs: ["Les annonces de véhicules à louer sont gérées par l'administration. Le propriétaire ou mandataire doit fournir des informations exactes sur le véhicule, le prix, la disponibilité, les conditions d'utilisation et les documents nécessaires.", "Aucun frais de publication n'est prévu dans le modèle actuel. Toute commission éventuelle n'est due qu'après une location effectivement conclue et selon des conditions acceptées à l'avance."] },
    { heading: "Accord avant remise", paragraphs: ["Avant la remise du véhicule, les parties doivent préciser par écrit le prix, la durée, le kilométrage, le carburant, l'assurance, la caution, les responsabilités en cas de dommage, les conditions de retour et le conducteur autorisé."] },
  ],
  vehicleSale: [
    { heading: "Annonces et vente", paragraphs: ["Les annonces de véhicules à vendre sont gérées par l'administration. Le vendeur doit communiquer l'état du véhicule, le kilométrage connu, les défauts connus, l'historique disponible et les documents nécessaires.", "Aucun frais de publication n'est prévu dans le modèle actuel. Toute commission éventuelle n'est due qu'après une vente effectivement conclue et selon des conditions acceptées à l'avance."] },
    { heading: "Vérifications", paragraphs: ["L'acheteur doit pouvoir examiner le véhicule et vérifier les documents, l'identité du vendeur et le droit de vendre. Goying ne garantit pas l'état mécanique, l'absence de défaut ou la propriété sans vérification réelle."] },
  ],
  privacy: [
    { heading: "Données utilisées", paragraphs: ["Goying collecte les informations nécessaires au fonctionnement de la plateforme : données de profil, coordonnées, informations de service ou d'annonce, échanges utiles au traitement des demandes, ainsi que les informations nécessaires aux frais, réclamations et à la prévention de la fraude.", "Ces données ne doivent être accessibles qu'aux personnes et prestataires autorisés qui en ont besoin pour leurs fonctions."] },
    { heading: "Informations à compléter avant publication", paragraphs: ["Les coordonnées officielles de l'exploitant, les finalités détaillées, les destinataires, la durée de conservation, les droits des personnes et la procédure de demande doivent être complétés après vérification du droit applicable en RDC.", "Goying ne prétend pas mettre en œuvre un niveau de chiffrement, de conformité ou de suppression automatique qui n'est pas réellement disponible."] },
  ],
};

interface PoliciesModalProps {
  isOpen: boolean;
  policy: PolicyId;
  onClose: () => void;
}

export default function PoliciesModal({ isOpen, policy, onClose }: PoliciesModalProps) {
  if (!isOpen) return null;
  const sections = policySections[policy];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-7"
      >
        <button type="button" onClick={onClose} aria-label="Fermer la politique" className="absolute right-3 top-3 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 flex items-start gap-3 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Goying</p>
            <h2 id="policy-modal-title" className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{policyLabels[policy]}</h2>
            <p className="mt-1 text-xs text-slate-500">Version {POLICY_VERSION}</p>
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto pr-1 text-sm leading-6 text-slate-600 sm:pr-2">
          {sections.map((section) => <section key={section.heading}><h3 className="font-display text-base font-bold text-slate-900">{section.heading}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2">{paragraph}</p>)}</section>)}
        </div>
        <div className="mt-5 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="hidden items-center gap-1.5 text-[11px] text-slate-500 sm:flex"><ShieldCheck className="h-4 w-4 text-emerald-600" />Document d'information à faire valider localement</span>
          <button type="button" onClick={onClose} className="w-full rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:ml-auto sm:w-auto">J&apos;ai compris</button>
        </div>
      </motion.section>
    </div>
  );
}
