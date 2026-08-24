import { createClient } from '@supabase/supabase-js';
import type { Property, PropertyImage, PropertyWithImages } from '@/types/property';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function getPublicSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

function normalize(row: Property & { property_images?: PropertyImage[] }): PropertyWithImages {
  const { property_images, ...rest } = row;
  const images = [...(property_images ?? [])].sort((a, b) => a.position - b.position);
  return { ...rest, images };
}

export async function fetchApprovedProperties(
  operation?: string,
  type?: string
): Promise<PropertyWithImages[]> {
  try {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    let query = supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    if (operation) query = query.eq('operation', operation);
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) return [];
    return (data ?? []).map(normalize);
  } catch {
    return [];
  }
}

export async function fetchApprovedProperty(
  id: string | number
): Promise<PropertyWithImages | null> {
  if (!/^\d+$/.test(String(id))) return null;
  try {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('id', Number(id))
      .eq('status', 'approved')
      .maybeSingle();
    if (error || !data) return null;
    return normalize(data as Property & { property_images: PropertyImage[] });
  } catch {
    return null;
  }
}

export async function fetchApprovedIds(): Promise<number[]> {
  try {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('properties').select('id').eq('status', 'approved');
    return (data ?? []).map((r) => r.id as number);
  } catch {
    return [];
  }
}
