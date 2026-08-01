import AdminShell from '@/features/admin/AdminShell';
import { requireAdminSession } from '@/core/auth/adminSession';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminSession();

  return (
    <AdminShell email={user.email ?? ''}>
      {children}
    </AdminShell>
  );
}
