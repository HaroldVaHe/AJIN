import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const PROPERTIES_BUCKET = 'inmuebles';
export const MAX_PHOTOS = 15;

export function createSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadPropertyPhoto(
  propertyId: number,
  file: File,
  index: number
): Promise<{ path: string; url: string } | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${propertyId}/${Date.now()}-${index}.${ext}`;
  const { error } = await supabase.storage
    .from(PROPERTIES_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (error) return null;
  const { data } = supabase.storage.from(PROPERTIES_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deletePropertyFolder(propertyId: number): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const { data } = await supabase.storage.from(PROPERTIES_BUCKET).list(`${propertyId}/`);
  if (data && data.length > 0) {
    await supabase.storage
      .from(PROPERTIES_BUCKET)
      .remove(data.map((f) => `${propertyId}/${f.name}`));
  }
}

export async function deletePropertyPhotoFile(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase.storage.from(PROPERTIES_BUCKET).remove([path]);
}
