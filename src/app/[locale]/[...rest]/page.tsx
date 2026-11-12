import { notFound } from 'next/navigation';

/**
 * Cualquier ruta desconocida bajo un locale cae aquí para renderizar el
 * not-found traducido de `[locale]/not-found.tsx` en vez del 404 genérico.
 */
export default function CatchAllPage() {
  notFound();
}
