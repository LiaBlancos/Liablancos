'use client'

import { useState } from 'react'
import {
    Wallet,
    RefreshCcw,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    Package,
    Search,
    ChevronDown,
    Filter,
    Calendar,
    ArrowUpRight,
    Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { syncTrendyolPayments } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface PaymentsContentProps {
    stats: {
        paid: number
        unpaid: number
        last_checked: string | null
        last_error: string | null
    }
    packages: any[]
    unmatched: any[]
}

export default function PaymentsContent({ stats, packages, unmatched }: PaymentsContentProps) {
    const [isSyncing, setIsSyncing] = useState(false)
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showUnmatched, setShowUnmatched] = useState(false)
    const router = useRouter()

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const result = await syncTrendyolPayments()
            if (result.success) {
                const log = result.log
                alert(`Senkronizasyon Başarılı!\n\nÇekilen Ödeme: ${log.pulled_count}\nEşleşen: ${log.matched_count}\nEşleşmeyen: ${log.unmatched_count}`)
                router.refresh()
            } else {
                alert('Senkronizasyon hatası: ' + result.error)
            }
        } catch (e) {
            alert('Senkronizasyon sırasında bir hata oluştu.')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleReset = async () => {
        if (!confirm('DİKKAT: Tüm sipariş ve ödeme verileri silinecek ve sıfırdan çekilecek. Bu işlem duplicate (çift) kayıtları temizlemek için önerilir. Devam etmek istiyor musunuz?')) return

        setIsSyncing(true)
        try {
            const { resetDatabase } = await import('@/lib/actions')
            const result = await resetDatabase()
            if (result.success) {
                alert('Veritabanı temizlendi. Şimdi veriler tekrar çekilecek...')
                await handleSync()
            } else {
                alert('Sıfırlama hatası: ' + result.error)
            }
        } catch (error) {
            console.error('Reset error:', error)
            alert('Beklenmedik bir hata oluştu.')
        } finally {
            setIsSyncing(false)
        }
    }

    const filteredPackages = packages.filter(pkg => {
        const matchesFilter = filter === 'all' || pkg.payment_status === filter
        const matchesSearch =
            pkg.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.shipment_package_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="space-y-8 animate-fade">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight leading-none mb-1">Ödemeler</h1>
                        <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Son Güncelleme: {stats.last_checked ? new Date(stats.last_checked).toLocaleString('tr-TR') : 'Henüz yapılmadı'}</span>
                        </div>
                        {stats.last_error && (
                            <div className="mt-2 text-rose-500 font-bold text-xs bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 inline-block">
                                Error: {stats.last_error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Excel Upload */}
                    <label className={cn(
                        "px-4 py-4 rounded-3xl font-bold text-sm bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-2",
                        isSyncing && "opacity-50 pointer-events-none"
                    )}>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                if (!confirm(`${file.name} dosyasını yüklemek istiyor musunuz?`)) return

                                setIsSyncing(true)
                                try {
                                    const { importPaymentExcel } = await import('@/lib/actions')
                                    const formData = new FormData()
                                    formData.append('file', file)

                                    const result = await importPaymentExcel(formData)

                                    if (result.success) {
                                        alert(`Excel Yükleme Başarılı!\n\nİşlenen Satır: ${result.processed}\nEşleşen Sipariş: ${result.matched}\nEşleşmeyen: ${result.unmatched}`)
                                        router.refresh()
                                    } else {
                                        alert('Excel yükleme hatası: ' + result.error)
                                    }
                                } catch (error: any) {
                                    alert('Hata: ' + error.message)
                                } finally {
                                    setIsSyncing(false)
                                    e.target.value = '' // Reset input
                                }
                            }}
                        />
                        <Upload className="w-5 h-5" />
                        Excel Yükle
                    </label>

                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        disabled={isSyncing}
                        className="px-4 py-4 rounded-3xl font-bold text-sm bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                        Verileri Sıfırla
                    </button>

                    <button
                        onClick={() => setShowUnmatched(!showUnmatched)}
                        className={cn(
                            "px-6 py-4 rounded-3xl font-bold text-sm transition-all flex items-center gap-2",
                            showUnmatched
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                : "bg-white border-2 border-zinc-100 text-zinc-600 hover:border-zinc-200"
                        )}
                    >
                        <AlertCircle className="w-5 h-5" />
                        Eşleşmeyenler ({unmatched.length})
                    </button>
                    <button
                        disabled={isSyncing}
                        onClick={handleSync}
                        className="px-8 py-4 bg-zinc-900 text-white rounded-3xl font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-2xl shadow-zinc-200 disabled:opacity-50"
                    >
                        <RefreshCcw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
                        {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Güncelle'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                    <div>
                        <p className="text-zinc-500 font-black text-[12px] uppercase tracking-widest mb-2">Ödemesi Yapıldı</p>
                        <h3 className="text-5xl font-black text-zinc-900 leading-none">{stats.paid}</h3>
                    </div>
                    <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                    <div>
                        <p className="text-zinc-500 font-black text-[12px] uppercase tracking-widest mb-2">Ödeme Bekliyor</p>
                        <h3 className="text-5xl font-black text-zinc-900 leading-none">{stats.unpaid}</h3>
                    </div>
                    <div className="w-16 h-16 rounded-[2rem] bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <Clock className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            {!showUnmatched && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Sipariş no, paket no veya müşteri adı ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-zinc-50 rounded-2xl w-full md:w-auto">
                        {(['all', 'paid', 'unpaid'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                                    filter === f
                                        ? "bg-white text-zinc-900 shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                {f === 'all' ? 'Hepsi' : f === 'paid' ? 'Ödenenler' : 'Bekleyenler'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content (Packages or Unmatched) */}
            <div className="space-y-4">
                {showUnmatched ? (
                    <div className="bg-rose-50/50 p-8 rounded-[3rem] border border-rose-100 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-rose-900 flex items-center gap-3">
                                <AlertCircle className="w-7 h-7" />
                                Eşleşmeyen Ödemeler
                            </h2>
                            <p className="text-rose-600 font-medium text-sm">Sistemde kaydı bulunmayan {unmatched.length} ödeme bulundu.</p>
                        </div>

                        {unmatched.length === 0 ? (
                            <div className="text-center py-12 text-rose-400 font-medium">Bütün ödemeler eşleşmiş durumda! ✨</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {unmatched.map((tx) => (
                                    <div key={tx.id} className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Referans No</p>
                                                <p className="font-mono font-bold text-sm text-zinc-900">{tx.payment_reference}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-lg">EŞLEŞMEDİ</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tutar</p>
                                                <p className="font-black text-lg text-zinc-900">{tx.amount} TL</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tarih</p>
                                                <p className="font-bold text-sm text-zinc-600">{new Date(tx.transaction_date).toLocaleDateString('tr-TR')}</p>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-rose-50">
                                            <p className="text-[10px] font-black text-zinc-400 underline">Trendyol Bilgisi:</p>
                                            <p className="text-xs text-zinc-500 mt-1">Paket: {tx.shipment_package_id || 'Yok'} | Sipariş: {tx.order_number || 'Yok'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
                            <Search className="w-10 h-10 text-zinc-200" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Sonuç Bulunamadı</h3>
                        <p className="text-zinc-500">Aramanızla eşleşen ödeme kaydı bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredPackages.map((pkg) => (
                            <div key={pkg.id} className="group bg-white rounded-[2.5rem] border border-zinc-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col">
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sipariş No</span>
                                                <span className="text-sm font-mono font-bold text-indigo-600">#{pkg.order_number}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">
                                                {pkg.customer_name}
                                            </h3>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2",
                                            pkg.payment_status === 'paid'
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                : "bg-amber-50 text-amber-600 border border-amber-100"
                                        )}>
                                            {pkg.payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {pkg.payment_status === 'paid' ? 'Ödemesi Yapıldı' : 'Ödeme Bekliyor'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-zinc-50">
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Package className="w-3 h-3" /> Ürünler
                                            </p>
                                            <div className="space-y-2">
                                                {pkg.shipment_package_items?.map((item: any) => (
                                                    <p key={item.id} className="text-xs font-bold text-zinc-600 line-clamp-1">
                                                        {item.quantity}x {item.product_name}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <ArrowUpRight className="w-3 h-3" /> Toplam
                                                </p>
                                                <p className="text-xl font-black text-zinc-900">{pkg.total_price} TL</p>
                                            </div>
                                            {pkg.payment_status === 'paid' && (
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Yatan Tutar</p>
                                                    <p className="text-lg font-black text-indigo-600">{pkg.paid_amount} TL</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Sipariş Tarihi</span>
                                                <span className="text-xs font-bold text-zinc-700">{new Date(pkg.order_date).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                            {pkg.paid_at && (
                                                <div className="flex flex-col pl-4 border-l border-zinc-100">
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Ödeme Tarihi</span>
                                                    <span className="text-xs font-bold text-emerald-600">{new Date(pkg.paid_at).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Paket ID</span>
                                            <span className="text-xs font-mono font-bold text-zinc-500">{pkg.shipment_package_id || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
