'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { PropertyOperation, PropertyType } from '@/types/property';

interface PropertyFiltersProps {
  operation?: PropertyOperation;
  type?: PropertyType;
}

export default function PropertyFilters({ operation, type }: PropertyFiltersProps) {
  const t = useTranslations('inmuebles');
  const pathname = usePathname();
  const basePath = '/inmuebles';

  const operations: Array<PropertyOperation | undefined> = [undefined, 'venta', 'arriendo'];
  const types: Array<PropertyType | undefined> = [
    undefined,
    'apartamento',
    'casa',
    'oficina',
    'lote',
    'bodega',
  ];

  const hrefFor = (op?: PropertyOperation, ty?: PropertyType) => {
    const params = new URLSearchParams();
    if (op) params.set('operacion', op);
    if (ty) params.set('tipo', ty);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-ajin-gray-300">
          {t('filters.operation')}:
        </span>
        {operations.map((op) => (
          <Link
            key={op ?? 'all'}
            href={hrefFor(op, type)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              operation === op
                ? 'bg-ajin-primary text-white'
                : 'bg-white text-ajin-gray-300 hover:bg-ajin-surface'
            )}
          >
            {op ? t(`operations.${op}`) : t('filters.all')}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-ajin-gray-300">{t('filters.type')}:</span>
        {types.map((ty) => (
          <Link
            key={ty ?? 'all-types'}
            href={hrefFor(operation, ty)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              type === ty
                ? 'bg-ajin-accent text-ajin-primary'
                : 'bg-white text-ajin-gray-300 hover:bg-ajin-surface'
            )}
          >
            {ty ? t(`types.${ty}`) : t('filters.allTypes')}
          </Link>
        ))}
      </div>
    </div>
  );
}
