import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/admin/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_role !== 'admin') {
    redirect('/admin/login');
  }

  // Render the client component
  return <AdminDashboardClient />;
}