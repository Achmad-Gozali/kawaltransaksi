'use server';

import { createClient } from '@/lib/supabase-server';
import { analyzeChronologyText } from '@/lib/groq';

export async function submitReport(formData: {
  target_number: string;
  target_name: string;
  target_type: 'phone' | 'bank_account' | 'ewallet'; 
  category: string;
  chronology: string;
  evidence_url: string | null;
  bank_name: string | null;
  loss_amount: number | null;
  incident_date: string | null;
  platform: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Anda harus login terlebih dahulu.' };

  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count: todayCount } = await supabase
    .from('reports').select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id).gte('created_at', oneDayAgo);
  if ((todayCount ?? 0) >= 10) {
    return { success: false, error: 'Batas laporan harian tercapai (maksimal 10 laporan per hari).' };
  }

  const cleanNumber = formData.target_number.replace(/[^0-9]/g, '');
  if (cleanNumber.length < 8 || cleanNumber.length > 16) {
    return { success: false, error: 'Nomor target tidak valid (8-16 digit).' };
  }

  const trimmedChronology = formData.chronology?.trim() ?? '';
  if (trimmedChronology.length < 20) {
    return { success: false, error: 'Kronologi terlalu pendek. Minimal 20 karakter.' };
  }

  let autoStatus: 'pending' | 'verified' = 'pending';
  try {
    const aiResult = await analyzeChronologyText(trimmedChronology);
    const hasEvidence = !!formData.evidence_url;
    const detailedChronology = trimmedChronology.length >= 50;
    if (aiResult.risk_level === 'high') {
      autoStatus = 'verified';
    } else if (aiResult.risk_level === 'medium' && hasEvidence && detailedChronology) {
      autoStatus = 'verified';
    }
  } catch (err) {
    console.error('AI auto-verify error (fallback to pending):', err);
  }

  // ✅ FIX UTAMA: Mapping ewallet jadi bank_account buat di database
  const dbTargetType = formData.target_type === 'ewallet' ? 'bank_account' : formData.target_type;

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_number: cleanNumber,
    target_name: formData.target_name?.trim() || null,
    target_type: dbTargetType, 
    category: formData.category,
    chronology: trimmedChronology,
    evidence_url: formData.evidence_url || null,
    status: autoStatus,
    bank_name: formData.bank_name || null,
    loss_amount: formData.loss_amount || null,
    incident_date: formData.incident_date || null,
    platform: formData.platform || null,
  });

  if (error) {
    console.error('Report insert error:', error);
    return { success: false, error: 'Gagal mengirim laporan. Silakan coba lagi.' };
  }

  return { success: true, slug: cleanNumber, status: autoStatus };
}

export async function uploadEvidence(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Anda harus login.' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'File tidak ditemukan.' };
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Ukuran file melebihi 5MB.' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' };
  }

  const ext = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('evidence').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) { console.error('Upload error:', error); return { success: false, error: 'Gagal mengupload file.' }; }

  const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName);
  return { success: true, url: publicUrl };
}

export async function analyzeEvidence(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'File tidak ditemukan.' };
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'File terlalu besar untuk dianalisis.' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Format file tidak didukung untuk analisis AI. Gunakan JPG, PNG, atau WebP.' };
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const { analyzeEvidenceImage } = await import('@/lib/groq');
    const result = await analyzeEvidenceImage(base64, file.type);
    return { success: true, data: result };
  } catch (err) {
    console.error('AI analysis error:', err);
    const message = err instanceof Error && err.message.includes('abort')
      ? 'Analisis AI timeout. Server AI sedang sibuk, silakan coba lagi.'
      : 'Gagal menganalisis bukti. Pastikan gambar jelas dan coba lagi.';
    return { success: false, error: message };
  }
}

export async function analyzeChronology(chronology: string) {
  if (!chronology || chronology.trim().length < 20) {
    return { success: false, error: 'Kronologi terlalu pendek untuk dianalisis.' };
  }
  try {
    const { analyzeChronologyText } = await import('@/lib/groq');
    const result = await analyzeChronologyText(chronology);
    return { success: true, data: result };
  } catch (err) {
    console.error('Chronology analysis error:', err);
    return { success: false, error: 'Gagal menganalisis kronologi.' };
  }
}