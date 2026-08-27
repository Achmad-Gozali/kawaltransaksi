const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

async function validateFileSignature(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  return false;
}

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
        if (!ctx) { URL.revokeObjectURL(objectUrl); resolve(file); return; }
        ctx.drawImage(img, 0, 0);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: mimeType, lastModified: Date.now() }));
          },
          mimeType,
          file.type === 'image/png' ? undefined : 0.92
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Gagal memuat gambar.')); };
    img.src = objectUrl;
  });
}

export async function uploadToStorage(
  file: File,
  folder: "reports" | "articles"
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error("Ukuran file melebihi batas 5MB.");
  if (!ALLOWED_MIME_TYPES.includes(file.type)) throw new Error("Tipe file tidak didukung. Hanya JPEG dan PNG.");

  const isValid = await validateFileSignature(file);
  if (!isValid) throw new Error("File tidak valid atau telah dimanipulasi.");

  const cleanFile = await stripExif(file);

  const { authClient } = await import("@/core/auth/client");
  let token = authClient.getToken();
  if (!token) {
    token = await authClient.refresh();
    if (!token) throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const formData = new FormData();
  formData.append("folder", folder);
  formData.append("file", cleanFile);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error ?? "Gagal mengunggah berkas.");
  return result.data.url;
}

export async function uploadMultipleToStorage(
  files: File[],
  folder: "reports" | "articles",
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length);
    urls.push(await uploadToStorage(files[i], folder));
  }
  return urls;
}