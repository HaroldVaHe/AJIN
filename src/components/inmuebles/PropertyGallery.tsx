'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyGalleryProps {
  images: Array<{ id: number; url: string; position: number }>;
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sorted = [...images].sort((a, b) => a.position - b.position);

  if (sorted.length === 0) return null;

  const prev = () =>
    setOpenIndex((i) => (i === null ? null : (i - 1 + sorted.length) % sorted.length));
  const next = () => setOpenIndex((i) => (i === null ? null : (i + 1) % sorted.length));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <button
          onClick={() => setOpenIndex(0)}
          className="relative col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-2xl bg-ajin-surface sm:col-span-2"
        >
          <Image
            src={sorted[0].url}
            alt={`${title} - 1`}
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
          />
        </button>
        {sorted.slice(1, 5).map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setOpenIndex(idx + 1)}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ajin-surface"
          >
            <Image
              src={img.url}
              alt={`${title} - ${idx + 2}`}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
            {idx === 3 && sorted.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                +{sorted.length - 5}
              </span>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>
          <button
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={28} />
          </button>
          <div
            className="relative h-[70vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={sorted[openIndex].url}
              alt={`${title} - ${openIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <button
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next photo"
          >
            <ChevronRight size={28} />
          </button>
          <span className="absolute bottom-4 text-sm text-white/70">
            {openIndex + 1} / {sorted.length}
          </span>
        </div>
      )}
    </>
  );
}
