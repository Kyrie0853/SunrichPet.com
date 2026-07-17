"use client";

import { useState, useRef, useCallback } from "react";

export default function ProductGallery({
  images,
  name,
  videoUrl,
}: {
  images: string[];
  name: string;
  videoUrl?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ dist: number; startScale: number }>({ dist: 0, startScale: 1 });

  const activeImage = images[activeIndex] || null;

  const getTouchDist = (touches: React.TouchList) => {
    const t0 = touches[0] as Touch;
    const t1 = touches[1] as Touch;
    const dx = t0.clientX - (t1?.clientX || 0);
    const dy = t0.clientY - (t1?.clientY || 0);
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchRef.current = { dist: getTouchDist(e.touches), startScale: scale };
    }
  }, [scale]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const newDist = getTouchDist(e.touches);
      const ratio = newDist / (touchRef.current.dist || 1);
      const newScale = Math.min(Math.max(touchRef.current.startScale * ratio, 1), 3);
      setScale(newScale);
      setZoomed(newScale > 1.5);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (scale <= 1) {
      setScale(1);
      setZoomed(false);
    }
  }, [scale]);

  const resetZoom = () => { setScale(1); setZoomed(false); };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl bg-gray-100 aspect-square relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeImage ? (
          <img
            src={activeImage}
            alt={name}
            className="h-full w-full object-cover"
            style={{ transform: `scale(${scale})` }}
            draggable={false}
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-6xl text-gray-300">🦎</div>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] text-white">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => { setActiveIndex(i); resetZoom(); }}
              className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? "border-[#1a7f5a]" : "border-transparent hover:border-[#1a7f5a]/30"}`}>
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {videoUrl && (
        <div className="overflow-hidden rounded-2xl bg-black aspect-video">
          <video src={videoUrl} controls className="w-full h-full" preload="metadata" />
        </div>
      )}
    </div>
  );
}
