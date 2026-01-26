'use client'

import { useAuth } from '@/components/AuthContext'
import { usePathname } from 'next/navigation'
import AppShell from '@/components/AppShell'
import LoginPage from '@/app/login/page'
import { Loader2, Warehouse } from 'lucide-react'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const pathname = usePathname()

    // Show loading screen while checking session
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-6 animate-pulse">
                        <Warehouse className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Yükleniyor...</span>
                    </div>
                </div>
            </div>
        )
    }

    // If not authenticated and not on login page, show login
    if (!user && pathname !== '/login') {
        return <LoginPage />
    }

    // If authenticated and on login page, redirect to home
    if (user && pathname === '/login') {
        return (
            <AppShell>
                {children}
            </AppShell>
        )
    }

    // If not authenticated but on login page
    if (!user && pathname === '/login') {
        return <LoginPage />
    }

    // Authenticated user - show app
    return (
        <AppShell>
            {children}
        </AppShell>
    )
}
