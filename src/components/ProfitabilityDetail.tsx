'use client'

'use client'

import React from 'react'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import Link from 'next/link'
import { ProfitabilityOrder } from '@/types'
import { cn } from '@/lib/utils'

export default function ProfitabilityDetail({ order }: { order: ProfitabilityOrder }) {
    if (!order) return <div>Sipariş bulunamadı.</div>

    // Calculate totals
    const totalRevenue = order.total_price
    const totalCost = order.gross_cost
    const totalFees = order.fees?.reduce((sum, f) => sum + Math.abs(f.amount), 0) || 0
    const netProfit = order.net_profit
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/finans/karlilik" className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                            Sipariş #{order.order_number}
                            <StatusBadge status={order.status} />
                            {order.is_settled ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Kesinleşmiş (Settled)
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                    Tahmini (Estimated)
                                </span>
                            )}
                        </h1>
                        <div className="text-sm text-zinc-500 mt-1">
                            {order.customer_name} • {order.order_date ? new Date(order.order_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium">
                        <Printer className="w-4 h-4" />
                        Yazdır
                    </button>
                    {/* Placeholder for future export */}
                    <button className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                    <div className="text-sm font-medium text-zinc-500 mb-2">Toplam Gelir (Ciro)</div>
                    <div className="text-3xl font-bold text-zinc-900">
                        {totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-zinc-400 opacity-20"></div>
                </div>

                {/* COGS */}
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                    <div className="text-sm font-medium text-zinc-500 mb-2">Ürün Maliyeti (COGS)</div>
                    <div className="text-3xl font-bold text-zinc-600">
                        -{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-red-400 opacity-20"></div>
                </div>

                {/* Expenses */}
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                    <div className="text-sm font-medium text-zinc-500 mb-2">
                        Toplam Kesinti
                        {order.is_settled ?
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Kesin</span> :
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Tahmini</span>
                        }
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                        -{totalFees.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                    <div className="text-xs text-orange-600/80 mt-1 font-medium">
                        Komisyon, Kargo, Hizmet vb.
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-orange-400 opacity-20"></div>
                </div>

                {/* Net Profit */}
                <div className={cn("bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden",
                    netProfit >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"
                )}>
                    <div className="text-sm font-medium text-zinc-500 mb-2">NET KÂR</div>
                    <div className={cn("text-3xl font-bold", netProfit >= 0 ? "text-emerald-700" : "text-rose-700")}>
                        {netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                    <div className={cn("text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block",
                        netProfit >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    )}>
                        %{margin.toFixed(1)} Marj
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-700 flex justify-between items-center">
                            <span>Sipariş Kalemleri ({order.items?.length || 0})</span>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50/50 border-b border-zinc-100 text-xs text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Ürün / SKU</th>
                                    <th className="px-6 py-3 text-center">Adet</th>
                                    <th className="px-6 py-3 text-right">Birim Fiyat</th>
                                    <th className="px-6 py-3 text-right">Birim Maliyet</th>
                                    <th className="px-6 py-3 text-right">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {order.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900">{item.product_name}</div>
                                            <div className="text-xs text-zinc-500">{item.sku} • {item.barcode}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-zinc-600">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right font-medium">{item.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        <td className="px-6 py-4 text-right text-zinc-500">{item.unit_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        <td className="px-6 py-4 text-right font-bold text-zinc-900">
                                            {(item.unit_price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Fees Breakdown */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-700">
                            Kesinti Detayları
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {order.fees && order.fees.length > 0 ? (
                                order.fees.map((fee) => (
                                    <div key={fee.id} className="px-6 py-4 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                                        <div>
                                            <div className="font-medium text-zinc-900">{fee.description || fee.fee_type}</div>
                                            <div className="text-xs text-zinc-500 capitalize">{fee.fee_type.replace('_', ' ').toLowerCase()}</div>
                                        </div>
                                        <div className="font-bold text-rose-600">
                                            {fee.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-zinc-500 text-sm">
                                    Henüz kesinti verisi yok.
                                </div>
                            )}

                            {/* Comparison / Summary in Footer */}
                            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center font-bold text-zinc-700">
                                <span>Toplam Kesinti</span>
                                <span>-{totalFees.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return null

    let colorClass = "bg-zinc-100 text-zinc-700"
    if (status === 'Delivered') colorClass = "bg-emerald-100 text-emerald-700"
    if (status === 'Shipped') colorClass = "bg-blue-100 text-blue-700"
    if (status === 'Cancelled') colorClass = "bg-rose-100 text-rose-700"
    if (status === 'Picking') colorClass = "bg-amber-100 text-amber-700"

    // Translate status if needed
    const labels: Record<string, string> = {
        'Created': 'Oluşturuldu',
        'Picking': 'Toplanıyor',
        'Invoiced': 'Faturalandı',
        'Shipped': 'Kargoda',
        'Delivered': 'Teslim Edildi',
        'Cancelled': 'İptal',
        'Returned': 'İade',
        'UnSupplied': 'Tedarik Edilemedi'
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${colorClass}`}>
            {labels[status] || status}
        </span>
    )
}
