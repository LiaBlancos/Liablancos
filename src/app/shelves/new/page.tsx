'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createShelf } from '@/lib/actions'
import { Save, ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function NewShelfPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        code: '',
        capacity: 100
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await createShelf(formData)
            router.push('/shelves')
        } catch (err: any) {
            if (err.message.includes('unique constraint')) {
                setError('Bu raf kodu zaten kullanımda.')
            } else {
                setError('Raf oluşturulamadı.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/shelves" className="p-2.5 hover:bg-zinc-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-zinc-600" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Yeni Raf</h1>
                        <p className="text-zinc-500 text-sm">Yeni raf konumu ekleyin</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Raf Kodu</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="Örn: A-01"
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <p className="text-xs text-zinc-400 mt-1.5">Büyük harf ve rakam kullanın</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Kapasite (Adet)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.capacity}
                            onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Rafı Oluştur
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
