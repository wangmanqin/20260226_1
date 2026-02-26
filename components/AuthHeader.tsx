'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface AuthHeaderProps {
  userEmail: string;
}

export default function AuthHeader({ userEmail }: AuthHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
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