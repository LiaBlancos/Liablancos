'use client'

import { useState } from 'react'
import { Package, ShoppingBag, MapPin, ExternalLink, Barcode, AlertTriangle, ChevronRight, TrendingDown, RefreshCw } from 'lucide-react'
import MinStockEditor from './MinStockEditor'

interface LowStockListProps {
    warehouseProducts: any[]
    trendyolProducts: any[]
}

export default function LowStockList({ warehouseProducts, trendyolProducts }: LowStockListProps) {
    const [activeTab, setActiveTab] = useState<'warehouse' | 'trendyol'>('warehouse')

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Summary Hero Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setActiveTab('warehouse')}
                    className={`relative overflow-hidden p-6 rounded-[2rem] border-2 transition-all duration-500 text-left ${activeTab === 'warehouse'
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xl shadow-zinc-900/20 scale-[1.02]'
                        : 'bg-white border-zinc-100 text-zinc-900 hover:border-zinc-200'
                        }`}
                >
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'warehouse' ? 'bg-white/10' : 'bg-amber-100'}`}>
                            <Package className={`w-6 h-6 ${activeTab === 'warehouse' ? 'text-white' : 'text-amber-600'}`} />
                        </div>
                        {activeTab === 'warehouse' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                    <div className="relative z-10">
                        <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${activeTab === 'warehouse' ? 'text-zinc-400' : 'text-zinc-500'}`}>Depo Stoğu</p>
                        <h3 className="text-3xl font-black">{warehouseProducts.length} <span className="text-lg font-medium opacity-60">Kritik Ürün</span></h3>
                    </div>
                    {/* Decorative Background Icon */}
                    <Package className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.03] rotate-12 transition-transform duration-700 ${activeTab === 'warehouse' ? 'scale-110' : 'scale-100'}`} />
                </button>

                <button
                    onClick={() => setActiveTab('trendyol')}
                    className={`relative overflow-hidden p-6 rounded-[2rem] border-2 transition-all duration-500 text-left ${activeTab === 'trendyol'
                        ? 'bg-orange-600 border-orange-600 text-white shadow-2xl shadow-orange-600/20 scale-[1.02]'
                        : 'bg-white border-zinc-100 text-zinc-900 hover:border-zinc-200'
                        }`}
                >
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'trendyol' ? 'bg-white/10' : 'bg-orange-100'}`}>
                            <ShoppingBag className={`w-6 h-6 ${activeTab === 'trendyol' ? 'text-white' : 'text-orange-600'}`} />
                        </div>
                        {activeTab === 'trendyol' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                    </div>
                    <div className="relative z-10">
                        <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${activeTab === 'trendyol' ? 'text-orange-100' : 'text-zinc-500'}`}>Trendyol Mağaza</p>
                        <h3 className="text-3xl font-black">{trendyolProducts.length} <span className="text-lg font-medium opacity-60">Kritik Ürün</span></h3>
                    </div>
                    {/* Decorative Background Icon */}
                    <ShoppingBag className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.05] rotate-12 transition-transform duration-700 ${activeTab === 'trendyol' ? 'scale-110' : 'scale-100'}`} />
                </button>
            </div>

            {/* List Header & Content */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'warehouse' ? 'bg-zinc-900 text-white' : 'bg-orange-600 text-white'}`}>
                            {activeTab === 'warehouse' ? <Package className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900">
                                {activeTab === 'warehouse' ? 'Depo Kritik Listesi' : 'Mağaza Kritik Listesi'}
                            </h2>
                            <p className="text-sm text-zinc-500 font-medium">Bu ürünlerin stoğu tükenmek üzere.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Acil Müdahale Gerekli</span>
                    </div>
                </div>

                <div className="p-4 md:p-8">
                    {activeTab === 'warehouse' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {warehouseProducts.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-emerald-200">
                                        <Package className="w-10 h-10 text-emerald-500 opacity-40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900">Harika Haber!</h3>
                                    <p className="text-zinc-500">Depoda kritik seviyede ürün bulunmuyor.</p>
                                </div>
                            ) : (
                                warehouseProducts.map((product) => (
                                    <div key={product.id} className="group flex items-center gap-5 p-5 bg-zinc-50/50 rounded-3xl border border-transparent hover:border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-zinc-500/5 transition-all duration-500">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                            <Package className="w-7 h-7 text-amber-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-zinc-900 truncate max-w-[200px] mb-1 group-hover:text-indigo-600 transition-colors" title={product.name}>
                                                {product.name}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[11px] font-black text-zinc-800 font-mono px-2 py-0.5 bg-zinc-100 rounded-md border border-zinc-200">{product.barcode}</span>
                                                {product.shelves?.code && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-100">
                                                        <MapPin className="w-3 h-3" />
                                                        {product.shelves.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 self-end sm:self-auto">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Limit</p>
                                                <MinStockEditor productId={product.id} initialMinStock={product.min_stock} />
                                            </div>
                                            <div className="text-right shrink-0 border-l border-zinc-100 pl-6">
                                                <div className="text-2xl font-black text-rose-600 leading-tight">{product.quantity}</div>
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Stok</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {trendyolProducts.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-emerald-200">
                                        <ShoppingBag className="w-10 h-10 text-emerald-500 opacity-40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900">Her Şey Yolunda!</h3>
                                    <p className="text-zinc-500">Mağazanızda stok sıkıntısı olan ürün yok.</p>
                                </div>
                            ) : (
                                trendyolProducts.map((product: any) => (
                                    <div key={product.barcode} className="group flex gap-5 p-5 bg-zinc-50/50 rounded-3xl border border-transparent hover:border-orange-100 hover:bg-white hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500">
                                        <div className="w-20 h-20 rounded-2xl bg-white border border-zinc-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0].url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                                    <ShoppingBag className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-black text-zinc-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-1 text-sm md:text-base" title={product.title}>{product.title}</h4>
                                                    <a
                                                        href={product.productContentId ? `https://www.trendyol.com/p/${product.productContentId}` : `https://www.trendyol.com/sr?q=${product.barcode}`}
                                                        target="_blank"
                                                        className="p-1.5 text-zinc-400 hover:text-orange-500 transition-colors shrink-0"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[11px] font-black text-zinc-800 font-mono px-2.5 py-1 bg-zinc-100 rounded-lg flex items-center gap-1.5 border border-zinc-200">
                                                        <Barcode className="w-3 h-3 text-zinc-400" />
                                                        {product.barcode}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                                <div>
                                                    {product.localId ? (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Kritik Limit</p>
                                                            <MinStockEditor productId={product.localId} initialMinStock={product.minStock} />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-zinc-400 group/sync">
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tight">Limit için senkronize et</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20">
                                                    <span className="text-xl font-black leading-none">{product.quantity}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Mağaza Stoğu</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
