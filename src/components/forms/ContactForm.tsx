'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Input, Textarea, Select } from '@/components/ui/FormFields';
import Button from '@/components/ui/Button';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  area: string;
  message: string;
}

export default function ContactForm() {
  const t = useTranslations('contact.form');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      alert(t('errorMessage'));
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ajin-green/10">
          <CheckCircle size={32} className="text-ajin-green" />
        </div>
        <h3 className="text-xl font-bold mb-2">{t('successTitle')}</h3>
        <p className="text-ajin-gray-400">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
        error={errors.name?.message}
        {...register('name', { required: t('requiredField') })}
      />
      <Input
        id="email"
        label={t('email')}
        placeholder={t('emailPlaceholder')}
        type="email"
        error={errors.email?.message}
        {...register('email', {
          required: t('requiredField'),
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: t('invalidEmail'),
          },
        })}
      />
      <Input
        id="phone"
        label={t('phone')}
        placeholder={t('phonePlaceholder')}
        type="tel"
        error={errors.phone?.message}
        {...register('phone', {
          required: t('requiredField'),
          minLength: { value: 7, message: t('invalidPhone') },
        })}
      />
      <Select
        id="area"
        label={t('area')}
        error={errors.area?.message}
        options={[
          { value: '', label: t('areaPlaceholder') },
          { value: 'laboral', label: t('areas.laboral') },
          { value: 'familia', label: t('areas.familia') },
          { value: 'civil', label: t('areas.civil') },
          { value: 'comercial', label: t('areas.comercial') },
          { value: 'administrativo', label: t('areas.administrativo') },
          { value: 'general', label: t('areas.general') },
        ]}
        {...register('area', { required: t('requiredField') })}
      />
      <Textarea
        id="message"
        label={t('message')}
        placeholder={t('messagePlaceholder')}
        error={errors.message?.message}
        {...register('message', { required: t('requiredField') })}
      />
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            {t('sending')}
          </span>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  );
}
