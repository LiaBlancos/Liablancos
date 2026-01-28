'use client'

import { useState, useMemo } from 'react'
import { Product, Wholesaler, WholesalePrice } from '@/types'
import { Search, Plus, RefreshCcw, CheckCircle2, AlertTriangle, Truck, Trash2, Edit2, Package, Save, X, Barcode, Tag, ExternalLink, Phone, MapPin } from 'lucide-react'
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all')
    const [isSyncing, setIsSyncing] = useState(false)
    const [isWholesalerModalOpen, setIsWholesalerModalOpen] = useState(false)
    const [editingWholesaler, setEditingWholesaler] = useState<Wholesaler | null>(null)
    const [wholesalerForm, setWholesalerForm] = useState({ name: '', phone: '', address: '', note: '' })
    const [selectedWholesaler, setSelectedWholesaler] = useState<Wholesaler | null>(null)
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
            let result;
            if (editingWholesaler) {
                result = await updateWholesaler(editingWholesaler.id, wholesalerForm)
            } else {
                result = await createWholesaler(wholesalerForm)
            }

            if (result.success) {
                setIsWholesalerModalOpen(false)
                setEditingWholesaler(null)
                setWholesalerForm({ name: '', phone: '', address: '', note: '' })
                router.refresh()
            } else {
                if (result.error?.includes('duplicate key')) {
                    alert('Bu isimde bir toptancı zaten kayıtlı. Mevcut toptancıyı düzenleyebilir veya farklı bir isim seçebilirsiniz.')
                } else {
                    alert(result.error)
                }
            }
        } catch (e) {
            alert('Toptancı kaydedilirken hata oluştu.')
        }
    }

    return (
        <div className="space-y-8 pb-12 animate-fade">
            {/* Header Area - Perfect Match with Trendyol Style */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Truck className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-1">Toptancılar</h1>
                        <p className="text-zinc-500 text-sm font-medium">{initialProducts.length} ürün listeleniyor</p>
                    </div>
                </div>

                {/* Status Toggle - Centered on Desktop */}
                <div className="flex bg-zinc-100 p-1 rounded-2xl self-start md:self-auto">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'all'
                            ? 'bg-white text-zinc-900 shadow-md shadow-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        Hepsi
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'active'
                            ? 'bg-white text-emerald-600 shadow-md shadow-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        Aktif
                    </button>
                    <button
                        onClick={() => setStatusFilter('passive')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'passive'
                            ? 'bg-white text-rose-600 shadow-md shadow-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        Pasif
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 xl:flex-none justify-end">
                    <div className="relative w-full md:w-64 lg:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Ürün veya barkod ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex-1 md:flex-none flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10 active:scale-95 disabled:opacity-50 h-[46px]"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Senkronla
                        </button>
                        <button
                            onClick={() => setIsWholesalerModalOpen(true)}
                            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95 w-[46px] h-[46px] flex items-center justify-center shrink-0"
                            title="Toptancı Ekle"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sync Feedback */}
            {syncMessage && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    syncMessage.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                )}>
                    {syncMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{syncMessage.text}</p>
                </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                    <ProductPriceCard
                        key={product.id}
                        product={product}
                        wholesalers={initialWholesalers}
                        prices={initialPrices.filter(p => p.product_id === product.id)}
                        onShowWholesaler={(name) => {
                            const w = initialWholesalers.find(wh => wh.name === name)
                            if (w) setSelectedWholesaler(w)
                        }}
                    />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">Ürün bulunamadı</h3>
                    <p className="text-zinc-500 text-sm">Arama kriterlerinize uygun ürün bulunamadı.</p>
                </div>
            )}

            {/* Wholesaler Modal */}
            {isWholesalerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                                {editingWholesaler ? 'Toptancı Düzenle' : 'Yeni Toptancı Ekle'}
                            </h3>
                            <button onClick={() => {
                                setIsWholesalerModalOpen(false)
                                setEditingWholesaler(null)
                                setWholesalerForm({ name: '', phone: '', address: '', note: '' })
                            }} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddWholesaler} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest ml-1">Toptancı Adı *</label>
                                <input
                                    required
                                    type="text"
                                    value={wholesalerForm.name}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
                                    placeholder="Tedarikçi Ltd Şti"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest ml-1">Telefon</label>
                                <input
                                    type="text"
                                    value={wholesalerForm.phone}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, phone: e.target.value })}
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
                                    placeholder="0532..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest ml-1">Adres</label>
                                <textarea
                                    value={wholesalerForm.address}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, address: e.target.value })}
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none h-24 resize-none"
                                    placeholder="Mahalle, Sokak, No..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest ml-1">Notlar</label>
                                <textarea
                                    value={wholesalerForm.note}
                                    onChange={e => setWholesalerForm({ ...wholesalerForm, note: e.target.value })}
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none h-24 resize-none"
                                    placeholder="Bu toptancı hakkında notlar..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all mt-4 active:scale-[0.98]"
                            >
                                Kaydet
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Wholesaler Details Modal */}
            {selectedWholesaler && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                    <Truck className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">{selectedWholesaler.name}</h3>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Toptancı Detayları</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditingWholesaler(selectedWholesaler)
                                        setWholesalerForm({
                                            name: selectedWholesaler.name,
                                            phone: selectedWholesaler.phone || '',
                                            address: selectedWholesaler.address || '',
                                            note: selectedWholesaler.note || ''
                                        })
                                        setIsWholesalerModalOpen(true)
                                        setSelectedWholesaler(null)
                                    }}
                                    className="p-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                                    title="Düzenle"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setSelectedWholesaler(null)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            {selectedWholesaler.phone && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefon</label>
                                    <a
                                        href={`tel:${selectedWholesaler.phone}`}
                                        className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50 group transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center group-hover:border-indigo-100">
                                            <Phone className="w-4 h-4 text-zinc-600 group-hover:text-indigo-600" />
                                        </div>
                                        <span className="text-lg font-black text-zinc-900 group-hover:text-indigo-700">{selectedWholesaler.phone}</span>
                                    </a>
                                </div>
                            )}

                            {selectedWholesaler.address && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Adres</label>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWholesaler.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50 group transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center group-hover:border-emerald-100">
                                            <MapPin className="w-4 h-4 text-zinc-600 group-hover:text-emerald-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700 line-clamp-2">{selectedWholesaler.address}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight mt-0.5">Haritada Gör</p>
                                        </div>
                                    </a>
                                </div>
                            )}

                            {!selectedWholesaler.phone && !selectedWholesaler.address && (
                                <div className="p-8 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                                    <AlertTriangle className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-zinc-400">Bu toptancı için telefon veya adres bilgisi kaydedilmemiş.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ProductPriceCard({ product, wholesalers, prices, onShowWholesaler }: {
    product: Product,
    wholesalers: Wholesaler[],
    prices: WholesalePrice[],
    onShowWholesaler: (name: string) => void
}) {
    const [isAddingPrice, setIsAddingPrice] = useState(false)
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<number>(0)
    const [newPrice, setNewPrice] = useState({ wholesaler_id: '', buy_price: 0, currency: 'TRY' })
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const minPrice = useMemo(() => {
        if (prices.length === 0) return null
        return Math.min(...prices.map(p => p.buy_price))
    }, [prices])

    const handleSavePrice = async (wholesalerId?: string, priceVal?: number) => {
        setIsSaving(true)
        try {
            const result = await updateWholesalePrice({
                product_id: product.id,
                wholesaler_id: wholesalerId || newPrice.wholesaler_id,
                buy_price: priceVal !== undefined ? priceVal : newPrice.buy_price,
                currency: 'TRY', // Default to TRY for now
                old_price: prices.find(p => p.wholesaler_id === (wholesalerId || newPrice.wholesaler_id))?.buy_price
            })
            if (result.success) {
                setIsAddingPrice(false)
                setEditingPriceId(null)
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
        <div className="group bg-white rounded-[2.5rem] border border-zinc-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden flex flex-col">
            {/* Image Section */}
            <div className="relative h-64 bg-zinc-50 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                        <Package className="w-12 h-12 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Görsel Yok</span>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${product.is_active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                        {product.is_active ? 'Satışta' : 'Kapalı'}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="mb-6">
                    <h3 className="font-extrabold text-zinc-900 leading-tight text-base md:text-lg mb-3 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={product.name}>
                        {product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg">
                            <Barcode className="w-3 h-3 text-zinc-500" />
                            <span className="text-[10px] md:text-xs font-black text-zinc-800 font-mono">{product.barcode}</span>
                        </div>
                        {product.sku && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg">
                                <Tag className="w-3 h-3 text-zinc-500" />
                                <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 tracking-tighter uppercase">{product.sku}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 md:p-5 bg-zinc-50 rounded-[1.5rem] border border-zinc-100/50 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                        <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">En Düşük Alış</p>
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                "text-lg md:text-2xl font-black",
                                minPrice ? "text-indigo-600" : "text-zinc-300"
                            )}>{minPrice ? minPrice.toLocaleString('tr-TR') : '---'}</span>
                            <span className="text-[10px] font-bold text-zinc-400">TL</span>
                        </div>
                    </div>
                    <div className="p-4 md:p-5 bg-zinc-50 rounded-[1.5rem] border border-zinc-100/50 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                        <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 text-right">Stok</p>
                        <div className="flex items-baseline justify-end gap-1.5">
                            <span className={`text-lg md:text-2xl font-black ${product.quantity === 0 ? 'text-rose-500' : 'text-zinc-900'}`}>{product.quantity}</span>
                            <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase">ADET</span>
                        </div>
                    </div>
                </div>

                {/* Wholesaler Prices List - Enhanced */}
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Toptancı Fiyatları</h4>
                        <button
                            onClick={() => setIsAddingPrice(!isAddingPrice)}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700 transition-colors"
                        >
                            {isAddingPrice ? (
                                <><X className="w-3 h-3" /> Vazgeç</>
                            ) : (
                                <><Plus className="w-3 h-3" /> Fiyat Ekle</>
                            )}
                        </button>
                    </div>

                    {isAddingPrice && (
                        <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-3 animate-in zoom-in-95 duration-200">
                            <select
                                value={newPrice.wholesaler_id}
                                onChange={e => setNewPrice({ ...newPrice, wholesaler_id: e.target.value })}
                                className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium outline-none"
                            >
                                <option value="">Toptancı Seçin</option>
                                {wholesalers.filter(w => !prices.find(p => p.wholesaler_id === w.id)).map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="number"
                                    placeholder="Alış Fiyatı"
                                    value={newPrice.buy_price || ''}
                                    onChange={e => setNewPrice({ ...newPrice, buy_price: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                />
                                <button
                                    onClick={() => handleSavePrice()}
                                    disabled={!newPrice.wholesaler_id || isSaving}
                                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-indigo-600/10 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Kaydediliyor...' : 'Fiyatı Kaydet'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {prices.map(price => (
                            <div key={price.id} className="group/price flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100/50 hover:bg-white hover:border-zinc-200 transition-all gap-3">
                                <div className="min-w-0 flex-1">
                                    <button
                                        onClick={() => onShowWholesaler(price.wholesalers?.name || '')}
                                        className="text-sm font-bold text-zinc-800 truncate hover:text-indigo-600 transition-colors block text-left"
                                    >
                                        {price.wholesalers?.name}
                                    </button>
                                    <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{new Date(price.last_updated_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                    {editingPriceId === price.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="number"
                                                value={editValue}
                                                onChange={e => setEditValue(parseFloat(e.target.value))}
                                                className="w-20 px-2 py-1 text-sm font-black border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            />
                                            <button
                                                onClick={() => handleSavePrice(price.wholesaler_id, editValue)}
                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingPriceId(null)}
                                                className="p-1 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-black text-zinc-900">{price.buy_price.toLocaleString('tr-TR')} TL</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingPriceId(price.id)
                                                        setEditValue(price.buy_price)
                                                    }}
                                                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrice(price.wholesaler_id)}
                                                    className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {prices.length === 0 && !isAddingPrice && (
                            <div className="py-8 text-center bg-zinc-50/50 rounded-3xl border-2 border-dashed border-zinc-100">
                                <Truck className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-bold text-zinc-400">Fiyat bulunmuyor</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
