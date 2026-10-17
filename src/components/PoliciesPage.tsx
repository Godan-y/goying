import { ArrowLeft, FileText } from "lucide-react";
import { PolicyId, policyLabels, policySections } from "./PoliciesModal";

interface PoliciesPageProps {
  policy: PolicyId;
  onSelectPolicy: (policy: PolicyId) => void;
  onBack: () => void;
}

export default function PoliciesPage({ policy, onSelectPolicy, onBack }: PoliciesPageProps) {
  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-28 pt-7 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="policy-page-title">
      <button type="button" onClick={onBack} className="inline-flex max-w-full items-center gap-1 break-words text-left text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
      </button>
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Politiques Goying" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Politiques</p>
          <div className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] lg:flex-col lg:overflow-x-visible lg:pb-0">
            {(Object.keys(policyLabels) as PolicyId[]).map((id) => (
              <button key={id} type="button" onClick={() => onSelectPolicy(id)} aria-current={id === policy ? "page" : undefined} className={`w-56 shrink-0 rounded-xl px-3 py-2.5 text-left text-sm font-semibold leading-5 [overflow-wrap:anywhere] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 lg:w-full lg:shrink ${id === policy ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                {policyLabels[id]}
              </button>
            ))}
          </div>
        </nav>
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Goying</p>
              <h1 id="policy-page-title" className="font-display text-[1.35rem] font-bold leading-tight tracking-tight text-slate-900 [overflow-wrap:anywhere] sm:text-3xl">{policyLabels[policy]}</h1>
            </div>
          </div>
          <div className="mt-6 min-w-0 space-y-6 text-[15px] leading-7 text-slate-600 sm:mt-7 sm:text-base">
            {policySections[policy].map((section) => <section key={section.heading} className="min-w-0"><h2 className="font-display text-lg font-bold leading-6 text-slate-900 [overflow-wrap:anywhere] sm:text-xl">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2 break-words [overflow-wrap:anywhere]">{paragraph}</p>)}</section>)}
          </div>
        </article>
      </div>
    </section>
  );
}
