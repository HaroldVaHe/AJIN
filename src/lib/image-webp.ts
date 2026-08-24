const MAX_SIDE = 1600;
const QUALITY = 0.8;

export async function fileToWebp(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('not-image');
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: QUALITY });
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function filesToWebp(files: FileList | File[]): Promise<File[]> {
  return Promise.all(Array.from(files).map(fileToWebp));
}
