'use client'

import BarcodeScanner from '@/components/BarcodeScanner'
import { useState } from 'react'
import { getProductByBarcode, updateDamagedStock } from '@/lib/actions'
import { Product } from '@/types'
import { CheckCircle, XCircle, AlertTriangle, ShieldX, ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DamagedInPage() {
    const [product, setProduct] = useState<Product | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [fromMainStock, setFromMainStock] = useState(true)

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

    const handleDamagedAdd = async (amount: number) => {
        if (!product) return

        if (fromMainStock && product.quantity < amount) {
            setError(`Sağlam stok yetersiz! Mevcut: ${product.quantity}`)
            return
        }

        setLoading(true)
        try {
            const result = await updateDamagedStock(product.id, amount, 'DAMAGED_IN', fromMainStock)
            if (result.error) throw new Error(result.error)

            setSuccess(`${product.name} için ${amount} adet hasarlı girişi yapıldı.`)
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <ShieldX className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Hasarlı Ürün Girişi</h1>
                    <p className="text-zinc-500 text-sm">Hasarlı veya kusurlu ürünleri envantere kaydedin</p>
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
                                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
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

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Sağlam Stok</p>
                                <p className="text-2xl font-black text-zinc-900">{product.quantity}</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Hasarlı Stok</p>
                                <p className="text-2xl font-black text-amber-600">{product.damaged_quantity || 0}</p>
                            </div>
                        </div>

                        {/* Toggle Option */}
                        <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <AlertTriangle className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 text-sm">Sağlam stoktan düşülsün mü?</p>
                                        <p className="text-xs text-zinc-500">Ürün depodayken hasar gördüyse bunu seçin</p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setFromMainStock(!fromMainStock)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative",
                                        fromMainStock ? "bg-indigo-600" : "bg-zinc-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                                        fromMainStock ? "left-7" : "left-1"
                                    )} />
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                            Miktarı seçin veya girin:
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 5, 10, 20, 50].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleDamagedAdd(amount)}
                                    disabled={fromMainStock && product.quantity < amount}
                                    className={cn(
                                        "py-4 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                                        fromMainStock && product.quantity < amount
                                            ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                            : "bg-amber-50 hover:bg-amber-100 text-amber-700"
                                    )}
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
                                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = parseInt((e.target as HTMLInputElement).value)
                                        if (value > 0) {
                                            handleDamagedAdd(value)
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
                                        handleDamagedAdd(value)
                                        input.value = ''
                                    }
                                }}
                                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all"
                            >
                                Kaydet
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
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-indigo-900 mb-1 text-sm">Hasarlı Girişi Nedir?</h4>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Bu sayfa, ürünlerin hasarlı olduğunu sisteme işlemek içindir.
                                Eğer ürün depoda zaten varsa <b>"Sağlam stoktan düş"</b> seçeneğini aktif bırakarak
                                sağlam envanterinizi güncel tutabilirsiniz. Ürün depoya hiç girmeden hasarlı geldiyse
                                bu seçeneği kapatabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
