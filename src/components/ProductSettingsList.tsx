'use client'

import { useState, useMemo } from 'react'
import { Product } from '@/types'
import { Search, Package, Copy, Check, RefreshCcw, Save, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { updateProductSettings, syncTrendyolProducts } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ProductSettingsListProps {
    products: Product[]
}

export default function ProductSettingsList({ products }: ProductSettingsListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('active')
    const [page, setPage] = useState(1)
    const itemsPerPage = 20
    const [isSyncing, setIsSyncing] = useState(false)
    const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null)
    const [editingProduct, setEditingProduct] = useState<string | null>(null)
    const [tempData, setTempData] = useState<Partial<Product>>({})
    const router = useRouter()

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch =
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.barcode?.includes(searchTerm) ||
                p.sku?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && p.is_active) ||
                (statusFilter === 'passive' && !p.is_active)

            return matchesSearch && matchesStatus
        })
    }, [products, searchTerm, statusFilter])

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    const handleCopy = (barcode: string) => {
        navigator.clipboard.writeText(barcode)
        setCopiedBarcode(barcode)
        setTimeout(() => setCopiedBarcode(null), 2000)
    }

    const handleUpdate = async (productId: string, data: Partial<Product>) => {
        const result = await updateProductSettings(productId, data)
        if (result.success) {
            setEditingProduct(null)
            router.refresh()
        } else {
            alert('Hata: ' + result.error)
        }
    }

    const handleSync = async () => {
        setIsSyncing(true)
        const result = await syncTrendyolProducts()
        setIsSyncing(false)
        if (result.success) {
            router.refresh()
        } else {
            alert('Hata: ' + result.error)
        }
    }

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex flex-1 items-center gap-3 max-w-2xl w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Ürün adı, barkod veya SKU ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 bg-zinc-50 border-none rounded-xl text-sm font-bold text-zinc-600 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                    >
                        <option value="active">Satışta Olanlar</option>
                        <option value="passive">Satışta Olmayanlar</option>
                        <option value="all">Tüm Ürünler</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                        {isSyncing ? 'SENKRONİZE EDİLİYOR...' : 'TRENDYOL VERİSİNİ ÇEK'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20">
                        <Upload className="w-4 h-4" />
                        EXCEL YÜKLE
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-orange-50/50 border-b border-orange-100/50">
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest pl-8">Resim</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Ürün Bilgisi</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest text-center">Barkod</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Ürün Maliyeti (KDV Dahil)</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest text-center">Desi</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Marka</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Model Kodu</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Renk</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Beden</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest text-center">İade Oranı</th>
                            <th className="px-4 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest text-center">Hedef Kâr (%)</th>
                            <th className="px-6 py-4 text-[10px] font-black text-orange-900/40 uppercase tracking-widest text-right pr-8">Bugün Kargoda</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {paginatedProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                                <td className="px-4 py-3 pl-8">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Package className="w-6 h-6 text-zinc-300" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-[200px]">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-zinc-900 line-clamp-1">{p.name}</span>
                                            {p.is_active ? (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase tracking-tighter shrink-0">SATIŞTA</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black rounded uppercase tracking-tighter shrink-0">PASİF</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-medium text-zinc-400 mt-0.5">{p.sku || p.barcode}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="px-3 py-1 bg-zinc-100 rounded-lg text-[11px] font-bold text-zinc-600 border border-zinc-200/50 font-mono">
                                            {p.barcode}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(p.barcode)}
                                            className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 transition-all"
                                        >
                                            {copiedBarcode === p.barcode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={(editingProduct === p.id ? tempData.cost : p.cost) ?? ''}
                                            onChange={(e) => setTempData({ ...tempData, cost: parseFloat(e.target.value) })}
                                            onFocus={() => {
                                                setEditingProduct(p.id)
                                                setTempData({ cost: p.cost })
                                            }}
                                            onBlur={() => handleUpdate(p.id, { cost: tempData.cost })}
                                            className="w-20 px-3 py-1.5 bg-white border border-rose-100 rounded-lg text-xs font-black text-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none placeholder:text-rose-200"
                                            placeholder="0.00"
                                        />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-zinc-400">KDV</span>
                                                <input
                                                    type="number"
                                                    value={(editingProduct === p.id ? tempData.cost_vat_rate : p.cost_vat_rate) ?? 10}
                                                    onChange={(e) => setTempData({ ...tempData, cost_vat_rate: parseFloat(e.target.value) })}
                                                    onFocus={() => {
                                                        setEditingProduct(p.id)
                                                        setTempData({ cost_vat_rate: p.cost_vat_rate || 10 })
                                                    }}
                                                    onBlur={() => handleUpdate(p.id, { cost_vat_rate: tempData.cost_vat_rate })}
                                                    className="w-10 px-1 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-[10px] font-black text-zinc-600 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="number"
                                        value={editingProduct === p.id ? tempData.desi : p.desi}
                                        onChange={(e) => setTempData({ ...tempData, desi: parseFloat(e.target.value) })}
                                        onFocus={() => {
                                            setEditingProduct(p.id)
                                            setTempData({ desi: p.desi })
                                        }}
                                        onBlur={() => handleUpdate(p.id, { desi: tempData.desi })}
                                        className="w-16 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-black text-zinc-600 focus:ring-2 focus:ring-orange-500/10 text-center outline-none"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-zinc-500">{p.brand_name || 'Ev Manavı'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs font-mono font-bold text-zinc-400">#{p.model_id || '9901'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-zinc-400">{p.color || '-'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-zinc-400">{p.size || '-'}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-xs font-bold text-zinc-400">{p.return_rate ? `%${p.return_rate}` : '-'}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="text"
                                        placeholder="--"
                                        value={
                                            editingProduct === p.id
                                                ? (tempData.target_profit_margin != null ? (tempData.target_profit_margin * 100).toString().replace('.', ',') : '')
                                                : (p.target_profit_margin != null ? (p.target_profit_margin * 100).toString().replace('.', ',') : '')
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value.trim().replace('.', '').replace(',', '.')
                                            const numericVal = parseFloat(val)
                                            if (!isNaN(numericVal)) {
                                                setTempData({ ...tempData, target_profit_margin: numericVal / 100 })
                                            } else if (e.target.value === '') {
                                                setTempData({ ...tempData, target_profit_margin: null })
                                            }
                                        }}
                                        onFocus={() => {
                                            setEditingProduct(p.id)
                                            setTempData({ target_profit_margin: p.target_profit_margin })
                                        }}
                                        onBlur={() => handleUpdate(p.id, { target_profit_margin: tempData.target_profit_margin })}
                                        className="w-16 px-2 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500/10 text-center outline-none transition-all"
                                    />
                                </td>
                                <td className="px-6 py-3 text-right pr-8">
                                    <button
                                        onClick={() => handleUpdate(p.id, { is_shipped_today: !p.is_shipped_today })}
                                        className={cn(
                                            "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            p.is_shipped_today ? "bg-orange-500" : "bg-zinc-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                            p.is_shipped_today ? "translate-x-5" : "translate-x-1"
                                        )} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                    Toplam {filteredProducts.length} Ürün Listelendi
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="p-2 hover:bg-zinc-100 rounded-lg disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={cn(
                                    "w-8 h-8 rounded-lg text-xs font-black transition-all",
                                    page === i + 1 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "hover:bg-zinc-100 text-zinc-600"
                                )}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="p-2 hover:bg-zinc-100 rounded-lg disabled:opacity-30 transition-all"
                    >
                        <ChevronRight className="w-5 h-5 text-zinc-600" />
                    </button>
                </div>
            </div>
        </div>
    )
}
