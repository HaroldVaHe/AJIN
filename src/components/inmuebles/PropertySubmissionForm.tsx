'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CheckCircle2, AlertCircle, Loader2, ImagePlus, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { filesToWebp } from '@/lib/image-webp';
import { DEPARTMENTS, getCitiesForDepartment, composeDescription } from '@/lib/colombia-geo';

const OPERATIONS = ['venta', 'arriendo'] as const;
const TYPES = ['apartamento', 'casa', 'oficina', 'lote', 'bodega'] as const;
const MAX_PHOTOS = 15;

type Status = 'idle' | 'sending' | 'success' | 'error';

interface FormValues {
  operation: string;
  type: string;
  title: string;
  price_cop: string;
  area_m2: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  stratum: string;
  neighborhood: string;
  department: string;
  city: string;
}

const INITIAL_VALUES: FormValues = {
  operation: '',
  type: '',
  title: '',
  price_cop: '',
  area_m2: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  stratum: '',
  neighborhood: '',
  department: '',
  city: '',
};

export default function PropertySubmissionForm() {
  const t = useTranslations('inmuebles.publish');
  const tInm = useTranslations('inmuebles');
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [photos, setPhotos] = useState<Array<{ file: File; preview: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const cities = getCitiesForDepartment(values.department);

  const setValue = (key: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const preset = composeDescription({
    operation: values.operation,
    type: values.type,
    neighborhood: values.neighborhood,
    city: values.city,
    department: values.department,
    area_m2: Number(values.area_m2) || null,
    bedrooms: Number(values.bedrooms) || null,
    bathrooms: Number(values.bathrooms) || null,
    parking: Number(values.parking) || null,
    stratum: Number(values.stratum) || null,
  });
  const description = descriptionTouched ? descriptionValue : preset;

  const handleFilesSelected = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    try {
      const converted = await filesToWebp(Array.from(list));
      const valid = converted.filter((f) => f.type.startsWith('image/'));
      if (valid.length > 0) {
        setPhotos((prev) =>
          [...prev, ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(
            0,
            MAX_PHOTOS
          )
        );
      }
      const skipped = converted.length - valid.length;
      if (skipped > 0) {
        setError(`${skipped} archivo(s) no válidos omitidos`);
      }
    } catch (err) {
      console.error('Photo processing failed:', err);
      setError('No se pudieron procesar las fotos. Intenta con otras imágenes.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) =>
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('sending');

    const payload = {
      operation: values.operation,
      type: values.type,
      title: values.title.trim(),
      description: description.slice(0, 5000),
      price_cop: Number(values.price_cop),
      area_m2: Number(values.area_m2) || null,
      bedrooms: Number(values.bedrooms) || null,
      bathrooms: Number(values.bathrooms) || null,
      parking: Number(values.parking) || null,
      stratum: Number(values.stratum) || null,
      neighborhood: values.neighborhood.trim(),
      city: values.city.trim(),
      department: values.department,
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim(),
      owner_email: String(new FormData(e.currentTarget).get('owner_email') ?? '').trim(),
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
        fd.append('file', photos[i].file);
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

  const inputCls =
    'w-full rounded-xl border border-ajin-border bg-white px-4 py-2.5 text-sm focus:border-ajin-accent focus:outline-none';

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="operation" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('operation')}
            </label>
            <select id="operation" required value={values.operation} onChange={setValue('operation')} className={inputCls}>
              <option value="" disabled>—</option>
              {OPERATIONS.map((op) => (
                <option key={op} value={op}>{tInm(`operations.${op}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('type')}
            </label>
            <select id="type" required value={values.type} onChange={setValue('type')} className={inputCls}>
              <option value="" disabled>—</option>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>{tInm(`types.${ty}`)}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="title" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('propertyTitle')}
            </label>
            <input
              id="title"
              required
              minLength={5}
              maxLength={140}
              placeholder={t('propertyTitlePlaceholder')}
              value={values.title}
              onChange={setValue('title')}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="department" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('department')}
            </label>
            <select
              id="department"
              required
              value={values.department}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, department: e.target.value, city: '' }))
              }
              className={inputCls}
            >
              <option value="" disabled>{t('selectDepartment')}</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('city')}
            </label>
            <select
              id="city"
              required
              disabled={!values.department}
              value={values.city}
              onChange={setValue('city')}
              className={`${inputCls} disabled:cursor-not-allowed disabled:bg-ajin-surface`}
            >
              <option value="" disabled>
                {values.department ? t('selectCity') : t('cityDisabledHint')}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="neighborhood" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('neighborhood')}
            </label>
            <input id="neighborhood" maxLength={140} value={values.neighborhood} onChange={setValue('neighborhood')} className={inputCls} />
          </div>

          <div>
            <label htmlFor="price_cop" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('price')}
            </label>
            <input id="price_cop" required inputMode="numeric" placeholder={t('pricePlaceholder')} value={values.price_cop} onChange={setValue('price_cop')} className={inputCls} />
          </div>

          <div className="grid grid-cols-4 gap-3 sm:col-span-2">
            <div>
              <label htmlFor="area_m2" className="mb-1 block text-xs font-semibold text-ajin-text">{t('area')}</label>
              <input id="area_m2" inputMode="numeric" value={values.area_m2} onChange={setValue('area_m2')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="bedrooms" className="mb-1 block text-xs font-semibold text-ajin-text">{t('bedrooms')}</label>
              <input id="bedrooms" inputMode="numeric" value={values.bedrooms} onChange={setValue('bedrooms')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="bathrooms" className="mb-1 block text-xs font-semibold text-ajin-text">{t('bathrooms')}</label>
              <input id="bathrooms" inputMode="numeric" value={values.bathrooms} onChange={setValue('bathrooms')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="parking" className="mb-1 block text-xs font-semibold text-ajin-text">{t('parking')}</label>
              <input id="parking" inputMode="numeric" value={values.parking} onChange={setValue('parking')} className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="stratum" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('stratum')}
            </label>
            <select id="stratum" value={values.stratum} onChange={setValue('stratum')} className={inputCls}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('descriptionField')}
            </label>
            {preset && !descriptionTouched && (
              <p className="mb-2 text-xs italic text-ajin-gray-400">{t('descriptionPresetHint')}</p>
            )}
            <textarea
              id="description"
              rows={5}
              maxLength={5000}
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => {
                setDescriptionTouched(true);
                setDescriptionValue(e.target.value);
              }}
              className={`${inputCls} resize-y`}
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
            <div key={`${photo.file.name}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg bg-ajin-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
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
              required
              maxLength={120}
              autoComplete="name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="owner_phone" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('phone')}
            </label>
            <input
              id="owner_phone"
              required
              inputMode="tel"
              autoComplete="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="owner_email" className="mb-1 block text-sm font-semibold text-ajin-text">
              {t('emailField')}
            </label>
            <input id="owner_email" name="owner_email" type="email" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button type="submit" size="lg" disabled={status === 'sending'} className="min-w-64">
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
