import { Package, Calendar, AlertCircle, ShoppingBag, Truck, CheckCircle2, XCircle, TrendingUp, DollarSign, Activity, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import SyncOrdersButton from './SyncOrdersButton'

export const dynamic = 'force-dynamic'

export default async function AllOrdersPage() {
    // Veritabanından (Cache tablosundan) tüm kayıtlı siparişleri çek
    const { data: dbOrders, error: dbError } = await supabase
        .from('trendyol_orders_cache')
        .select('*')
        .order('order_date', { ascending: false })

    const allOrders = dbOrders ? dbOrders.map(row => row.raw_data) : []
    const error = dbError?.message

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Created': return 'bg-amber-500 text-white'
            case 'Picking': return 'bg-indigo-500 text-white'
            case 'Shipped': return 'bg-blue-500 text-white'
            case 'Delivered': return 'bg-emerald-500 text-white'
            case 'Cancelled': 
            case 'UnSupplied':
            case 'Returned': return 'bg-rose-500 text-white'
            default: return 'bg-zinc-500 text-white'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Created': return 'Yeni Sipariş'
            case 'Picking': return 'İşleme Alındı'
            case 'Shipped': return 'Kargoya Verildi'
            case 'Delivered': return 'Teslim Edildi'
            case 'Cancelled': return 'İptal Edildi'
            case 'UnSupplied': return 'Tedarik Edilemedi'
            case 'Returned': return 'İade Edildi'
            default: return status
        }
    }

    // Dashboard Calculations
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((acc: number, order: any) => acc + (order.totalPrice || 0), 0);
    const deliveredCount = allOrders.filter((o: any) => o.status === 'Delivered').length;
    const cancelledCount = allOrders.filter((o: any) => ['Cancelled', 'Returned', 'UnSupplied'].includes(o.status)).length;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                        <Package className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">Tüm Siparişler</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Geçmişten bugüne tüm sipariş hareketleriniz</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SyncOrdersButton />
                </div>
            </div>

            {/* Mini Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Toplam İşlem</p>
                        <p className="text-2xl font-black text-slate-800">{totalOrders} <span className="text-xs font-bold text-slate-400">Adet</span></p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Toplam Hacim</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Teslim Edilen</p>
                        <p className="text-2xl font-black text-blue-600">{deliveredCount} <span className="text-xs font-bold text-slate-400">Adet</span></p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">İptal / İade</p>
                        <p className="text-2xl font-black text-rose-600">{cancelledCount} <span className="text-xs font-bold text-slate-400">Adet</span></p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col items-center text-center space-y-3 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-rose-900">Bağlantı Hatası</h3>
                        <p className="text-sm text-rose-600 max-w-sm mx-auto">{error}</p>
                    </div>
                </div>
            )}

            {!error && allOrders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-zinc-200">
                        <Package className="w-12 h-12 text-zinc-200" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Sipariş Bulunamadı</h3>
                    <p className="text-zinc-500">Belirtilen tarih aralığında hiçbir sipariş kaydı bulunmuyor.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allOrders.map((order: any) => (
                    <div key={order.orderNumber} className="group bg-white rounded-[2.5rem] border border-zinc-100 hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-500 overflow-hidden flex flex-col">
                        {/* Order Header Info */}
                        <div className="p-6 md:p-8 border-b border-zinc-50 bg-zinc-50/50 group-hover:bg-white transition-colors">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sipariş No</span>
                                        <span className="text-sm font-mono font-bold text-slate-700">#{order.orderNumber}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900">
                                        {order.customerFirstName} {order.customerLastName}
                                    </h3>
                                </div>
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                    getStatusColor(order.status)
                                )}>
                                    {getStatusText(order.status)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2.5 text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600">
                                        {new Date(order.orderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600">
                                        {order.lines?.length || 0} Farklı Ürün
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order Lines */}
                        <div className="p-6 md:p-8 space-y-4">
                            {order.lines?.map((line: any) => (
                                <div key={line.id} className="flex gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100/50 group-hover:bg-white group-hover:border-zinc-100 transition-all">
                                    <div className="w-16 h-16 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                                        <Package className="w-8 h-8 text-zinc-200" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 line-clamp-1 mb-1">{line.productName}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded uppercase">
                                                {line.barcode}
                                            </span>
                                            <span className="text-xs font-black text-slate-700">
                                                {line.quantity} ADET
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer / Total */}
                        <div className="mt-auto p-6 md:p-8 bg-zinc-50/50 border-t border-zinc-50 flex items-center justify-between">
                            <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                                Toplam Tutar
                            </div>
                            <div className="text-2xl font-black text-zinc-900">
                                {order.totalPrice} <span className="text-sm font-bold text-zinc-400">TL</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
