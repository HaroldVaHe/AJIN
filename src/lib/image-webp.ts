const MAX_SIDE = 1600;
const QUALITY = 0.8;
const CONVERT_TIMEOUT_MS = 8000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('conversion-timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/**
 * Convierte una imagen a WebP redimensionada. Nunca lanza: si el navegador
 * no soporta OffscreenCanvas/createImageBitmap, el archivo es ilegible
 * (p. ej. HEIC con MIME vacío en iOS) o la conversión se demora demasiado,
 * devuelve el archivo original.
 */
export async function fileToWebp(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await withTimeout(createImageBitmap(file), CONVERT_TIMEOUT_MS);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await withTimeout(canvas.convertToBlob({ type: 'image/webp', quality: QUALITY }), CONVERT_TIMEOUT_MS);
    // Si la conversión produce un archivo mayor que el original, conservar el original.
    if (blob.size >= file.size && file.size > 0) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}

/** Convierte varias imágenes; los archivos ilegibles se devuelven tal cual. */
export async function filesToWebp(files: FileList | File[]): Promise<File[]> {
  return Promise.all(Array.from(files).map(fileToWebp));
}
