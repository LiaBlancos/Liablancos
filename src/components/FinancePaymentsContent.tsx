'use client'

import React, { useState, useMemo } from 'react'
import {
    Wallet,
    Upload,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileSpreadsheet,
    ArrowUpDown,
    Calendar,
    Package,
    Barcode,
    Tag,
    ChevronDown,
    MoreHorizontal,
    Trash2,
    RefreshCcw
} from 'lucide-react'
import { FinanceOrder, ImportResult, FinanceUploadLog, FinancePaymentRow } from '@/types'
import {
    importFinanceOrdersExcel,
    importFinancePaymentsExcel,
    resetFinanceData,
    syncUnmatchedPayments,
    repairFinanceData,
    getFinanceOrderDetails
} from '@/lib/actions'
import { cn } from '@/lib/utils'

interface PageLoadingOverlayProps {
    message: string
}

const PageLoadingOverlay = ({ message }: PageLoadingOverlayProps) => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <div>
                <h3 className="text-xl font-bold text-zinc-900">İşleniyor...</h3>
                <p className="text-zinc-500 mt-1 whitespace-pre-line">{message}</p>
            </div>
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-indigo-600 h-full w-full rounded-full animate-pulse transition-all duration-1000"></div>
            </div>
        </div>
    </div>
)

interface Props {
    initialOrders: FinanceOrder[]
    stats: {
        paidCount: number
        unpaidCount: number
        overdueCount: number
        paidAmount: number
        unpaidAmount: number
    }
    uploadLogs: FinanceUploadLog[]
}

