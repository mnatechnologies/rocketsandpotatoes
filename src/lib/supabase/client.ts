'use client'
import {useSession} from '@clerk/nextjs'
import {createClient} from '@supabase/supabase-js'
/* eslint-disable */

export function useSupabaseClient() {
  const { session } = useSession()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session?.getToken({template: 'supabase'})
          const headers = new Headers((options as any).headers || {})
          if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`)
          return fetch(url as any, {...(options as any), headers})
        },
      },
    },
  )
}