import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import ContactForm from '@/components/forms/ContactForm';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.contact' });
  return { title: t('title'), description: t('description') };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const c = await getTranslations({ locale, namespace: 'common' });

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <ContactForm />
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <ContactItem icon={MapPin} label="Dirección" value={c('address')} />
                <ContactItem icon={Phone} label="Teléfono" value={c('phone')} />
                <ContactItem icon={Mail} label="Email" value={c('email')} />
                <ContactItem icon={Clock} label="Horario" value={<>Lun - Vie: 8:00 AM - 5:00 PM<br />Sáb: 8:00 AM - 12:00 PM</>}/>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-[350px] bg-ajin-gray-100 shadow-sm border border-ajin-gray-200">
              <a
                href="https://maps.app.goo.gl/jWZxs9ED1DQqqXwL7"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm font-medium hover:bg-white"
              >
                <ExternalLink size={16} />
                Abrir en Maps
              </a>

              <div className="absolute top-4 left-11 z-20 bg-ajin-transparent text-black rounded-lg px-3 py-1 shadow-md flex items-center gap-2 font-medium text-[10px] padding-[0px]">
                <MapPin size={16} color="red" />
             
              </div>

              <iframe
                title="Ubicación AJIN"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.4583979607696!2d-74.06465848940852!3d4.862587840212426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f8756b5a83819%3A0xf7d70214b9b4e686!2sAJIN!5e0!3m2!1ses-419!2sco!4v1782342593844!5m2!1ses-419!2sco"
                className="w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function ContactItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ajin-green/10 text-ajin-green">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-ajin-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-medium text-ajin-gray-700">{value}</p>
      </div>
    </div>
  );
}
