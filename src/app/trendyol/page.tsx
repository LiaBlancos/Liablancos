'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, RefreshCcw, Search, Barcode, Tag, Package, AlertCircle, ExternalLink } from 'lucide-react'
import { fetchAllTrendyolProducts, syncTrendyolProducts } from '@/lib/actions'

interface TrendyolProduct {
    id: string
    title: string
    barcode: string
    listPrice: number
    salePrice: number
    quantity: number
    stockCode: string
    onSale: boolean
    images?: { url: string }[]
    productContentId?: number
}

export default function TrendyolPage() {
    const [products, setProducts] = useState<TrendyolProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('all')

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await fetchAllTrendyolProducts()
            if (result.error) throw new Error(result.error)
            setProducts(result.products as TrendyolProduct[] || [])
        } catch (err: any) {
            setError(err.message)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        setError(null)
        await loadProducts()
        setRefreshing(false)
    }

    const handleSync = async () => {
        setRefreshing(true)
        try {
            const result = await syncTrendyolProducts()
            if (result.error) throw new Error(result.error)
            alert(result.message || 'Ürünler başarıyla senkronize edildi.')
        } catch (err: any) {
            alert(err.message || 'Senkronizasyon sırasında hata oluştu.')
        } finally {
            setRefreshing(false)
        }
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && p.onSale) ||
            (filterStatus === 'passive' && !p.onSale)

        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 font-medium animate-pulse">Trendyol ürünleri yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Trendyol Ürünlerim</h1>
                        <p className="text-zinc-500 text-sm font-medium">{products.length} ürün listeleniyor</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="flex bg-zinc-100 p-1 rounded-2xl">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'all'
                                ? 'bg-white text-zinc-900 shadow-md shadow-zinc-200/50'
                                : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                        >
                            Hepsi
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'active'
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                        >
                            Satışta
                        </button>
                        <button
                            onClick={() => setFilterStatus('passive')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'passive'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                        >
                            Pasif
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Ürün veya barkod ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Depoya Aktar
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 bg-white border border-zinc-200 text-zinc-600 rounded-2xl hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            title="Yenile"
                        >
                            <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col items-center text-center space-y-3 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-rose-900">Bağlantı Hatası</h3>
                        <p className="text-sm text-rose-600 max-w-sm mx-auto">{error}</p>
                    </div>
                    <a href="/settings" className="px-6 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors">
                        Ayarları Kontrol Et
                    </a>
                </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                    <div
                        key={product.barcode}
                        className="group bg-white rounded-[2.5rem] border border-zinc-100 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 relative overflow-hidden flex flex-col"
                    >
                        {/* Image Section */}
                        <div className="relative h-64 bg-zinc-50 overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={product.images[0].url}
                                    alt={product.title}
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
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${product.onSale ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                    }`}>
                                    {product.onSale ? 'Satışta' : 'Kapalı'}
                                </span>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 backdrop-blur-[2px]">
                                <a
                                    href={product.productContentId ? `https://www.trendyol.com/p/${product.productContentId}` : `https://www.trendyol.com/sr?q=${product.barcode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-orange-500 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 shadow-xl"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Mağazada Gör
                                </a>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 md:p-8 flex-1 flex flex-col">
                            <div className="mb-4 md:mb-6">
                                <h3 className="font-extrabold text-zinc-900 leading-tight text-base md:text-lg mb-2 line-clamp-1 min-h-0 group-hover:text-orange-600 transition-colors" title={product.title}>
                                    {product.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg">
                                        <Barcode className="w-3 h-3 text-zinc-500" />
                                        <span className="text-[10px] md:text-xs font-black text-zinc-800 font-mono">{product.barcode}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg">
                                        <Tag className="w-3 h-3 text-zinc-500" />
                                        <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 tracking-tighter uppercase">{product.stockCode}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-auto">
                                <div className="p-4 md:p-5 bg-zinc-50 rounded-2xl md:rounded-3xl border border-zinc-100/50 group-hover:bg-white group-hover:border-orange-100 transition-all">
                                    <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 md:mb-1.5">Satış Fiyatı</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg md:text-2xl font-black text-zinc-900">{product.salePrice}</span>
                                        <span className="text-[10px] font-bold text-zinc-400">TL</span>
                                    </div>
                                </div>
                                <div className="p-4 md:p-5 bg-zinc-50 rounded-2xl md:rounded-3xl border border-zinc-100/50 group-hover:bg-white group-hover:border-orange-100 transition-all">
                                    <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 md:mb-1.5 text-right">Stok</p>
                                    <div className="flex items-baseline justify-end gap-1.5">
                                        <span className={`text-lg md:text-2xl font-black ${product.quantity === 0 ? 'text-rose-500' : 'text-zinc-900'}`}>{product.quantity}</span>
                                        <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase">ADET</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Store Button - Visible only on small screens without hover */}
                            <div className="mt-4 md:hidden">
                                <a
                                    href={product.productContentId ? `https://www.trendyol.com/p/${product.productContentId}` : `https://www.trendyol.com/sr?q=${product.barcode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Trendyol'da Gör
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && !loading && !error && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">Ürün bulunamadı</h3>
                    <p className="text-zinc-500 text-sm">Arama kriterlerinize uygun ürün bulunamadı.</p>
                </div>
            )}
        </div>
    )
}
