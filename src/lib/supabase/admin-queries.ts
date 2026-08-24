import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Property, PropertyStatus, PropertyWithImages } from '@/types/property';

export async function fetchAllPropertiesForAdmin(status: PropertyStatus): Promise<Property[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
  return (data as Property[] | null) ?? [];
}

export async function countPropertyImages(ids: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (ids.length === 0) return counts;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return counts;
  const { data } = await supabase
    .from('property_images')
    .select('property_id')
    .in('property_id', ids);
  for (const row of data ?? []) {
    const current = counts.get(row.property_id) ?? 0;
    counts.set(row.property_id, current + 1);
  }
  return counts;
}

export async function fetchPropertyForAdmin(
  id: string
): Promise<PropertyWithImages | null> {
  if (!/^\d+$/.test(id)) return null;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const numericId = Number(id);

  const [{ data: property }, { data: images }] = await Promise.all([
    supabase.from('properties').select('*').eq('id', numericId).maybeSingle(),
    supabase
      .from('property_images')
      .select('*')
      .eq('property_id', numericId)
      .order('position'),
  ]);

  if (!property) return null;
  return { ...(property as Property), images: (images ?? []) as PropertyWithImages['images'] };
}
