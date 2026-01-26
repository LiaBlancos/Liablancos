'use client'

import BarcodeScanner from '@/components/BarcodeScanner'
import { useState } from 'react'
import { getProductByBarcode, updateDamagedStock } from '@/lib/actions'
import { Product } from '@/types'
import { CheckCircle, XCircle, Trash2, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DamagedOutPage() {
    const [product, setProduct] = useState<Product | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleScan = async (barcode: string) => {
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const foundProduct = await getProductByBarcode(barcode)
            if (foundProduct) {
                setProduct(foundProduct)
            } else {
                setError('Ürün bulunamadı!')
                setProduct(null)
            }
        } catch (err) {
            setError('Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleDamagedRemove = async (amount: number) => {
        if (!product) return

        const currentDamaged = product.damaged_quantity || 0
        if (currentDamaged < amount) {
            setError(`Hasarlı stok yetersiz! Mevcut: ${currentDamaged}`)
            return
        }

        setLoading(true)
        try {
            const result = await updateDamagedStock(product.id, amount, 'DAMAGED_OUT', false)
            if (result.error) throw new Error(result.error)

            setSuccess(`${product.name} için ${amount} adet hasarlı çıkışı (imha/iade) yapıldı.`)
            setProduct(null)
        } catch (err: any) {
            setError(err.message || 'İşlem başarısız.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/25">
                    <Trash2 className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Hasarlı Ürün Çıkışı</h1>
                    <p className="text-zinc-500 text-sm">Hasarlı stoğu imha edin veya iade gönderin</p>
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
                                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500"
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
                    <div className="w-8 h-8 border-3 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <p className="font-medium text-rose-900">{error}</p>
                    </div>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
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

                        <div className="mt-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Mevcut Hasarlı Stok</p>
                                <p className="text-3xl font-black text-rose-600">{product.damaged_quantity || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-rose-500" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                            Çıkış yapılacak miktarı seçin:
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 5, 10, 20, 50].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleDamagedRemove(amount)}
                                    disabled={(product.damaged_quantity || 0) < amount}
                                    className={cn(
                                        "py-4 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                                        (product.damaged_quantity || 0) < amount
                                            ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                                    )}
                                >
                                    -{amount}
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount Input */}
                        <div className="mt-4 flex gap-3">
                            <input
                                type="number"
                                min="1"
                                placeholder="Özel miktar..."
                                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = parseInt((e.target as HTMLInputElement).value)
                                        if (value > 0) {
                                            handleDamagedRemove(value)
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
                                        handleDamagedRemove(value)
                                        input.value = ''
                                    }
                                }}
                                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all"
                            >
                                Çıkış
                            </button>
                        </div>

                        <button
                            onClick={() => setProduct(null)}
                            className="w-full mt-6 py-3 text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
                        >
                            İptal / Yeni Tarama
                        </button>
                    </div>
                </div>
            )}

            {/* Info Card */}
            {!product && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <Info className="w-6 h-6 text-zinc-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-zinc-900 mb-1 text-sm">Hasarlı Çıkışı Nedir?</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Bu sayfa, halihazırda hasarlı olarak ayrılmış ürünlerin envanterden tamamen
                                çıkarılması (imha edilmesi veya tedarikçiye iade edilmesi) için kullanılır.
                                Bu işlem sonucunda sadece hasarlı stok miktarı azalır.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
