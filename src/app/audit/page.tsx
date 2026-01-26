'use client'

import BarcodeScanner from '@/components/BarcodeScanner'
import ShelfSelector from '@/components/ShelfSelector'
import { useState, useEffect } from 'react'
import { getProductByBarcode, moveProductToShelf, getShelves } from '@/lib/actions'
import { Product, Shelf } from '@/types'
import { MapPin, CheckCircle, XCircle, ScanLine, Package, ArrowRight } from 'lucide-react'

export default function AuditPage() {
    const [product, setProduct] = useState<Product | null>(null)
    const [shelves, setShelves] = useState<Shelf[]>([])
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isMoving, setIsMoving] = useState(false)

    useEffect(() => {
        getShelves().then(setShelves)
    }, [])

    const handleScan = async (barcode: string) => {
        setLoading(true)
        setError(null)
        setSuccess(null)
        setIsMoving(false)
        try {
            const foundProduct = await getProductByBarcode(barcode)
            if (foundProduct) {
                setProduct(foundProduct)
            } else {
                setError('Ürün bulunamadı.')
                setProduct(null)
            }
        } catch (err) {
            setError('Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleMoveShelf = async (shelfId: string) => {
        if (!product) return
        setLoading(true)
        try {
            await moveProductToShelf(product.id, shelfId)
            setSuccess(`Ürün yeni rafa taşındı: ${shelves.find(s => s.id === shelfId)?.code}`)
            setIsMoving(false)
            const updated = await getProductByBarcode(product.barcode)
            if (updated) setProduct(updated)
        } catch (err) {
            setError('Raf değişikliği yapılamadı.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <ScanLine className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Hızlı Kontrol</h1>
                    <p className="text-zinc-500 text-sm">Ürün bilgisi ve raf değiştirme</p>
                </div>
            </div>

            {/* Scanner Area */}
            {!product && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <BarcodeScanner onScanSuccess={handleScan} />
                    </div>

                    <div className="px-6 pb-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Barkodu manuel girin..."
                                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value) {
                                        handleScan(e.currentTarget.value)
                                    }
                                }}
                            />
                            <button
                                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition-all"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                    if (input?.value) handleScan(input.value)
                                }}
                            >
                                Ara
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <p className="font-medium text-rose-900">{error}</p>
                    </div>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="font-medium text-emerald-900">{success}</p>
                    </div>
                </div>
            )}

            {/* Product Info Card */}
            {product && !loading && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-zinc-100">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                                <Package className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-zinc-900">{product.name}</h3>
                                <p className="text-sm text-zinc-500 font-mono">{product.barcode}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <p className="text-sm text-zinc-500 mb-1">Mevcut Stok</p>
                                <p className="text-2xl font-bold text-zinc-900">{product.quantity}</p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl">
                                <p className="text-sm text-indigo-600 mb-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> Konum
                                </p>
                                <p className="text-2xl font-bold text-indigo-900">{product.shelves?.code || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {!isMoving ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsMoving(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                                >
                                    <MapPin className="w-5 h-5" />
                                    Rafı Değiştir
                                </button>
                                <button
                                    onClick={() => setProduct(null)}
                                    className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-all"
                                >
                                    Yeni Tarama
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-zinc-900">Yeni Raf Seçin</h4>
                                    <button
                                        onClick={() => setIsMoving(false)}
                                        className="text-sm text-zinc-500 hover:text-zinc-700"
                                    >
                                        İptal
                                    </button>
                                </div>
                                <ShelfSelector
                                    shelves={shelves}
                                    selectedShelfId={product.shelf_id}
                                    onSelectShelf={handleMoveShelf}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
