import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, ...updateFields } = body;

    if (!reportId) {
      return NextResponse.json({ success: false, message: 'Report ID tidak ditemukan.' }, { status: 400 });
    }

    // Pastikan laporan milik user dan statusnya withdrawn
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, status, reporter_id')
      .eq('id', reportId)
      .eq('reporter_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    if (report.status !== 'withdrawn') {
      return NextResponse.json({ success: false, message: 'Hanya laporan berstatus "Sedang Direvisi" yang bisa diedit.' }, { status: 400 });
    }

    // Update laporan + kembalikan status ke pending
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        ...updateFields,
        status: 'pending', // ✅ otomatis balik ke pending setelah edit
      })
      .eq('id', reportId)
      .eq('reporter_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Laporan berhasil diperbarui.' });
  } catch (err) {
    console.error('[edit report] error:', err);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}