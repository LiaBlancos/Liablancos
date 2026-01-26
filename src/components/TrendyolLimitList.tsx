'use client'

import { useState } from 'react'
import { Search, ShoppingBag, ExternalLink, Barcode, Package, RefreshCw, AlertTriangle } from 'lucide-react'
import MinStockEditor from './MinStockEditor'
import { cn } from '@/lib/utils'

interface TrendyolProduct {
    title: string
    barcode: string
    quantity: number
    onSale: boolean
    images: { url: string }[]
    productContentId: string
    localId?: string
    minStock: number
}

interface TrendyolLimitListProps {
    products: TrendyolProduct[]
}

export default function TrendyolLimitList({ products }: TrendyolLimitListProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
    )

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 transition-colors group-focus-within:text-orange-500" />
                <input
                    type="text"
                    placeholder="Trendyol ürünlerinde ara (başlık veya barkod)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product.barcode}
                        className={cn(
                            "group bg-white rounded-3xl border border-zinc-100 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5",
                            !product.onSale && "opacity-60 grayscale-[0.5]"
                        )}
                    >
                        <div className="flex gap-4 mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                {product.images?.[0] ? (
                                    <img src={product.images[0].url} className="w-full h-full object-cover" alt={product.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                        <ShoppingBag className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-bold text-zinc-900 leading-tight line-clamp-2 text-sm group-hover:text-orange-600 transition-colors" title={product.title}>
                                            {product.title}
                                        </h4>
                                        <a
                                            href={product.productContentId ? `https://www.trendyol.com/p/${product.productContentId}` : `https://www.trendyol.com/sr?q=${product.barcode}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-zinc-400 hover:text-orange-500 transition-colors shrink-0 bg-zinc-50 rounded-lg"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md border border-zinc-200">
                                            {product.barcode}
                                        </span>
                                        {!product.onSale && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                                                Satışta Değil
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-zinc-50">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3" />
                                    Kritik Limit
                                </p>
                                {product.localId ? (
                                    <MinStockEditor
                                        productId={product.localId}
                                        initialMinStock={product.minStock}
                                        className="justify-start"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-zinc-400 py-1 px-2 bg-zinc-50 rounded-lg border border-dashed border-zinc-200" title="Özel limit belirlemek için önce ürünü envantere çekmelisiniz">
                                        <RefreshCw className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Sync Gerekli</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center justify-end gap-1.5">
                                    <Package className="w-3 h-3" />
                                    Mağaza Stoğu
                                </p>
                                <div className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm transition-colors",
                                    product.quantity <= product.minStock
                                        ? "bg-rose-100 text-rose-700 shadow-sm shadow-rose-500/10"
                                        : "bg-orange-100 text-orange-700"
                                )}>
                                    {product.quantity}
                                    <span className="text-[10px] opacity-70">Adet</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-zinc-200">
                            <ShoppingBag className="w-12 h-12 text-zinc-200" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Ürün Bulunamadı</h3>
                        <p className="text-zinc-500">Arama kriterlerinize uygun Trendyol ürünü bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
