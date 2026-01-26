'use client'

import { useState, useEffect, Suspense } from 'react'
import { getShelves, getProductsByShelf, deleteShelf, moveProductToShelf } from '@/lib/actions'
import { Shelf, Product } from '@/types'
import { Package, MapPin, Eye, Trash2, X, AlertTriangle, ScanLine, Warehouse } from 'lucide-react'
import Link from 'next/link'

function ShelvesContent() {
    const [shelves, setShelves] = useState<Shelf[]>([])
    const [shelfProducts, setShelfProducts] = useState<Product[]>([])
    const [viewingShelf, setViewingShelf] = useState<Shelf | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<Shelf | null>(null)
    const [transferringProduct, setTransferringProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadShelves()
    }, [])

    const loadShelves = async () => {
        const data = await getShelves()
        setShelves(data)
        setLoading(false)
    }

    const handleViewShelf = async (shelf: Shelf) => {
        setViewingShelf(shelf)
        const products = await getProductsByShelf(shelf.id)
        setShelfProducts(products)
    }

    const handleCloseView = () => {
        setViewingShelf(null)
        setShelfProducts([])
    }

    const handleDeleteShelf = async () => {
        if (!deleteConfirm) return
        await deleteShelf(deleteConfirm.id)
        setDeleteConfirm(null)
        loadShelves()
    }

    const handleTransferProduct = async (targetShelfId: string) => {
        if (!transferringProduct) return

        try {
            await moveProductToShelf(transferringProduct.id, targetShelfId)
            setTransferringProduct(null)

            // Refresh current shelf view if still viewing
            if (viewingShelf) {
                const products = await getProductsByShelf(viewingShelf.id)
                setShelfProducts(products)
            }
            // Refresh main shelf list
            loadShelves()
        } catch (error) {
            console.error('Transfer failed:', error)
            alert('Transfer işlemi başarısız oldu.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Premium Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:pl-72">
                    {/* Dark Mask */}
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setDeleteConfirm(null)}
                    />

                    {/* Centered Modal Card */}
                    <div className="relative bg-white rounded-[3rem] max-w-sm w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-zinc-100 overflow-hidden animate-scale-in">
                        <div className="p-10 text-center">
                            {/* Danger Icon with Neumorphic background */}
                            <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100/50">
                                <Trash2 className="w-12 h-12 text-rose-500" />
                            </div>

                            <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">
                                Rafı Sil?
                            </h3>

                            <p className="text-zinc-500 leading-relaxed mb-10 text-lg">
                                <span className="font-extrabold text-rose-600 uppercase block tracking-[0.2em] text-xs mb-3">Geri Alınamaz</span>
                                <span className="font-extrabold text-zinc-900 leading-tight block">"{deleteConfirm.code}"</span>
                                kodlu raf sistemden kaldırılacak.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteShelf}
                                    className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-600/30 active:scale-95"
                                >
                                    Evet, Rafı Sil
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="w-full py-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-2xl transition-all active:scale-95"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="bg-zinc-50 py-5 px-8 border-t border-zinc-100 flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center leading-relaxed">
                                Ürünler Silinmez, Konumları Temizlenir
                            </span>
                        </div>
                    </div>
                </div>
            )}


            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Depo Rafları</h1>
                        <p className="text-zinc-500 text-sm">{shelves.length} raf tanımlı</p>
                    </div>
                </div>
                <Link
                    href="/shelves/new"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                    + Yeni Raf
                </Link>
            </div>

            {/* Product Transfer Modal */}
            {transferringProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:pl-72">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setTransferringProduct(null)}
                    />

                    <div className="relative bg-white rounded-[3rem] max-w-md w-full shadow-2xl border border-zinc-100 overflow-hidden animate-scale-in">
                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-inner">
                                    <ScanLine className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-zinc-900 tracking-tight">Ürünü Taşı</h3>
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-0.5 truncate">{transferringProduct.name}</p>
                                </div>
                                <button
                                    onClick={() => setTransferringProduct(null)}
                                    className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"
                                >
                                    <X className="w-6 h-6 text-zinc-400" />
                                </button>
                            </div>

                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-1">Hedef Raf Seçin</p>
                            <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto p-1 pr-2 custom-scrollbar">
                                {shelves
                                    .filter(s => s.id !== viewingShelf?.id)
                                    .map((shelf) => (
                                        <button
                                            key={shelf.id}
                                            onClick={() => handleTransferProduct(shelf.id)}
                                            className="group p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center flex flex-col items-center gap-2 active:scale-95 shadow-sm"
                                        >
                                            <MapPin className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                                            <span className="font-black text-lg text-zinc-900 group-hover:text-white transition-colors tracking-tighter">{shelf.code}</span>
                                        </button>
                                    ))}
                                {shelves.length <= 1 && (
                                    <div className="col-span-3 py-10 text-center text-zinc-400 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                                        <p className="text-xs font-bold uppercase tracking-widest">Başka raf bulunamadı</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-zinc-100">
                                <button
                                    onClick={() => setTransferringProduct(null)}
                                    className="w-full py-5 text-zinc-400 font-black uppercase tracking-[0.2em] text-xs hover:text-zinc-900 transition-colors"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shelf Detail Panel */}
            {viewingShelf && (
                <div className="bg-white border border-indigo-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/5 animate-fade-in ring-4 ring-indigo-50/50">
                    <div className="p-8 border-b border-indigo-50 bg-gradient-to-r from-indigo-50/50 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Warehouse className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-indigo-900 tracking-tight">{viewingShelf.code} Rafındaki Ürünler</h3>
                                <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">{shelfProducts.length} kayıtlı ürün</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCloseView}
                            className="w-12 h-12 flex items-center justify-center hover:bg-indigo-100/50 rounded-2xl transition-colors text-indigo-600"
                        >
                            <X className="w-7 h-7" />
                        </button>
                    </div>

                    {shelfProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8">
                            {shelfProducts.map((product) => (
                                <div key={product.id} className="group p-5 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-indigo-300 hover:bg-white transition-all hover:shadow-xl relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm group-hover:shadow-indigo-100 transition-all">
                                                <Package className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-zinc-900 text-lg leading-tight">{product.name}</p>
                                                <p className="text-[10px] text-zinc-400 font-black tracking-widest uppercase mt-0.5">{product.barcode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black tracking-tighter ${product.quantity <= product.min_stock ? 'text-rose-600' : 'text-zinc-900'}`}>
                                                {product.quantity}
                                            </p>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ADET</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setTransferringProduct(product)}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-zinc-200 hover:border-indigo-600 hover:text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition-all active:scale-95 shadow-sm"
                                    >
                                        <ScanLine className="w-4 h-4" />
                                        BAŞKA RAFA TAŞI
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-inner">
                                <Package className="w-10 h-10 text-indigo-300" />
                            </div>
                            <h4 className="text-xl font-black text-zinc-900 mb-2">Raf Boş</h4>
                            <p className="text-zinc-500 text-sm max-w-[280px] mx-auto font-medium leading-relaxed">Bu rafta şu an herhangi bir ürün bulunmuyor. Yeni ürünleri buraya taşıyarak doldurabilirsiniz.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Shelf Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shelves.map((shelf, index) => (
                    <div
                        key={shelf.id}
                        className="group bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-indigo-100 transition-all">
                                <MapPin className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-zinc-900">{shelf.code}</h3>
                        <p className="text-sm text-zinc-500 mt-1">Kapasite: {shelf.capacity}</p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
                            <button
                                onClick={() => handleViewShelf(shelf)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Görüntüle
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(shelf)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Rafı Sil"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {shelves.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
                    <Package className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">Henüz raf tanımlanmadı</p>
                    <Link
                        href="/shelves/new"
                        className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all"
                    >
                        İlk Rafı Oluştur
                    </Link>
                </div>
            )}
        </div>
    )
}

export default function ShelvesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ShelvesContent />
        </Suspense>
    )
}
