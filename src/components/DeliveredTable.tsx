'use client'

import { useState } from 'react'
import {
    Package,
    User,
    Calendar,
    History,
    X,
    ChevronRight,
    ChevronLeft,
    MoreHorizontal,
    Search,
    Clock,
    MapPin,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTrendyolOrderDetail } from '@/lib/actions'
import { useRouter, useSearchParams } from 'next/navigation'

interface DeliveredTableProps {
    orders: any[]
    totalElements: number
    totalPages: number
    currentPage: number
    pageSize: number
}

export default function DeliveredTable({
    orders,
    totalElements,
    totalPages,
    currentPage,
    pageSize
}: DeliveredTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`?${params.toString()}`)
    }

    const [viewMode, setViewMode] = useState<'history' | 'tracking'>('history')

    const handleViewProcess = async (order: any) => {
        setSelectedOrder(order)
        setIsLoadingDetail(true)
        setViewMode('history')
        try {
            const result = await getTrendyolOrderDetail(order.orderNumber)
            if (result.success && result.order) {
                setSelectedOrder(result.order)
            }
        } catch (err) {
            console.error('Failed to fetch order detail:', err)
        } finally {
            setIsLoadingDetail(false)
        }
    }

    const getTrackingUrl = (order: any) => {
        const trackingNumber = order.shipmentPackages?.[0]?.trackingNumber || order.cargoTrackingNumber || order.trackingNumber
        if (!trackingNumber) return null

        const provider = (order.cargoProviderName || '').toLowerCase()

        // Trendyol Express (TEX)
        if (provider.includes('trendyol') || provider.includes('tex')) {
            return `https://kargotakip.trendyol.com/?orderNumber=${trackingNumber}`
        }

        // Aras Kargo
        if (provider.includes('aras')) {
            return `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}`
        }

        // Yurtiçi Kargo
        if (provider.includes('yurtiçi') || provider.includes('yurtici')) {
            return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`
        }

        // MNG Kargo
        if (provider.includes('mng')) {
            return `https://kargotakip.mngkargo.com.tr/tracking?id=${trackingNumber}`
        }

        // Sendeo
        if (provider.includes('sendeo')) {
            return `https://sendeo.com.tr/kargo-takip?takipNo=${trackingNumber}`
        }

        // PTT Kargo
        if (provider.includes('ptt')) {
            return `https://gonderitakip.ptt.gov.tr/Track/Main?takipNo=${trackingNumber}`
        }

        // Generic fallback for others if they are handled by Trendyol's unified tracker
        return `https://kargotakip.trendyol.com/?orderNumber=${trackingNumber}`
    }

    const trackingUrl = selectedOrder ? getTrackingUrl(selectedOrder) : null

    const parseDate = (dateVal: any) => {
        if (!dateVal) return null
        if (typeof dateVal === 'number') {
            const timestamp = dateVal < 10000000000 ? dateVal * 1000 : dateVal
            return new Date(timestamp)
        }
        if (typeof dateVal === 'string' && /^\d+$/.test(dateVal)) {
            const num = parseInt(dateVal)
            const timestamp = num < 10000000000 ? num * 1000 : num
            return new Date(timestamp)
        }
        const d = new Date(dateVal)
        return isNaN(d.getTime()) ? null : d
    }

    const formatDate = (date: any) => {
        const d = parseDate(date)
        if (!d) return '---'
        return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    return (
        <div className="space-y-4">
            {/* Table Container */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sipariş No</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Müşteri</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tarih</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ürünler</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Toplam</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {orders.map((order) => (
                                <tr key={order.orderNumber} className="hover:bg-zinc-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono font-bold text-emerald-600">#{order.orderNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 leading-tight">
                                                {order.customerFirstName} {order.customerLastName}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-medium">Trendyol Siparişi</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-zinc-600">{formatDate(order.orderDate)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2">
                                            {order.lines.slice(0, 3).map((line: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    title={line.productName}
                                                    className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm shrink-0"
                                                >
                                                    <Package className="w-4 h-4 text-zinc-400" />
                                                </div>
                                            ))}
                                            {order.lines.length > 3 && (
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-white flex items-center justify-center shadow-sm shrink-0">
                                                    <span className="text-[10px] font-bold text-zinc-500">+{order.lines.length - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-zinc-900">{order.totalPrice} TL</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleViewProcess(order)}
                                            className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Toplam <span className="text-zinc-900">{totalElements}</span> Sipariş • Sayfa <span className="text-zinc-900">{currentPage + 1} / {totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 0}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="hidden sm:flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                // Simple sliding window for page numbers
                                let pageNum = currentPage;
                                if (totalPages > 5) {
                                    if (currentPage < 3) pageNum = idx;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 5 + idx;
                                    else pageNum = currentPage - 2 + idx;
                                } else {
                                    pageNum = idx;
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm",
                                            currentPage === pageNum
                                                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                                                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                        )}
                                    >
                                        {pageNum + 1}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Shipment History Modal (Reused Logic) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <History className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 line-clamp-1">
                                        {viewMode === 'history' ? 'Sevkiyat Geçmişi' : 'Canlı Kargo Takibi'}
                                    </h3>
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                        Sipariş No: <span className="text-emerald-600 font-mono">#{selectedOrder.orderNumber}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {trackingUrl && (
                                    <div className="flex bg-zinc-100 p-1 rounded-2xl mr-2">
                                        <button
                                            onClick={() => setViewMode('history')}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                viewMode === 'history' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                            )}
                                        >
                                            Veriler
                                        </button>
                                        <button
                                            onClick={() => setViewMode('tracking')}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                viewMode === 'tracking' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                            )}
                                        >
                                            Canlı
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => setSelectedOrder(null)} className="p-3 rounded-2xl hover:bg-zinc-100 text-zinc-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[400px]">
                            {isLoadingDetail && (
                                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Yükleniyor...</p>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'history' ? (
                                <div className="p-8 space-y-8">
                                    {/* Products Summary */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-zinc-400" />
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sipariş İçeriği</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedOrder.lines?.map((line: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-zinc-200" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-zinc-900">{line.productName}</p>
                                                            <p className="text-[10px] font-medium text-zinc-400">SKU: {line.productCode || '---'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 bg-white border border-zinc-100 rounded-lg text-xs font-black text-zinc-600">
                                                        {line.quantity} ADET
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-zinc-400" />
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Süreç Takibi</span>
                                        </div>
                                        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100">
                                            {(() => {
                                                const historyArr = selectedOrder.shipmentPackages?.[0]?.packageHistory || []
                                                if (historyArr.length > 0) {
                                                    return historyArr.map((step: any, idx: number) => {
                                                        const stepDate = parseDate(step.historyDate || step.creationDate || step.createdDate || step.date || step.timestamp)
                                                        return (
                                                            <div key={idx} className="relative">
                                                                <div className={cn(
                                                                    "absolute -left-[29px] top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center transition-all duration-500",
                                                                    idx === historyArr.length - 1 ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-zinc-200"
                                                                )}>
                                                                    {idx === historyArr.length - 1 && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={cn(
                                                                            "text-sm font-black uppercase tracking-tight transition-colors duration-500",
                                                                            idx === historyArr.length - 1 ? "text-emerald-600" : "text-zinc-600"
                                                                        )}>
                                                                            {step.status === 'Awaiting' ? 'Beklemede' : step.status}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-zinc-400">
                                                                            {stepDate ? stepDate.toLocaleString('tr-TR') : '---'}
                                                                        </span>
                                                                    </div>
                                                                    {step.description && (
                                                                        <p className="text-xs text-zinc-500 font-medium">{step.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                                return (
                                                    <div className="py-4 text-center">
                                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest italic">Henüz süreç geçmişi bulunmuyor</p>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full min-h-[500px] bg-zinc-50 relative">
                                    {trackingUrl ? (
                                        <>
                                            <iframe
                                                src={trackingUrl}
                                                className="w-full h-full min-h-[500px] border-none"
                                                title="Cargo Tracking"
                                            />
                                            <div className="absolute bottom-4 right-4 group">
                                                <a
                                                    href={trackingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur border border-zinc-200 rounded-xl text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-emerald-600 transition-all shadow-xl"
                                                >
                                                    Dış Bağlantıda Aç <ChevronRight className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-400 text-sm font-bold">
                                            Takip linki oluşturulamadı.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-zinc-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Takip Numarası</span>
                                    <span className="text-sm font-mono font-bold text-zinc-700">
                                        {selectedOrder.shipmentPackages?.[0]?.trackingNumber ||
                                            selectedOrder.trackingNumber ||
                                            selectedOrder.cargoTrackingNumber ||
                                            '---'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
