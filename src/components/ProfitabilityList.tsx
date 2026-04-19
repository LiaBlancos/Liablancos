'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw, ArrowRight, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { syncTrendyolOrders, getProfitabilityOrders } from '@/lib/profitability-actions'
import { ProfitabilityOrder } from '@/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function ProfitabilityList() {
    const [orders, setOrders] = useState<ProfitabilityOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const data = await getProfitabilityOrders()
        setOrders(data)
        setLoading(false)
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await syncTrendyolOrders(3) // Sync last 3 days by default
            if (res.success) {
                toast.success(res.message)
                loadData()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Senkronizasyon hatası')
        } finally {
            setSyncing(false)
        }
    }

    // Calculations for Summary Cards
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0)
    const totalCost = orders.reduce((sum, o) => sum + (o.gross_cost || 0), 0)
    const totalProfit = orders.reduce((sum, o) => sum + (o.net_profit || 0), 0)
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-zinc-900">Sipariş Kârlılık Analizi</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {syncing ? 'Senkronize Ediliyor...' : 'Trendyol Verilerini Çek'}
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title="Toplam Ciro" value={`${totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`} color="text-zinc-900" />
                <Card title="Toplam Maliyet" value={`${totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`} color="text-zinc-500" />
                <Card title="Net Kâr" value={`${totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`} color={totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                <Card title="Ortalama Marj" value={`%${averageMargin.toFixed(1)}`} color={averageMargin >= 20 ? 'text-emerald-600' : averageMargin >= 0 ? 'text-amber-500' : 'text-rose-600'} />
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Sipariş No / Tarih</th>
                                <th className="px-6 py-3">Müşteri</th>
                                <th className="px-6 py-3">Durum</th>
                                <th className="px-6 py-3 text-right">Tutar</th>
                                <th className="px-6 py-3 text-right">Maliyet</th>
                                <th className="px-6 py-3 text-right">Net Kâr</th>
                                <th className="px-6 py-3 text-center">Marj</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                                        Henüz veri yok. Senkronizasyon başlatın.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const margin = order.total_price > 0 ? (order.net_profit / order.total_price) * 100 : 0
                                    return (
                                        <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-900">{order.order_number}</div>
                                                <div className="text-xs text-zinc-500">
                                                    {order.order_date ? new Date(order.order_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </div>
                                                <div className="mt-1">
                                                    {order.is_settled ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            Kesinleşmiş
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                            Tahmini
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600">{order.customer_name}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-zinc-900">
                                                {order.total_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className="px-6 py-4 text-right text-zinc-500">
                                                {order.gross_cost?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className={cn("px-6 py-4 text-right font-bold", order.net_profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                {order.net_profit?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={cn("inline-flex items-center px-2 py-1 rounded text-xs font-bold",
                                                    margin >= 20 ? "bg-emerald-100 text-emerald-700" :
                                                        margin >= 0 ? "bg-amber-100 text-amber-700" :
                                                            "bg-rose-100 text-rose-700"
                                                )}>
                                                    %{margin.toFixed(1)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/finans/karlilik/${order.id}`} className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors inline-block">
                                                    <ArrowRight className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}

function Card({ title, value, color }: { title: string, value: string, color: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="text-sm font-medium text-zinc-500 mb-1">{title}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {labels[status] || status}
        </span>
    )
}
