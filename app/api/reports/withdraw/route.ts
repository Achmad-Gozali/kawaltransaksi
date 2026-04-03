import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json({ success: false, message: 'Report ID tidak ditemukan.' }, { status: 400 });
    }

    // Cek laporan milik user dan statusnya bukan withdrawn
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, status, reporter_id')
      .eq('id', reportId)
      .eq('reporter_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    if (report.status === 'withdrawn') {
      return NextResponse.json({ success: false, message: 'Laporan sudah ditarik.' }, { status: 400 });
    }

    // Update status jadi withdrawn
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'withdrawn' })
      .eq('id', reportId)
      .eq('reporter_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Laporan berhasil ditarik.' });
  } catch (err) {
    console.error('[withdraw] error:', err);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}