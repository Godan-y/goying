import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function Lightbox({ images, initialIndex = 0, isOpen, onClose, alt = "Image agrandie" }: LightboxProps) {
  const validImages = images.filter(Boolean);
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(validImages.length - 1, 0)));
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchDistance = useRef<number | null>(null);

  const resetTransform = () => {
    setZoom(MIN_ZOOM);
    setPosition({ x: 0, y: 0 });
  };

  const goTo = (nextIndex: number) => {
    if (!validImages.length) return;
    setIndex((nextIndex + validImages.length) % validImages.length);
    resetTransform();
  };

  useEffect(() => {
    if (!isOpen) return;
    setIndex(Math.min(initialIndex, Math.max(validImages.length - 1, 0)));
    resetTransform();
  }, [initialIndex, isOpen, validImages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && validImages.length > 1) goTo(index - 1);
      if (event.key === "ArrowRight" && validImages.length > 1) goTo(index + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [index, isOpen, onClose, validImages.length]);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [index, isOpen]);

  const updateZoom = (nextZoom: number) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    setZoom(clampedZoom);
    if (clampedZoom === MIN_ZOOM) setPosition({ x: 0, y: 0 });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 1 && zoom > MIN_ZOOM) {
      dragStart.current = { x: event.clientX, y: event.clientY, panX: position.x, panY: position.y };
    }
    if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(first.x - second.x, first.y - second.y);
      dragStart.current = null;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinchDistance.current) {
      const [first, second] = [...pointers.current.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      updateZoom(zoom * (distance / pinchDistance.current));
      pinchDistance.current = distance;
      return;
    }
    if (dragStart.current && zoom > MIN_ZOOM) {
      setPosition({
        x: dragStart.current.panX + event.clientX - dragStart.current.x,
        y: dragStart.current.panY + event.clientY - dragStart.current.y,
      });
    }
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchDistance.current = null;
    if (!pointers.current.size) dragStart.current = null;
  };

  if (!isOpen || !validImages.length) return null;

  const image = validImages[index];
  const hasMultiple = validImages.length > 1;

  return (
    <AnimatePresence>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Visionneuse d'images"
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 p-3 outline-none sm:p-6"
        onClick={onClose}
      >
        <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white" aria-live="polite">
          {index + 1} / {validImages.length}
        </div>
        <div className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1.5 sm:right-5 sm:top-5 sm:gap-2">
          <Control label="Zoom arrière" onClick={() => updateZoom(zoom - 0.5)} disabled={zoom <= MIN_ZOOM}><ZoomOut /></Control>
          <Control label="Réinitialiser le zoom" onClick={resetTransform} disabled={zoom === MIN_ZOOM && position.x === 0 && position.y === 0}><RotateCcw /></Control>
          <Control label="Zoom avant" onClick={() => updateZoom(zoom + 0.5)} disabled={zoom >= MAX_ZOOM}><ZoomIn /></Control>
          <Control label="Fermer la visionneuse" onClick={onClose}><X /></Control>
        </div>
        {hasMultiple && (
          <>
            <Control label="Image précédente" onClick={() => goTo(index - 1)} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-5"><ChevronLeft /></Control>
            <Control label="Image suivante" onClick={() => goTo(index + 1)} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:right-5"><ChevronRight /></Control>
          </>
        )}
        <div
          className={`flex h-full w-full items-center justify-center overflow-hidden px-10 pt-12 pb-12 sm:px-14 sm:pt-14 sm:pb-14 ${zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : ""}`}
          onClick={(event) => event.stopPropagation()}
          onWheel={(event) => {
            event.preventDefault();
            updateZoom(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {loading && <span className="absolute text-sm text-white">Chargement de l'image…</span>}
          {failed ? (
            <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">Cette image ne peut pas être affichée.</p>
          ) : (
            <motion.img
              key={image}
              src={image}
              alt={alt}
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setFailed(true); }}
              animate={{ scale: zoom, x: position.x, y: position.y, opacity: loading ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="max-h-full max-w-full select-none object-contain"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Control({ label, onClick, disabled, className = "", children }: { label: string; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={(event) => { event.stopPropagation(); onClick(); }} disabled={disabled} className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}
