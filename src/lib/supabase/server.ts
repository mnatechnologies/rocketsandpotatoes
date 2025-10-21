import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
/* eslint-disable */

const { getToken } = await auth()

export function createServerSupabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {

        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({ template: 'supabase' })
          const headers = new Headers((options as any).headers || {})
          if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`)
          return fetch(url as any, { ...(options as any), headers })
        },
      },
    },
  )

  return supabase
}