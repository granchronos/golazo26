import { createServerClient } from '@supabase/ssr'
import { createClient as createBaseClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookies can't be set
          }
        },
      },
    }
  )
}

// Use globalThis to survive HMR in dev; in serverless each invocation gets its own scope anyway.
const globalForAdmin = globalThis as unknown as { __supabaseAdmin?: SupabaseClient<Database> }

export async function createAdminClient() {
  if (!globalForAdmin.__supabaseAdmin) {
    globalForAdmin.__supabaseAdmin = createBaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  }
  return globalForAdmin.__supabaseAdmin
}
