import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Dashboard from './dashboard-component';
// export const revalidate = 480;
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1.0.0/todos`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  });

  const { todos } = await res.json();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Dashboard
      user={user?.user_metadata}
      initialTodos={todos || []}
      token={session?.access_token}
    />
  );
}
