'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertCircle, Loader2, ImagePlus, Trash2, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { PropertyWithImages } from '@/types/property';
import { filesToWebp } from '@/lib/image-webp';

const OPERATIONS = ['venta', 'arriendo'] as const;
const TYPES = ['apartamento', 'casa', 'oficina', 'lote', 'bodega'] as const;
const MAX_PHOTOS = 15;

interface PropertyEditorProps {
  property?: PropertyWithImages | null;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function PropertyEditor({ property }: PropertyEditorProps) {
  const isNew = !property;
  const router = useRouter();
  const t = useTranslations('admin.editor');
  const tAdmin = useTranslations('admin');
  const tInm = useTranslations('inmuebles');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<number | null>(property?.id ?? null);
  const [status, setStatus] = useState(property?.status ?? 'approved');
  const [featured, setFeatured] = useState(property?.featured ?? false);
  const [images, setImages] = useState<PropertyWithImages['images']>(property?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const collectPayload = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? '').trim();
    return {
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
    };
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const payload = {
        ...collectPayload(e.currentTarget),
        status,
        featured,
      };

      let targetId = id;
      if (isNew || targetId === null) {
        const res = await fetch('/api/admin/inmuebles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);
        targetId = data.id;
        setId(targetId);
        router.replace(`/admin/inmuebles/${targetId}`);
      } else {
        const res = await fetch(`/api/admin/inmuebles/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);
      }

      setSaveState('saved');
      router.refresh();
    } catch (err) {
      console.error(err);
      setSaveState('error');
    }
  };

  const changeStatus = async (newStatus: string) => {
    if (id === null) return;
    await fetch(`/api/admin/inmuebles/${id}/estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus as typeof status);
    router.refresh();
  };

  const uploadPhoto = async (list: FileList | null) => {
    if (!list || list.length === 0 || id === null) return;
    setUploading(true);
    try {
      const files = await filesToWebp(list);
      for (const file of files.slice(0, MAX_PHOTOS - images.length)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/api/admin/inmuebles/${id}/foto`, {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (res.ok && data.success && data.image) {
          setImages((prev) => [...prev, data.image]);
        }
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deletePhoto = async (imageId: number) => {
    if (id === null || !confirm(t('deletePhotoConfirm'))) return;
    await fetch(`/api/admin/inmuebles/${id}/foto/${imageId}`, { method: 'DELETE' });
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    router.refresh();
  };

  const movePhoto = async (index: number, direction: number) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length || id === null) return;

    const reordered = [...images];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    const withPositions = reordered.map((img, pos) => ({ ...img, position: pos }));
    setImages(withPositions);

    await fetch(`/api/admin/inmuebles/${id}/fotos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: withPositions.map((i) => i.id) }),
    });
    router.refresh();
  };

  const makeCover = async (imageId: number) => {
    const index = images.findIndex((img) => img.id === imageId);
    if (index <= 0) return;
    await movePhoto(index, -index);
  };

  const inputCls =
    'w-full rounded-xl border border-ajin-border px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none';

