import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile if not exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!existing) {
        const name =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'Usuario'

        // Use admin client to bypass RLS for profile creation
        const admin = await createAdminClient()

        const { error: profileError } = await admin.from('profiles').insert({
          user_id: data.user.id,
          name,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        })

        if (profileError) {
          return NextResponse.redirect(`${origin}/login?error=profile`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
