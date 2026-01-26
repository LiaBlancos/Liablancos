'use client'

import BarcodeScanner from '@/components/BarcodeScanner'
import { useState } from 'react'
import { getProductByBarcode, updateStock } from '@/lib/actions'
import { Product } from '@/types'
import { CheckCircle, XCircle, PackagePlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function StockInPage() {
    const [product, setProduct] = useState<Product | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)

    const handleScan = async (barcode: string) => {
        setLoading(true)
        setError(null)
        setSuccess(null)
        setLastScannedBarcode(barcode)
        try {
            const foundProduct = await getProductByBarcode(barcode)
            if (foundProduct) {
                setProduct(foundProduct)
            } else {
                setError('Ürün bulunamadı! Lütfen önce ürünü sisteme kaydedin.')
                setProduct(null)
            }
        } catch (err) {
            setError('Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleStockAdd = async (amount: number) => {
        if (!product) return
        setLoading(true)
        try {
            await updateStock(product.id, amount, 'STOCK_IN')
            setSuccess(`${product.name} için ${amount} adet stok eklendi.`)
            setProduct(null)
        } catch (err) {
            setError('Stok güncellenemedi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <PackagePlus className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Stok Giriş</h1>
                    <p className="text-zinc-500 text-sm">Barkod okutarak stok ekleyin</p>
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
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-rose-900">{error}</p>
                            {error.includes('bulunamadı') && lastScannedBarcode && (
                                <Link
                                    href={`/products/new?barcode=${lastScannedBarcode}`}
                                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Yeni Ürün Ekle <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
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

            {/* Product Card */}
            {product && !loading && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-zinc-100">
                        <h3 className="text-xl font-bold text-zinc-900">{product.name}</h3>
                        <p className="text-sm text-zinc-500 font-mono mt-1">{product.barcode}</p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="px-4 py-2 bg-zinc-100 rounded-lg">
                                <span className="text-sm text-zinc-500">Mevcut Stok</span>
                                <p className="text-xl font-bold text-zinc-900">{product.quantity}</p>
                            </div>
                            <div className="px-4 py-2 bg-indigo-50 rounded-lg">
                                <span className="text-sm text-indigo-600">Raf</span>
                                <p className="text-xl font-bold text-indigo-900">{product.shelves?.code || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-zinc-500 mb-3">Eklenecek miktarı seçin:</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 5, 10, 20, 50, 100].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleStockAdd(amount)}
                                    className="py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    +{amount}
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount Input */}
                        <div className="mt-4 flex gap-3">
                            <input
                                type="number"
                                min="1"
                                placeholder="Özel miktar..."
                                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = parseInt((e.target as HTMLInputElement).value)
                                        if (value > 0) {
                                            handleStockAdd(value)
                                                ; (e.target as HTMLInputElement).value = ''
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                                    const value = parseInt(input.value)
                                    if (value > 0) {
                                        handleStockAdd(value)
                                        input.value = ''
                                    }
                                }}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all"
                            >
                                Ekle
                            </button>
                        </div>

                        <button
                            onClick={() => setProduct(null)}
                            className="w-full mt-4 py-3 text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
                        >
                            İptal / Yeni Tarama
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