  return (
    <form onSubmit={handleSave}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-ajin-primary">
            {isNew ? tAdmin('newProperty') : `#${property!.id}`}
          </h1>
          {!isNew && (
            <span className="rounded-full bg-ajin-surface px-3 py-1 text-xs font-semibold text-ajin-gray-300">
              {tAdmin(`tabs.${status}`)}
              {property!.source === 'client' ? ` · ${t('clientRequest')}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saveState === 'saved' && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 size={16} /> {t('saved')}
            </span>
          )}
          {saveState === 'error' && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle size={16} /> {t('saveError')}
            </span>
          )}
          <Button type="submit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </Button>
        </div>
      </div>

      {!isNew && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase text-ajin-gray-400">
              {t('statusLabel')}
            </span>
            <select
              value={status}
              onChange={(e) => void changeStatus(e.target.value)}
              className="rounded-xl border border-ajin-border px-4 py-2 text-sm"
            >
              <option value="pending">Pendiente</option>
              <option value="approved">Publicado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 accent-[#C9A84C]"
            />
            ★ {t('featuredLabel')}
          </label>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-5 text-lg font-semibold text-ajin-primary">{t('detailsSection')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Operación</label>
                <select name="operation" required defaultValue={property?.operation ?? ''} className={inputCls}>
                  {OPERATIONS.map((op) => (
                    <option key={op} value={op}>{tInm(`operations.${op}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Tipo</label>
                <select name="type" required defaultValue={property?.type ?? ''} className={inputCls}>
                  {TYPES.map((ty) => (
                    <option key={ty} value={ty}>{tInm(`types.${ty}`)}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Título</label>
                <input name="title" required minLength={5} maxLength={140} defaultValue={property?.title} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Precio (COP)</label>
                <input name="price_cop" required inputMode="numeric" defaultValue={property?.price_cop} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Área (m²)</label>
                <input name="area_m2" inputMode="numeric" defaultValue={property?.area_m2 ?? ''} className={inputCls} />
              </div>
              <div className="grid grid-cols-4 gap-3 sm:col-span-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ajin-text">Hab.</label>
                  <input name="bedrooms" inputMode="numeric" defaultValue={property?.bedrooms ?? ''} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ajin-text">Baños</label>
                  <input name="bathrooms" inputMode="numeric" defaultValue={property?.bathrooms ?? ''} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ajin-text">Parq.</label>
                  <input name="parking" inputMode="numeric" defaultValue={property?.parking ?? ''} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ajin-text">Estrato</label>
                  <input name="stratum" inputMode="numeric" min={1} max={6} defaultValue={property?.stratum ?? ''} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Barrio / Sector</label>
                <input name="neighborhood" defaultValue={property?.neighborhood} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Ciudad</label>
                <input name="city" defaultValue={property?.city ?? 'Bogotá'} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-ajin-text">Descripción</label>
                <textarea
                  name="description"
                  rows={5}
                  maxLength={5000}
                  defaultValue={property?.description}
                  className={`${inputCls} resize-y`}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-1 text-lg font-semibold text-ajin-primary">{t('photosSection')}</h2>
            <p className="mb-4 text-xs text-ajin-gray-400">{t('photoLimit')}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void uploadPhoto(e.target.files)}
            />

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {[...images]
                .sort((a, b) => a.position - b.position)
                .map((img, idx) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-xl bg-ajin-surface">
                    <div className="relative aspect-square">
                      <Image src={img.url} alt={`Foto ${idx + 1}`} fill sizes="200px" className="object-cover" unoptimized />
                    </div>
                    <button
                      type="button"
                      onClick={() => void deletePhoto(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="Eliminar foto"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => void movePhoto(idx, -1)}
                        disabled={idx === 0}
                        className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                        title={t('moveLeft')}
                      >
                        <ArrowLeft size={12} />
                      </button>
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => void makeCover(img.id)}
                          className="rounded-full bg-black/60 p-1 text-ajin-accent-light"
                          title={t('makeCover')}
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void movePhoto(idx, 1)}
                        disabled={idx === images.length - 1}
                        className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                        title={t('moveRight')}
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                    {idx === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-ajin-accent px-2 py-0.5 text-[10px] font-bold text-ajin-primary">
                        {t('cover')}
                      </span>
                    )}
                  </div>
                ))}

              {images.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || (!isNew && id === null)}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ajin-border text-ajin-gray-400 transition-colors hover:border-ajin-accent hover:text-ajin-accent disabled:opacity-40"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                  <span className="text-[10px]">{uploading ? t('uploading') : t('addPhoto')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {(property || isNew) && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-ajin-primary">
                {t('contactInfo')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ajin-text">Nombre</label>
                  <input name="owner_name" required maxLength={120} defaultValue={property?.owner_name} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ajin-text">Teléfono</label>
                  <input name="owner_phone" required inputMode="tel" defaultValue={property?.owner_phone} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ajin-text">Email</label>
                  <input name="owner_email" type="email" defaultValue={property?.owner_email} className={inputCls} />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </form>
  );
}
