import { createClient } from '@supabase/supabase-js'

// In Next.js, access process.env.NEXT_PUBLIC_* directly in the export
// to ensure the bundler handles the replacement correctly.
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

// Log environment variables on the server
if (typeof window === 'undefined') {
    console.log('DEBUG [Server]: Checking Supabase Env Vars...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING')
    console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING')
}

if (typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('CRITICAL [Client]: Supabase environment variables are missing!')
    }
}
