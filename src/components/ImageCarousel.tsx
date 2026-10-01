import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  onOpen: (index: number) => void;
  className?: string;
  children?: ReactNode;
}

export function ImageCarousel({ images, alt, onOpen, className = "", children }: ImageCarouselProps) {
  const imageList = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const hasMultiple = imageList.length > 1;
  const goTo = (next: number) => setIndex((next + imageList.length) % imageList.length);

  if (!imageList.length) return <div className={`bg-slate-100 ${className}`} />;

  return (
    <div
      className={`relative ${className}`}
      onPointerDown={(event) => { startX.current = event.clientX; didSwipe.current = false; }}
      onPointerUp={(event) => {
        if (startX.current === null || !hasMultiple) return;
        const distance = event.clientX - startX.current;
        startX.current = null;
        if (Math.abs(distance) > 35) {
          didSwipe.current = true;
          goTo(index + (distance < 0 ? 1 : -1));
        }
      }}
      onPointerCancel={() => { startX.current = null; }}
    >
      <button type="button" aria-label={`Agrandir ${alt}`} onClick={() => { if (didSwipe.current) { didSwipe.current = false; return; } onOpen(index); }} className="block h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white">
        <img src={imageList[index]} alt={alt} referrerPolicy="no-referrer" draggable={false} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </button>
      {children}
      {hasMultiple && (
        <>
          <button type="button" aria-label="Photo précédente" onClick={(event) => { event.stopPropagation(); goTo(index - 1); }} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Photo suivante" onClick={(event) => { event.stopPropagation(); goTo(index + 1); }} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><ChevronRight className="h-4 w-4" /></button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/40 px-2 py-1" aria-label={`Photo ${index + 1} sur ${imageList.length}`}>
            {imageList.map((_, dotIndex) => <span key={dotIndex} className={`h-1.5 w-1.5 rounded-full ${dotIndex === index ? "bg-white" : "bg-white/50"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
