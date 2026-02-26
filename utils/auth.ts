import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getUserSession() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getUserSession();
  return session?.user;
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  await supabase.auth.signOut();
}