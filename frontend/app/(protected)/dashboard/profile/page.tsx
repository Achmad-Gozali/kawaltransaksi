import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const cookieStore  = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) redirect('/login');

  return <ProfileClient />;
}
