import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // For login page, don't check auth
  // Note: We can't access the pathname directly in server components
  // So we'll handle this in the client component
  
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}