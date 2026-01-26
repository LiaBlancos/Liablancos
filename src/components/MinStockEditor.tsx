'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { updateProductMinStock } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface MinStockEditorProps {
    productId: string
    initialMinStock: number
    className?: string
}

export default function MinStockEditor({ productId, initialMinStock, className }: MinStockEditorProps) {
    const [minStock, setMinStock] = useState(initialMinStock)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanged, setHasChanged] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateProductMinStock(productId, minStock)
            setHasChanged(false)
            router.refresh()
        } catch (error) {
            console.error('Failed to update min stock:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className={cn("flex items-center justify-center gap-2 group/editor", className)}>
            <input
                type="number"
                value={minStock}
                onChange={(e) => {
                    setMinStock(parseInt(e.target.value) || 0)
                    setHasChanged(true)
                }}
                className="w-16 px-2 py-1 text-center bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {hasChanged && (
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                    title="Kaydet"
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
    )
}
