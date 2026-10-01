import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

interface CatalogLoadingStateProps {
  label: string;
  count?: number;
}

export function CatalogLoadingState({ label, count = 3 }: CatalogLoadingStateProps) {
  return (
    <section aria-busy="true" aria-label={`Chargement ${label}`} className="space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
        Chargement {label}…
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
            <div className="mt-5 h-3 w-1/3 rounded bg-slate-200" />
            <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

interface DataErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DataErrorState({ message, onRetry }: DataErrorStateProps) {
  return (
    <section role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
      <h2 className="mt-3 text-base font-bold text-slate-900">Impossible de charger les données</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-600">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Réessayer
      </button>
    </section>
  );
}

export function EmptyDataState({ message }: { message: string }) {
  return <p className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{message}</p>;
}
