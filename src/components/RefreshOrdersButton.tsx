'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RefreshOrdersButton() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        router.refresh()
        // Provide visual feedback for at least 1 second
        setTimeout(() => {
            setIsRefreshing(false)
        }, 1000)
    }

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
                "flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-50 disabled:bg-zinc-50 text-indigo-600 font-bold rounded-2xl transition-all border border-zinc-100 shadow-sm active:scale-95",
                isRefreshing && "opacity-75 cursor-not-allowed"
            )}
        >
            <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Yenileniyor...' : 'Listeyi Yenile'}
        </button>
    )
}
