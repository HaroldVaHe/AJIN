'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Input, Textarea } from '@/components/ui/FormFields';
import Button from '@/components/ui/Button';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { CheckCircle, Loader2 } from 'lucide-react';

interface LeadFormData {
  name: string;
  phone: string;
  message: string;
}

interface LeadFormProps {
  topic: string;
}

export default function LeadForm({ topic }: LeadFormProps) {
  const t = useTranslations('landing.form');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>();

  const whatsappMessage = (data: LeadFormData) =>
    [
      `💼 Solicitud de asesoría - ${topic}`,
      '',
      `${t('name')}: ${data.name}`,
      `${t('phone')}: ${data.phone}`,
      '',
      `${t('message')}:`,
      data.message,
    ].join('\n');

  const onSubmit = async (data: LeadFormData) => {
    const waWindow = window.open(buildWhatsAppUrl(whatsappMessage(data)), '_blank');
    try {
      const res = await fetch('/api/asesoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, topic }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      waWindow?.close();
      alert(t('errorMessage'));
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ajin-accent/10">
          <CheckCircle size={32} className="text-ajin-accent" />
        </div>
        <h3 className="text-xl font-bold text-ajin-primary mb-2">{t('successTitle')}</h3>
        <p className="text-ajin-gray-400">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="lead-name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
        error={errors.name?.message}
        {...register('name', { required: t('requiredField') })}
      />
      <Input
        id="lead-phone"
        label={t('phone')}
        placeholder={t('phonePlaceholder')}
        type="tel"
        error={errors.phone?.message}
        {...register('phone', {
          required: t('requiredField'),
          minLength: { value: 7, message: t('invalidPhone') },
        })}
      />
      <Textarea
        id="lead-message"
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
      <p className="text-xs text-ajin-gray-500 text-center">{t('privacyNote')}</p>
    </form>
  );
}
