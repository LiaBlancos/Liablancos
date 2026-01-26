'use client'

import { useState } from 'react'
import { Product, Shelf } from '@/types'
import { Search, SlidersHorizontal, AlertTriangle, Package, MapPin, RefreshCcw, CheckCircle2 } from 'lucide-react'
import { syncTrendyolProducts } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import MinStockEditor from './MinStockEditor'
import { cn } from '@/lib/utils'

interface InventoryListProps {
    products: Product[]
    shelves: Shelf[]
}

export default function InventoryList({ products, shelves }: InventoryListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedShelfId, setSelectedShelfId] = useState<string>('all')
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleSync = async () => {
        setIsSyncing(true)
        setSyncMessage(null)

        try {
            const result = await syncTrendyolProducts()
            if (result.error) {
                setSyncMessage({ type: 'error', text: result.error })
            } else {
                setSyncMessage({ type: 'success', text: result.message || 'Başarıyla senkronize edildi.' })
                router.refresh()
            }
        } catch (error) {
            setSyncMessage({ type: 'error', text: 'Beklenmedik bir hata oluştu.' })
        } finally {
            setIsSyncing(false)
            // Auto hide message after 5 seconds
            setTimeout(() => setSyncMessage(null), 5000)
        }
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.includes(searchTerm)

        const matchesShelf = selectedShelfId === 'all' || product.shelf_id === selectedShelfId

        return matchesSearch && matchesShelf
    })

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Ürün adı veya barkod ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 sm:w-56">
                            <SlidersHorizontal className="w-5 h-5 text-zinc-400" />
                            <select
                                value={selectedShelfId}
                                onChange={(e) => setSelectedShelfId(e.target.value)}
                                className="flex-1 px-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="all">Tüm Raflar</option>
                                {shelves.map(shelf => (
                                    <option key={shelf.id} value={shelf.id}>{shelf.code}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-zinc-900/10 min-w-[160px]"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Senkronize ediliyor...' : "Trendyol'dan Çek"}
                        </button>
                    </div>
                </div>

                {/* Sync Message Feedback */}
                {syncMessage && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border animate-scale-in ${syncMessage.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                        }`}>
                        {syncMessage.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <p className="text-sm font-medium">{syncMessage.text}</p>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <p className="text-sm text-zinc-500">
                {filteredProducts.length} ürün bulundu
            </p>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ürün</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Barkod</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Konum</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kritik Limit</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stok</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {filteredProducts.map((product, index) => (
                            <tr
                                key={product.id}
                                className="hover:bg-zinc-50 transition-colors group"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-indigo-100 transition-all">
                                            <Package className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="font-medium text-zinc-900 truncate max-w-[200px]" title={product.name}>{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-zinc-600 font-bold whitespace-nowrap">{product.barcode}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {product.shelves?.code || 'Belirsiz'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <MinStockEditor productId={product.id} initialMinStock={product.min_stock} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${product.quantity <= product.min_stock
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {product.quantity <= product.min_stock && (
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        )}
                                        {product.quantity}
                                    </div>
                                    {product.damaged_quantity > 0 && (
                                        <div className="mt-1">
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 whitespace-nowrap">
                                                {product.damaged_quantity} Hasarlı
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <Package className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                                    <p className="text-zinc-500">Ürün bulunamadı</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100">
                        <Package className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                        <p className="text-zinc-500">Ürün bulunamadı</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-zinc-900 truncate" title={product.name}>{product.name}</h4>
                                        <p className="text-sm text-zinc-600 font-bold font-mono mt-0.5">{product.barcode}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold block mb-2 font-mono">
                                        {product.shelves?.code || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-50">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Kritik Limit</p>
                                    <MinStockEditor productId={product.id} initialMinStock={product.min_stock} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Hasarlı</p>
                                    <span className={cn(
                                        "inline-block px-2 py-1 rounded-lg text-xs font-bold",
                                        product.damaged_quantity > 0 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-400"
                                    )}>
                                        {product.damaged_quantity || 0}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Stok</p>
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm ${product.quantity <= product.min_stock
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {product.quantity <= product.min_stock && (
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        )}
                                        {product.quantity}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
