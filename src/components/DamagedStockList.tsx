'use client'

import { useState } from 'react'
import { Product } from '@/types'
import { Search, Package, MapPin, Trash2, ArrowRightCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DamagedStockListProps {
    products: Product[]
}

export default function DamagedStockList({ products }: DamagedStockListProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
    )

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 transition-colors group-focus-within:text-zinc-900" />
                <input
                    type="text"
                    placeholder="Hasarlı ürünlerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all shadow-sm"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="group bg-white rounded-3xl border border-zinc-100 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-900/5 hover:-translate-y-1"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-100 transition-colors">
                                    <Package className="w-6 h-6 text-zinc-600" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-zinc-900 truncate max-w-[150px]" title={product.name}>
                                        {product.name}
                                    </h4>
                                    <p className="text-[10px] font-black font-mono text-zinc-400 uppercase tracking-widest leading-none mt-1">
                                        {product.barcode}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 text-zinc-600 rounded-lg text-[10px] font-black uppercase border border-zinc-100">
                                    <MapPin className="w-3 h-3" />
                                    {product.shelves?.code || '??'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 rounded-xl">
                                        <Trash2 className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">Hasarlı Miktar</span>
                                </div>
                                <p className="text-3xl font-black text-amber-600 tracking-tighter">
                                    {product.damaged_quantity}
                                    <span className="text-xs ml-1 opacity-70">Adet</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/damaged-out"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all active:scale-95 group/btn"
                            >
                                Hasarlı Çıkış Yap
                                <ArrowRightCircle className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
                        <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-10 h-10 text-zinc-200" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Hasarlı Ürün Bulunamadı</h3>
                        <p className="text-zinc-500">Şu anda sistemde kayıtlı hasarlı ürün görünmüyor.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
