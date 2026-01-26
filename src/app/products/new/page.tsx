'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createProduct, getShelves } from '@/lib/actions'
import { Shelf } from '@/types'
import { Save, ArrowLeft, Package, MapPin } from 'lucide-react'
import Link from 'next/link'

function NewProductForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialBarcode = searchParams.get('barcode') || ''

    const [shelves, setShelves] = useState<Shelf[]>([])
    const [formData, setFormData] = useState({
        name: '',
        barcode: initialBarcode,
        description: '',
        min_stock: 5,
        quantity: 0,
        shelf_id: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getShelves().then(setShelves)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await createProduct({
                ...formData,
                shelf_id: formData.shelf_id || null
            })
            router.push('/inventory')
        } catch (err: any) {
            setError(err.message || 'Ürün oluşturulamadı.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/stock-in" className="p-2.5 hover:bg-zinc-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-zinc-600" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Yeni Ürün</h1>
                        <p className="text-zinc-500 text-sm">Ürün bilgilerini girin</p>
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
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Barkod</label>
                        <input
                            type="text"
                            required
                            value={formData.barcode}
                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <p className="text-xs text-zinc-400 mt-1.5">Okutulan barkod otomatik gelir</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Ürün Adı</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: iPhone 15 Kılıf"
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Açıklama (Opsiyonel)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Shelf Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-zinc-400" />
                                Raf Konumu (Opsiyonel)
                            </span>
                        </label>
                        <select
                            value={formData.shelf_id}
                            onChange={e => setFormData({ ...formData, shelf_id: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                            <option value="">Raf seçilmedi</option>
                            {shelves.map(shelf => (
                                <option key={shelf.id} value={shelf.id}>{shelf.code}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-400 mt-1.5">Daha sonra da atayabilirsiniz</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Başlangıç Stoğu</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Kritik Stok</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.min_stock}
                                onChange={e => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-all"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Ürünü Kaydet
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default function NewProductPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <NewProductForm />
        </Suspense>
    )
}
