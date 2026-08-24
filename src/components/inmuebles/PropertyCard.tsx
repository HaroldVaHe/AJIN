import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Maximize2, BedDouble, Bath, Car } from 'lucide-react';
import type { PublicProperty } from '@/types/property';
import { cn } from '@/lib/utils';

export default function PropertyCard({ property }: { property: PublicProperty }) {
  const t = useTranslations('inmuebles');
  const cover = property.images.find((i) => i.position === 0) ?? property.images[0];

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);

  return (
    <Link
      href={`/inmuebles/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ajin-surface">
        {cover ? (
          <Image
            src={cover.url}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ajin-gray-400">
            <Maximize2 size={40} />
          </div>
        )}
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold',
            property.operation === 'venta'
              ? 'bg-ajin-accent text-ajin-primary'
              : 'bg-ajin-primary text-white'
          )}
        >
          {t(`operations.${property.operation}`)}
        </span>
        {property.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ajin-primary">
            ★ {t('featured')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-ajin-primary">
          {property.title}
        </h3>
        {(property.neighborhood || property.city) && (
          <p className="mt-1 text-sm text-ajin-gray-400">
            {[property.neighborhood, property.city].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="mt-3 text-xl font-bold text-ajin-primary">
          ${formatPrice(property.price_cop)} COP
          {property.operation === 'arriendo' && (
            <span className="text-sm font-normal text-ajin-gray-400">{t('perMonth')}</span>
          )}
        </p>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs text-ajin-gray-400">
          {property.area_m2 && (
            <span>
              {property.area_m2} {t('specs.areaM2')}
            </span>
          )}
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <BedDouble size={14} /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms}
            </span>
          )}
          {property.parking !== null && (
            <span className="flex items-center gap-1">
              <Car size={14} /> {property.parking}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
