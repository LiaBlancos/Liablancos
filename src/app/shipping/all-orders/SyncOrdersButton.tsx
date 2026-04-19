'use client'

import { useState } from 'react'
import { RefreshCcw, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SyncOrdersButton() {
    const [isSyncing, setIsSyncing] = useState(false)
    const router = useRouter()

    const handleSync = async () => {
        try {
            setIsSyncing(true)
            const res = await fetch('/api/cron/sync-orders')
            const data = await res.json()
            
            if (data.success) {
                // Refresh the page data
                router.refresh()
            } else {
                alert('Eşitleme hatası: ' + data.error)
            }
        } catch (error) {
            console.error('Eşitleme başarısız:', error)
            alert('Sunucuyla bağlantı kurulamadı.')
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                isSyncing 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow border border-slate-200'
            }`}
        >
            {isSyncing ? (
                <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Eşitleniyor...
                </>
            ) : (
                <>
                    <Database className="w-4 h-4" />
                    Siparişleri Veritabanına Eşitle
                </>
            )}
        </button>
    )
}
