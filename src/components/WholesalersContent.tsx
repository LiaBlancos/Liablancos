'use client'

import { useState, useMemo } from 'react'
import { Product, Wholesaler, WholesalePrice } from '@/types'
import { Search, Plus, RefreshCcw, CheckCircle2, AlertTriangle, Truck, Trash2, Edit2, Package, Save, X } from 'lucide-react'
import { syncTrendyolProducts, createWholesaler, updateWholesaler, updateWholesalePrice, deleteWholesalePrice } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WholesalersContentProps {
    initialProducts: Product[]
    initialWholesalers: Wholesaler[]
    initialPrices: WholesalePrice[]
}

export default function WholesalersContent({
    initialProducts,
    initialWholesalers,
    initialPrices
}: WholesalersContentProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'active' | 'passive' | 'all'>('all')
    const [isSyncing, setIsSyncing] = useState(false)
    const [isWholesalerModalOpen, setIsWholesalerModalOpen] = useState(false)
    const [wholesalerForm, setWholesalerForm] = useState({ name: '', phone: '', note: '' })
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const filteredProducts = useMemo(() => {
        return initialProducts.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.barcode.includes(searchTerm) ||
                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && p.is_active) ||
                (statusFilter === 'passive' && !p.is_active)

            return matchesSearch && matchesStatus
        })
    }, [initialProducts, searchTerm, statusFilter])

    const handleSync = async () => {
        setIsSyncing(true)
        setSyncMessage(null)
        try {
            const result = await syncTrendyolProducts()
            if (result.success) {
                setSyncMessage({ type: 'success', text: result.message || 'Ürünler senkronize edildi.' })
                router.refresh()
            } else {
                setSyncMessage({ type: 'error', text: result.error || 'Hata oluştu.' })
            }
        } catch (e) {
            setSyncMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu.' })
        } finally {
            setIsSyncing(false)
            setTimeout(() => setSyncMessage(null), 5000)
        }
    }

    const handleAddWholesaler = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!wholesalerForm.name) return

        try {
            const result = await createWholesaler(wholesalerForm)
            if (result.success) {
                setIsWholesalerModalOpen(false)
                setWholesalerForm({ name: '', phone: '', note: '' })
                router.refresh()
            } else {
                alert(result.error)
            }
        } catch (e) {
            alert('Toptancı eklenirken hata oluştu.')
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Ürün adı, barkod veya SKU ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Aktif Ürünler</option>
                        <option value="passive">Pasif Ürünler</option>
                    </select>

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-zinc-900/10"
                    >
                        <RefreshCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                        {isSyncing ? 'Senkronize...' : "Trendyol'dan Senkronla"}
                    </button>

                    <button
                        onClick={() => setIsWholesalerModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/10"
                    >
                        <Plus className="w-4 h-4" />
                        Toptancı Ekle
                    </button>
                </div>
            </div>

            {/* Sync Feedback */}
            {syncMessage && (
                <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    syncMessage.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                )}>
                    {syncMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{syncMessage.text}</p>
                </div>
            )}

            {/* Product List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                    <ProductPriceCard
                        key={product.id}
                        product={product}
                        wholesalers={initialWholesalers}
                        prices={initialPrices.filter(p => p.product_id === product.id)}
                    />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
                    <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500">Aramanıza uygun ürün bulunamadı.</p>
                </div>
            )}

            {/* Wholesaler Modal */}
            {isWholesalerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-zinc-900">Yeni Toptancı Ekle</h3>
                            <button onClick={() => setIsWholesalerModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddWholesaler} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-zinc-500 mb-1.5 tracking-wider">Toptancı Adı *</label>
                                <input
                                    required
                                    type="text"
                                    value={wholesalerForm.name}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Tedarikçi Ltd Şti"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-zinc-500 mb-1.5 tracking-wider">Telefon</label>
                                <input
                                    type="text"
                                    value={wholesalerForm.phone}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="0532..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-zinc-500 mb-1.5 tracking-wider">Notlar</label>
                                <textarea
                                    value={wholesalerForm.note}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, note: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24 resize-none"
                                    placeholder="Bu toptancı hakkında notlar..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all mt-2"
                            >
                                Kaydet
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function ProductPriceCard({ product, wholesalers, prices }: {
    product: Product,
    wholesalers: Wholesaler[],
    prices: WholesalePrice[]
}) {
    const [isAddingPrice, setIsAddingPrice] = useState(false)
    const [newPrice, setNewPrice] = useState({ wholesaler_id: '', buy_price: 0, currency: 'TRY' })
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleSavePrice = async (wholesalerId?: string, priceVal?: number) => {
        setIsSaving(true)
        try {
            const result = await updateWholesalePrice({
                product_id: product.id,
                wholesaler_id: wholesalerId || newPrice.wholesaler_id,
                buy_price: priceVal !== undefined ? priceVal : newPrice.buy_price,
                currency: newPrice.currency,
                old_price: prices.find(p => p.wholesaler_id === (wholesalerId || newPrice.wholesaler_id))?.buy_price
            })
            if (result.success) {
                setIsAddingPrice(false)
                setNewPrice({ wholesaler_id: '', buy_price: 0, currency: 'TRY' })
                router.refresh()
            } else {
                alert(result.error)
            }
        } catch (e) {
            alert('Fiyat güncellenirken hata oluştu.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeletePrice = async (wholesalerId: string) => {
        if (!confirm('Bu toptancı fiyatını silmek istediğinize emin misiniz?')) return
        try {
            const result = await deleteWholesalePrice(product.id, wholesalerId)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        } catch (e) {
            alert('Fiyat silinirken hata oluştu.')
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col group">
            {/* Header */}
            <div className="p-5 border-b border-zinc-50 bg-zinc-50/30">
                <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="w-8 h-8 text-zinc-300" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-zinc-900 truncate flex-1" title={product.name}>{product.name}</h4>
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                            )}>
                                {product.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">Barcode: <span className="font-mono">{product.barcode}</span></p>
                        {product.sku && <p className="text-xs text-zinc-500 font-medium lowercase">SKU: <span className="font-mono">{product.sku}</span></p>}
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Stok: </span>
                        <span className="text-sm font-bold text-zinc-700">{product.quantity}</span>
                    </div>
                </div>
            </div>

            {/* Price List */}
            <div className="flex-1 p-5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Toptancı Fiyatları</h5>
                    {!isAddingPrice && (
                        <button
                            onClick={() => setIsAddingPrice(true)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Fiyat Ekle
                        </button>
                    )}
                </div>

                {prices.map(price => (
                    <div key={price.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100 group/price">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 truncate">{price.wholesalers?.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(price.last_updated_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-sm font-black text-indigo-600">{price.buy_price.toLocaleString('tr-TR')} {price.currency}</span>
                            </div>
                            <button
                                onClick={() => handleDeletePrice(price.wholesaler_id)}
                                className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover/price:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {isAddingPrice && (
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                        <div>
                            <select
                                value={newPrice.wholesaler_id}
                                onChange={e => setNewPrice({ ...newPrice, wholesaler_id: e.target.value })}
                                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="">Toptancı Seçin</option>
                                {wholesalers.filter(w => !prices.find(p => p.wholesaler_id === w.id)).map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Fiyat"
                                value={newPrice.buy_price || ''}
                                onChange={e => setNewPrice({ ...newPrice, buy_price: parseFloat(e.target.value) })}
                                className="flex-1 px-3 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <select
                                value={newPrice.currency}
                                onChange={e => setNewPrice({ ...newPrice, currency: e.target.value })}
                                className="w-20 px-2 py-2 text-sm bg-white border border-indigo-200 rounded-xl"
                            >
                                <option value="TRY">TRY</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSavePrice()}
                                disabled={!newPrice.wholesaler_id || isSaving}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 disabled:opacity-50"
                            >
                                {isSaving ? '...' : 'Kaydet'}
                            </button>
                            <button
                                onClick={() => setIsAddingPrice(false)}
                                className="px-3 py-2 bg-zinc-200 text-zinc-600 rounded-xl text-xs font-black"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                )}

                {prices.length === 0 && !isAddingPrice && (
                    <div className="py-6 text-center border-2 border-dashed border-zinc-50 rounded-2xl">
                        <Truck className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                        <p className="text-xs text-zinc-400">Henüz fiyat eklenmemiş.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
