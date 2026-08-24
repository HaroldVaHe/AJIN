import { createBrowserClient } from '@supabase/ssr';

/**
 * Las credenciales se pasan como argumentos desde un Server Component
 * (props), porque las variables sin prefijo NEXT_PUBLIC_ no llegan al
 * bundle del navegador.
 */
export function createSupabaseBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
