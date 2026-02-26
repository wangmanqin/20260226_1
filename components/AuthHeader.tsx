'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/utils/supabase';

interface AuthHeaderProps {
  userEmail: string;
}

export default function AuthHeader({ userEmail }: AuthHeaderProps) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    try {
      const client = createBrowserClient();
      setSupabase(client);
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
    }
  }, []);

  const handleSignOut = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }
    
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-600 dark:text-gray-400">
        Welcome, {userEmail}
      </span>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        Sign Out
      </button>
    </div>
  );
}