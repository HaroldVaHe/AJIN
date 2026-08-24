'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CheckCircle2, AlertCircle, Loader2, ImagePlus, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { filesToWebp } from '@/lib/image-webp';

const OPERATIONS = ['venta', 'arriendo'] as const;
const TYPES = ['apartamento', 'casa', 'oficina', 'lote', 'bodega'] as const;
const MAX_PHOTOS = 15;

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function PropertySubmissionForm() {
  const t = useTranslations('inmuebles.publish');
  const tInm = useTranslations('inmuebles');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFilesSelected = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    const incoming = await filesToWebp(Array.from(list).slice(0, remaining));
    setPhotos((prev) => [...prev, ...incoming]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('sending');

    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? '').trim();

    const payload = {
      operation: get('operation'),
      type: get('type'),
      title: get('title'),
      description: get('description'),
      price_cop: Number(get('price_cop')),
      area_m2: Number(get('area_m2')) || null,
      bedrooms: Number(get('bedrooms')) || null,
      bathrooms: Number(get('bathrooms')) || null,
      parking: Number(get('parking')) || null,
      stratum: Number(get('stratum')) || null,
      neighborhood: get('neighborhood'),
      city: get('city') || 'Bogotá',
      owner_name: get('owner_name'),
      owner_phone: get('owner_phone'),
      owner_email: get('owner_email'),
      photo_count: photos.length,
    };

    try {
      const res = await fetch('/api/inmuebles/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.id) {
        throw new Error(data.error || 'request-failed');
      }

      for (let i = 0; i < photos.length; i += 1) {
        setUploadProgress(i + 1);
        const fd = new FormData();
        fd.append('file', photos[i]);
        const photoRes = await fetch(`/api/inmuebles/solicitud/${data.id}/foto`, {
          method: 'POST',
          body: fd,
        });
        if (!photoRes.ok) {
          console.error(`Photo ${i + 1} failed`);
        }
      }

      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message !== 'request-failed' ? err.message : '');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <CheckCircle2 size={56} className="mx-auto text-ajin-accent" />
        <h2 className="mt-4 text-2xl font-bold text-ajin-primary">{t('successTitle')}</h2>
        <p className="mt-2 text-ajin-gray-300">{t('successMessage')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <AlertCircle size={56} className="mx-auto text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-ajin-primary">{t('errorMessage')}</h2>
        {error && <p className="mt-2 text-sm text-ajin-gray-400">{error}</p>}
        <Button className="mt-6" onClick={() => setStatus('idle')}>
          {t('submit')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="operation" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('operation')}
            </label>
            <select
              id="operation"
              name="operation"
              required
              defaultValue=""
              className="w-full rounded-xl border border-ajin-border bg-white px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            >
              <option value="" disabled>
                —
              </option>
              {OPERATIONS.map((op) => (
                <option key={op} value={op}>
                  {tInm(`operations.${op}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('type')}
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue=""
              className="w-full rounded-xl border border-ajin-border bg-white px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            >
              <option value="" disabled>
                —
              </option>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {tInm(`types.${ty}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="title" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('propertyTitle')}
            </label>
            <input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={140}
              placeholder={t('propertyTitlePlaceholder')}
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="price_cop" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('price')}
            </label>
            <input
              id="price_cop"
              name="price_cop"
              required
              inputMode="numeric"
              placeholder={t('pricePlaceholder')}
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="area_m2" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('area')}
            </label>
            <input
              id="area_m2"
              name="area_m2"
              inputMode="numeric"
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-3 sm:col-span-2">
            <div>
              <label htmlFor="bedrooms" className="mb-1 block text-sm font-semibold text-ajin-text">
                {t('bedrooms')}
              </label>
              <input
                id="bedrooms"
                name="bedrooms"
                inputMode="numeric"
                className="w-full rounded-xl border border-ajin-border px-3 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="bathrooms" className="mb-1 block text-sm font-semibold text-ajin-text">
                {t('bathrooms')}
              </label>
              <input
                id="bathrooms"
                name="bathrooms"
                inputMode="numeric"
                className="w-full rounded-xl border border-ajin-border px-3 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="parking" className="mb-1 block text-sm font-semibold text-ajin-text">
                {t('parking')}
              </label>
              <input
                id="parking"
                name="parking"
                inputMode="numeric"
                className="w-full rounded-xl border border-ajin-border px-3 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="stratum" className="mb-1 block text-sm font-semibold text-ajin-text">
                {t('stratum')}
              </label>
              <input
                id="stratum"
                name="stratum"
                inputMode="numeric"
                min={1}
                max={6}
                className="w-full rounded-xl border border-ajin-border px-3 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="neighborhood"
              className="mb-1 block text-sm font-semibold text-ajin-text"
            >
              {t('neighborhood')}
            </label>
            <input
              id="neighborhood"
              name="neighborhood"
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('city')}
            </label>
            <input
              id="city"
              name="city"
              defaultValue="Bogotá"
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-semibold text-ajin-text"
            >
              {t('descriptionField')}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={5000}
              placeholder={t('descriptionPlaceholder')}
              className="w-full resize-y rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <p className="mb-1 text-sm font-semibold text-ajin-text">{t('photos')}</p>
        <p className="mb-4 text-xs text-ajin-gray-400">{t('photosHint')}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />

        <div className="flex flex-wrap gap-3">
          {photos.map((photo, idx) => (
            <div key={`${photo.name}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg bg-ajin-surface">
              <Image src={URL.createObjectURL(photo)} alt={`Foto ${idx + 1}`} fill sizes="80px" className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label={`Remove photo ${idx + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ajin-border text-ajin-gray-400 transition-colors hover:border-ajin-accent hover:text-ajin-accent"
            >
              <ImagePlus size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <h3 className="mb-5 text-lg font-semibold text-ajin-primary">{t('ownerSection')}</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="owner_name" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('name')}
            </label>
            <input
              id="owner_name"
              name="owner_name"
              required
              maxLength={120}
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="owner_phone" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('phone')}
            </label>
            <input
              id="owner_phone"
              name="owner_phone"
              required
              inputMode="tel"
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="owner_email" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('emailField')}
            </label>
            <input
              id="owner_email"
              name="owner_email"
              type="email"
              className="w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button
          type="submit"
          size="lg"
          disabled={status === 'sending'}
          className="min-w-64"
        >
          {status === 'sending' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {photos.length > 0
                ? `${t('uploadingPhotos')} ${uploadProgress}/${photos.length}`
                : t('sending')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </div>
    </form>
  );
}