export default function FinancePaymentsContent({ initialOrders, stats, uploadLogs }: Props) {
    const [orders, setOrders] = useState<FinanceOrder[]>(initialOrders)
    const [activeTab, setActiveTab] = useState<'all' | 'paid'>('all')
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')
    const [isImporting, setIsImporting] = useState(false)
    const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [showHistory, setShowHistory] = useState(false)
    const [loadingMsg, setLoadingMsg] = useState("")
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
    const [orderDetails, setOrderDetails] = useState<Record<string, FinancePaymentRow[]>>({})
    const [isDetailLoading, setIsDetailLoading] = useState<string | null>(null)

    const toggleExpand = async (orderNumber: string, packageNo: string | null) => {
        const key = `${orderNumber}_${packageNo || 'HEAD'}`
        const newExpanded = new Set(expandedOrders)
        if (newExpanded.has(key)) {
            newExpanded.delete(key)
        } else {
            newExpanded.add(key)
            // Fetch if not already present
            if (!orderDetails[key]) {
                setIsDetailLoading(key)
                try {
                    const details = await getFinanceOrderDetails(orderNumber, packageNo)
                    setOrderDetails(prev => ({ ...prev, [key]: details }))
                } finally {
                    setIsDetailLoading(null)
                }
            }
        }
        setExpandedOrders(newExpanded)
    }

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const itemsPerPage = 50

    const filteredOrders = useMemo(() => {
        let result = orders

        if (activeTab === 'paid') {
            result = result.filter(o => o.payment_status === 'paid')
        }

        if (filter === 'paid') result = result.filter(o => o.payment_status === 'paid')
        if (filter === 'unpaid') result = result.filter(o => o.payment_status === 'unpaid')
        if (filter === 'overdue') {
            const now = new Date()
            result = result.filter(o => o.payment_status === 'unpaid' && o.expected_payout_at && new Date(o.expected_payout_at) < now)
        }

        if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            result = result.filter(o => o.order_date && new Date(o.order_date) >= start)
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            result = result.filter(o => o.order_date && new Date(o.order_date) <= end)
        }

        if (search) {
            const s = search.toLowerCase()
            result = result.filter(o =>
                o.order_number.toLowerCase().includes(s) ||
                o.package_no?.toLowerCase().includes(s) ||
                o.barcode?.toLowerCase().includes(s) ||
                o.product_name?.toLowerCase().includes(s)
            )
        }

        return result
    }, [orders, activeTab, filter, search, startDate, endDate])

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredOrders.slice(start, start + itemsPerPage)
    }, [filteredOrders, currentPage])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'orders' | 'payments') => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setIsImporting(true)
        setImportMsg(null)

        let totalProcessed = 0
        let totalUpdated = 0
        let totalInserted = 0
        let totalMatched = 0
        let totalUnmatched = 0

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                setLoadingMsg(`${i + 1} / ${files.length} dosya işleniyor:\n${file.name}`)

                const formData = new FormData()
                formData.append('file', file)

                const result: ImportResult = type === 'orders'
                    ? await importFinanceOrdersExcel(formData)
                    : await importFinancePaymentsExcel(formData)

                if (result.success) {
                    totalProcessed += (result.processed || 0)
                    totalUpdated += (result.updated || 0)
                    totalInserted += (result.inserted || 0)
                    totalMatched += (result.matched || 0)
                    totalUnmatched += (result.unmatched || 0)
                } else {
                    throw new Error(`${file.name} işlenirken hata oluştu: ${result.error}`)
                }
            }

            setImportMsg({
                type: 'success',
                text: `${files.length} dosya başarıyla işlendi. Toplam ${totalProcessed} satır.`
            })
            window.location.reload()
        } catch (err: any) {
            setImportMsg({ type: 'error', text: err.message || 'Bir hata oluştu.' })
        } finally {
            setIsImporting(false)
            setLoadingMsg("")
            e.target.value = ''
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getRemainingDays = (dateStr: string | null) => {
        if (!dateStr) return null
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const target = new Date(dateStr)
        target.setHours(0, 0, 0, 0)
        const diff = target.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

    return (
        <div className="relative space-y-6">
            {isImporting && <PageLoadingOverlay message={loadingMsg} />}

            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-indigo-600" />
                        Finansal Takip
                    </h1>
                    <p className="text-zinc-500">Excel tabanlı otomatik ödeme ve sipariş takibi.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <label className="relative flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-lg shadow-indigo-600/20">
                        <Upload className="w-4 h-4" />
                        <span className="font-bold text-sm text-nowrap">Siparişleri Yükle</span>
                        <input type="file" className="hidden" accept=".xlsx,.xls" multiple onChange={(e) => handleFileUpload(e, 'orders')} disabled={isImporting} />
                    </label>
                    <label className="relative flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-lg shadow-emerald-600/20">
                        <Upload className="w-4 h-4" />
                        <span className="font-bold text-sm text-nowrap">Ödemeleri Yükle</span>
                        <input type="file" className="hidden" accept=".xlsx,.xls" multiple onChange={(e) => handleFileUpload(e, 'payments')} disabled={isImporting} />
                    </label>

                    <button
                        onClick={async () => {
                            if (window.confirm('Tüm finans verileri (siparişler ve ödemeler) silinecektir. Emin misiniz?')) {
                                setIsImporting(true)
                                const res = await resetFinanceData()
                                if (res.success) {
                                    window.location.reload()
                                } else {
                                    alert('Hata: ' + res.error)
                                    setIsImporting(false)
                                }
                            }
                        }}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all font-bold text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Temizle
                    </button>

                    <button
                        onClick={async () => {
                            setIsImporting(true)
                            setLoadingMsg("Eşleşmeyen ödemeler taranıyor...")
                            const res = await syncUnmatchedPayments()
                            if (res.success) {
                                alert(`${res.matched} adet ödeme eşleştirildi.`)
                                window.location.reload()
                            } else {
                                alert('Hata: ' + res.error)
                                setIsImporting(false)
                            }
                        }}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 transition-all font-bold text-sm"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Eşleştirmeleri Yenile
                    </button>

                    <button
                        onClick={async () => {
                            if (window.confirm('Ödeme geçmişi kullanılarak tüm siparişlerin hakedişleri yeniden hesaplanacaktır. Mevcut hatalı tutarlar düzeltilecektir. Devam edilsin mi?')) {
                                setIsImporting(true)
                                setLoadingMsg("Veriler yeniden hesaplanıyor...")
                                const res = await repairFinanceData()
                                if (res.success) {
                                    alert(`${res.repaired} adet sipariş başarıyla güncellendi.`)
                                    window.location.reload()
                                } else {
                                    alert('Hata: ' + res.error)
                                    setIsImporting(false)
                                }
                            }
                        }}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-xl hover:bg-indigo-500/20 transition-all font-bold text-sm"
                        title="Ödeme geçmişini kullanarak tutar hatalarını düzeltir."
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Sistemi Yeniden Hesapla
                    </button>

                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm",
                            showHistory ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        )}
                    >
                        <Clock className="w-4 h-4" />
                        Yükleme Geçmişi
                    </button>
                </div>
            </div>

            {/* Upload History Section */}
            {showHistory && (
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            Son 20 Yükleme Geçmişi
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                                    <th className="px-6 py-3">Dosya Adı</th>
                                    <th className="px-6 py-3">Tür</th>
                                    <th className="px-6 py-3">Tarih</th>
                                    <th className="px-6 py-3">İşlenen</th>
                                    <th className="px-6 py-3">Detaylar</th>
                                    <th className="px-6 py-3">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 text-xs">
                                {uploadLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-400 font-medium">Yükleme geçmişi bulunamadı.</td>
                                    </tr>
                                ) : (
                                    uploadLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-3 font-bold text-zinc-700">{log.filename}</td>
                                            <td className="px-6 py-3 uppercase font-black text-[10px] text-zinc-500">{log.upload_type === 'orders' ? 'Sipariş' : 'Ödeme'}</td>
                                            <td className="px-6 py-3 text-zinc-500">{formatDate(log.created_at)}</td>
                                            <td className="px-6 py-3 font-bold">{log.processed_count}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {log.upload_type === 'orders' ? (
                                                        <>
                                                            <span className="text-blue-600 font-bold">Gun: {log.updated_count}</span>
                                                            <span className="text-emerald-600 font-bold">Ekl: {log.inserted_count}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-emerald-600 font-bold">Eşl: {log.matched_count}</span>
                                                            <span className="text-amber-600 font-bold">Eşl. Olmayan: {log.unmatched_count}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {log.status === 'success' ? (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-black uppercase text-[9px] tracking-widest ring-1 ring-emerald-200">Başarılı</span>
                                                ) : (
                                                    <div className="group relative cursor-help">
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-black uppercase text-[9px] tracking-widest ring-1 ring-rose-200 flex items-center gap-1">
                                                            Hata <AlertCircle className="w-3 h-3" />
                                                        </span>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white rounded-lg text-[10px] font-medium hidden group-hover:block z-10 shadow-xl">
                                                            {log.error_message || 'Bilinmeyen hata'}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Ödemesi Yapılan</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-zinc-900">{stats.paidCount}</p>
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(stats.paidAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Ödeme Bekleyen</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-zinc-900">{stats.unpaidCount}</p>
                            <p className="text-sm font-bold text-amber-600">{formatCurrency(stats.unpaidAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Vadesi Geçen</p>
                        <p className="text-2xl font-black text-zinc-900">{stats.overdueCount}</p>
                    </div>
                </div>
            </div>

            {importMsg && (
                <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    importMsg.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                )}>
                    {importMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{importMsg.text}</p>
                    <button onClick={() => setImportMsg(null)} className="ml-auto text-xs font-bold uppercase hover:underline">Kapat</button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-zinc-50/50">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                                    activeTab === 'all' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                Tüm Satışlar
                            </button>
                            <button
                                onClick={() => setActiveTab('paid')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                                    activeTab === 'paid' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                Ödemesi Yatanlar
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <input
                                    type="date"
                                    className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <span className="text-zinc-400 font-bold">-</span>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                <input
                                    type="date"
                                    className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="px-2 py-1 text-[10px] font-black uppercase text-zinc-400 hover:text-rose-500 transition-colors"
                                >
                                    Sıfırla
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Arama (Sipariş, Paket, Barkod)..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                        >
                            <option value="all">Filtrele: Hepsi</option>
                            <option value="paid">Filtrele: Ödenmiş</option>
                            <option value="unpaid">Filtrele: Bekliyor</option>
                            <option value="overdue">Filtrele: Vadesi Geçmiş</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-zinc-50/50 text-zinc-500 text-[11px] font-black uppercase tracking-widest border-b border-zinc-100">
                                <th className="px-6 py-4">Sipariş Bilgisi</th>
                                <th className="px-6 py-4">Ürün Detayı</th>
                                <th className="px-6 py-4">Tarihler</th>
                                <th className="px-6 py-4 text-right">Tutar / Kesinti</th>
                                <th className="px-6 py-4">Vade / Ödeme</th>
                                <th className="px-6 py-4 text-right">Net Hakediş / Ref</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-sm">
                            {paginatedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-zinc-400 font-medium">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => {
                                    const remaining = getRemainingDays(order.expected_payout_at)
                                    const isOverdue = order.payment_status === 'unpaid' && remaining !== null && remaining < 0

                                    return (
                                        <React.Fragment key={order.id}>
                                            <tr
                                                className={cn(
                                                    "hover:bg-zinc-50/50 transition-colors group cursor-pointer border-b border-zinc-50",
                                                    expandedOrders.has(`${order.order_number}_${order.package_no || 'HEAD'}`) && "bg-indigo-50/30"
                                                )}
                                                onClick={() => toggleExpand(order.order_number, order.package_no || null)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            <ChevronDown className={cn(
                                                                "w-4 h-4 text-zinc-400 transition-transform",
                                                                expandedOrders.has(`${order.order_number}_${order.package_no || 'HEAD'}`) && "rotate-180 text-indigo-500"
                                                            )} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-zinc-900">#{order.order_number}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                                                <Package className="w-3 h-3 text-indigo-400" />
                                                                <span>Paket: {order.package_no || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[200px] space-y-1">
                                                        <p className="font-bold text-zinc-900 leading-tight truncate" title={order.product_name || ''}>
                                                            {order.product_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                            <Barcode className="w-3 h-3 text-emerald-400" />
                                                            <span>{order.barcode}</span>
                                                            <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] font-black">{order.quantity} Adet</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex items-center gap-2 text-zinc-600">
                                                            <Calendar className="w-3 h-3 text-zinc-400" />
                                                            <span>Sipariş: {formatDate(order.order_date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-zinc-600 font-medium">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            <span>Teslim: {formatDate(order.delivered_at)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-black text-zinc-900">{formatCurrency(order.sale_total)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5">
                                                        {order.payment_status === 'paid' ? (
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase ring-1 ring-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Ödendi
                                                            </div>
                                                        ) : (
                                                            <div className={cn(
                                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ring-1",
                                                                isOverdue ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                                                            )}>
                                                                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                {isOverdue ? 'Vade Geçti' : 'Ödeme Bekliyor'}
                                                            </div>
                                                        )}

                                                        {order.payment_status === 'unpaid' && (
                                                            <div className="space-y-1">
                                                                {order.due_at && (
                                                                    <p className="text-[10px] text-zinc-500 font-bold">
                                                                        Vade Dolum: {new Date(order.due_at).toLocaleDateString('tr-TR')}
                                                                    </p>
                                                                )}
                                                                {order.expected_payout_at && (
                                                                    <p className={cn(
                                                                        "text-xs font-bold font-mono tracking-tight",
                                                                        isOverdue ? "text-rose-500" : "text-indigo-600"
                                                                    )}>
                                                                        Bkl. Ödeme: {new Date(order.expected_payout_at).toLocaleDateString('tr-TR')}
                                                                        <span className="ml-1 opacity-70">
                                                                            ({remaining === 0 ? 'Bugün' : remaining !== null && remaining < 0 ? 'Vadesi geçti' : `${remaining} gün`})
                                                                        </span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {order.payment_status === 'paid' ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-black text-emerald-600 text-base">{formatCurrency(order.paid_amount || 0)}</span>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase mt-0.5">
                                                                <span>Brt: {formatCurrency(order.sale_total)}</span>
                                                                <span>•</span>
                                                                <span>Kom: {formatCurrency(order.commission_amount || 0)}</span>
                                                            </div>
                                                            <div className="mt-1 text-[10px] text-zinc-400 font-mono italic">
                                                                Ref: {order.payment_reference || '-'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end opacity-40">
                                                            <span className="font-black text-zinc-400">{formatCurrency(order.sale_total)}</span>
                                                            <span className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5 italic">Beklenen</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Expandable Details */}
                                            {expandedOrders.has(`${order.order_number}_${order.package_no || 'HEAD'}`) && (
                                                <tr className="bg-white border-x-2 border-indigo-500/20">
                                                    <td colSpan={6} className="px-12 py-6">
                                                        {isDetailLoading === `${order.order_number}_${order.package_no || 'HEAD'}` ? (
                                                            <div className="flex items-center justify-center py-8 gap-3 text-zinc-400 font-medium">
                                                                <RefreshCcw className="w-5 h-5 animate-spin text-indigo-500" />
                                                                İşlem detayları yükleniyor...
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                                                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500">İŞLEM DETAYLARI</h4>
                                                                    </div>
                                                                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-black">{orderDetails[`${order.order_number}_${order.package_no || 'HEAD'}`]?.length || 0} ADET İŞLEM</span>
                                                                </div>
                                                                <div className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50/20">
                                                                    <table className="w-full text-xs">
                                                                        <thead>
                                                                            <tr className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-400 font-black text-[10px] uppercase tracking-wider">
                                                                                <th className="px-4 py-3 text-left">İŞLEM TİPİ</th>
                                                                                <th className="px-4 py-3 text-left">DETAY (ÜRÜN & AÇIKLAMA)</th>
                                                                                <th className="px-4 py-3 text-right">TUTAR</th>
                                                                                <th className="px-4 py-3 text-right">KOMİSYON (TY)</th>
                                                                                <th className="px-4 py-3 text-right">NET TUTAR (SATICI)</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-zinc-50">
                                                                            {orderDetails[`${order.order_number}_${order.package_no || 'HEAD'}`]?.map((row) => (
                                                                                <tr key={row.id} className="hover:bg-white transition-colors">
                                                                                    <td className="px-4 py-3 font-bold text-zinc-600">{row.transaction_type || 'Bilinmiyor'}</td>
                                                                                    <td className="px-4 py-3 text-zinc-500 italic max-w-sm" title={
                                                                                        row.raw_row_json?.['Ürün Adı'] ||
                                                                                        row.raw_row_json?.['İşlem Tipi Detayı'] ||
                                                                                        row.raw_row_json?.['Açıklama'] ||
                                                                                        row.raw_row_json?.['Ürün İsmi'] || ''
                                                                                    }>
                                                                                        <p className="truncate">
                                                                                            {row.raw_row_json?.['Ürün Adı'] ||
                                                                                                row.raw_row_json?.['İşlem Tipi Detayı'] ||
                                                                                                row.raw_row_json?.['Açıklama'] ||
                                                                                                row.raw_row_json?.['Ürün İsmi'] ||
                                                                                                'Açıklama yok'}
                                                                                        </p>
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-right font-medium text-zinc-900">{formatCurrency(row.amount)}</td>
                                                                                    <td className="px-4 py-3 text-right text-rose-500 font-medium">{formatCurrency(row.commission)}</td>
                                                                                    <td className="px-4 py-3 text-right font-black text-indigo-600">
                                                                                        {formatCurrency(row.net_amount || (row.amount - (row.commission || 0) - (row.discount || 0) - (row.penalty || 0)))}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                            <tr className="bg-emerald-50/50 font-black border-t-2 border-emerald-100 text-emerald-900">
                                                                                <td className="px-4 py-4 uppercase text-[10px]">TOPLAM</td>
                                                                                <td className="px-4 py-4 text-[10px]">{orderDetails[`${order.order_number}_${order.package_no || 'HEAD'}`]?.length || 0} ADET İŞLEM</td>
                                                                                <td className="px-4 py-4 text-right">{formatCurrency(orderDetails[`${order.order_number}_${order.package_no || 'HEAD'}`]?.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 0)}</td>
                                                                                <td className="px-4 py-4 text-right">-{formatCurrency(orderDetails[`${order.order_number}_${order.package_no || 'HEAD'}`]?.reduce((s, r) => s + (Number(r.commission) || 0), 0) || 0)}</td>
                                                                                <td className="px-4 py-4 text-right text-sm font-black border-l border-emerald-100/50 bg-emerald-100/20">
                                                                                    {formatCurrency(orderDetails[`${order.order_number}_${order.package_no || 'HEAD'}`]?.reduce((s, r) => s + (Number(r.amount) - (Number(r.commission) || 0) - (Number(r.discount) || 0) - (Number(r.penalty) || 0)), 0) || 0)}
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })
                            )}
                        </tbody>

                    </table>
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-zinc-500 font-medium">
                        Toplam {filteredOrders.length} kayıt arasından {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} arası gösteriliyor.
                    </p>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronDown className="w-5 h-5 rotate-90" />
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1
                                    // Show first, last, and pages around current
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 2 && page <= currentPage + 2)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                                                    currentPage === page
                                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                                        : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                                                )}
                                            >
                                                {page}
                                            </button>
                                        )
                                    } else if (
                                        page === currentPage - 3 ||
                                        page === currentPage + 3
                                    ) {
                                        return <span key={page} className="px-1 text-zinc-400">...</span>
                                    }
                                    return null
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronDown className="w-5 h-5 -rotate-90" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
