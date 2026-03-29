// ============================================
// 📁 LOKASI: app/admin/page.tsx
// ✅ FIX:
//    1. Hapus 'as any' cast — sekarang RPC ada di schema
//    2. Import yang tidak dipakai dihapus
// ============================================

import { createClient } from '@/lib/supabase-server';
import AdminDashboard from './AdminDashboard';

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: totalReports },
    { count: pendingCount },
    { count: verifiedCount },
    { count: rejectedCount },
    { data: reports },
    { data: users },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    // ✅ FIX: RPC sekarang ada di schema.sql
    supabase.rpc('get_reports_admin'),
    supabase.from('profiles').select('id, full_name, role, updated_at'),
  ]);

  const stats = {
    total: totalReports || 0,
    pending: pendingCount || 0,
    verified: verifiedCount || 0,
    rejected: rejectedCount || 0,
  };

  return (
    <AdminDashboard
      stats={stats}
      reports={reports ?? []}
      users={users ?? []}
    />
  );
}