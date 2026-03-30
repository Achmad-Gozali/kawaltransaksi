'use server';

import { createClient } from '@/lib/supabase-server';
// ✅ fix 1: panggil satu pintu aja di atas biar stabil
import { analyzeChronologyText, analyzeEvidenceImage } from '@/lib/groq';

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
  link_url: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'anda harus login terlebih dahulu.' };

  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count: todayCount } = await supabase
    .from('reports').select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id).gte('created_at', oneDayAgo);
  
  if ((todayCount ?? 0) >= 10) {
    return { success: false, error: 'batas laporan harian tercapai (maksimal 10 laporan).' };
  }

  const cleanNumber = formData.target_number.replace(/[^0-9]/g, '');
  if (cleanNumber.length < 8 || cleanNumber.length > 20) {
    return { success: false, error: 'nomor target tidak valid.' };
  }

  const trimmedChronology = formData.chronology?.trim() ?? '';
  if (trimmedChronology.length < 20) {
    return { success: false, error: 'kronologi minimal 20 karakter.' };
  }

  let autoStatus: 'pending' | 'verified' = 'pending';
  try {
    // ✅ fix 2: panggil fungsi yang udah di-import di atas
    const aiResult = await analyzeChronologyText(trimmedChronology);
    if (aiResult && aiResult.risk_level === 'high') {
      autoStatus = 'verified';
    } else if (aiResult && aiResult.risk_level === 'medium' && !!formData.evidence_url && trimmedChronology.length >= 50) {
      autoStatus = 'verified';
    }
  } catch (err) {
    console.error('ai auto-verify fallback:', err);
  }

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
    link_url: formData.link_url || null,
  });

  if (error) {
    console.error('insert error:', error);
    return { success: false, error: `database error: ${error.message}` };
  }

  return { success: true, slug: cleanNumber, status: autoStatus };
}

export async function uploadEvidence(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'anda harus login.' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'file tidak ditemukan.' };
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'file maksimal 5mb.' };

  const ext = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('evidence').upload(fileName, file);
  if (error) return { success: false, error: 'gagal upload ke storage.' };

  const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName);
  return { success: true, url: publicUrl };
}

export async function analyzeEvidence(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'file tidak ada.' };

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    // ✅ fix 3: pake import yang udah didefinisikan di atas
    const result = await analyzeEvidenceImage(base64, file.type);
    return { success: true, data: result };
  } catch (err) {
    console.error('ai image error:', err);
    return { success: false, error: 'gagal analisis gambar. coba lagi nanti.' };
  }
}

export async function analyzeChronology(chronology: string) {
  if (!chronology || chronology.trim().length < 20) {
    return { success: false, error: 'kronologi terlalu pendek.' };
  }
  try {
    // ✅ fix 4: hapus dynamic import yang bikin lambat & sering eror
    const result = await analyzeChronologyText(chronology);
    if (!result) throw new Error('no result');
    return { success: true, data: result };
  } catch (err) {
    console.error('ai text error:', err);
    // ✅ fix 5: balikin pesan eror yang jelas biar frontend gak bingung
    return { success: false, error: 'server ai sedang sibuk. silakan coba beberapa saat lagi.' };
  }
}