import { createClient } from '@/core/supabase/browser';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

// -- Validasi magic bytes di browser ------------------------------------------
async function validateFileSignature(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;

  return false;
}

// -- Strip EXIF dengan redraw ke canvas ---------------------------------------
async function stripExif(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = file.type === 'image/png' ? undefined : 0.92;

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve(file);
              return;
            }
            const strippedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(strippedFile);
          },
          mimeType,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat gambar untuk strip EXIF.'));
    };

    img.src = objectUrl;
  });
}

// -- Upload satu file ke Supabase Storage -------------------------------------
export async function uploadToStorage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file melebihi batas 5MB.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Hanya JPEG dan PNG yang diizinkan.');
  }

  const isValid = await validateFileSignature(file);
  if (!isValid) {
    throw new Error('File tidak valid atau telah dimanipulasi.');
  }

  const cleanFile = await stripExif(file);

  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sesi habis. Silakan login ulang.');

  const userId = session.user.id;
  const ext = cleanFile.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('reports')
    .upload(fileName, cleanFile, {
      contentType: cleanFile.type,
      upsert: false,
    });

  if (error) throw new Error(`Gagal mengupload file: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('reports')
    .getPublicUrl(fileName);

  return publicUrl;
}

// -- Upload multiple files sekaligus ------------------------------------------
export async function uploadMultipleToStorage(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length);
    const url = await uploadToStorage(files[i]);
    urls.push(url);
  }

  return urls;
}