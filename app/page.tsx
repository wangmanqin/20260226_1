import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { getUser } from '@/utils/auth'
import { redirect } from 'next/navigation'
import AuthHeader from '@/components/AuthHeader'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const user = await getUser()

  if (!user || !user.email) {
    redirect('/auth')
  }

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full flex justify-between items-center mb-8">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Supabase Todo List
          </h1>
          <AuthHeader userEmail={user.email} />
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <ul className="w-full max-w-md space-y-2">
            {todos?.map((todo, index) => (
              <li key={index} className="p-3 border border-gray-200 rounded-md dark:border-gray-800">
                {todo}
              </li>
            )) || (
              <li className="text-gray-500 dark:text-gray-400">No todos found</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}
