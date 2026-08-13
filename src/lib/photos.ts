import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

const BUCKET = 'inmuebles';

// Comprime a WebP ≤200KB, lado largo 1600px. Devuelve el path relativo dentro
// del bucket (formato exigido por la policy: `{uuid}/{idx}.webp`).
export async function compressAndUpload(
  file: File,
  uploadId: string,
  index: number,
): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  });

  const path = `${uploadId}/${index}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function publicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function newUploadId(): string {
  return crypto.randomUUID();
}
