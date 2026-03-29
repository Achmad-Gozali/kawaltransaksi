// ============================================
// 📁 LOKASI: app/admin/page.tsx
// ============================================

import { createClient } from '@/lib/supabase-server';
import {
  ShieldAlert, Clock, CheckCircle2, XCircle, FileText, Users
} from 'lucide-react';
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
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    (supabase as any).rpc('get_reports_admin'),
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