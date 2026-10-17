import { ArrowLeft, FileText } from "lucide-react";
import { PolicyId, policyLabels, policySections } from "./PoliciesModal";

interface PoliciesPageProps {
  policy: PolicyId;
  onSelectPolicy: (policy: PolicyId) => void;
  onBack: () => void;
}

export default function PoliciesPage({ policy, onSelectPolicy, onBack }: PoliciesPageProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="policy-page-title">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
      </button>
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Politiques Goying" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Politiques</p>
          <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {(Object.keys(policyLabels) as PolicyId[]).map((id) => (
              <button key={id} type="button" onClick={() => onSelectPolicy(id)} className={`shrink-0 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${id === policy ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                {policyLabels[id]}
              </button>
            ))}
          </div>
        </nav>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Goying</p>
              <h1 id="policy-page-title" className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{policyLabels[policy]}</h1>
            </div>
          </div>
          <div className="mt-7 space-y-6 text-sm leading-7 text-slate-600">
            {policySections[policy].map((section) => <section key={section.heading}><h2 className="font-display text-lg font-bold text-slate-900">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2">{paragraph}</p>)}</section>)}
          </div>
        </article>
      </div>
    </section>
  );
}
