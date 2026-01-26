import { getTrendyolOrders } from '@/lib/actions'
import { ShoppingBag, Package, User, Calendar, ExternalLink, AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
    // Fetch only active/new orders (Created status in Trendyol)
    const result = await getTrendyolOrders('Created')
    const orders = result.orders || []
    const error = result.error

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">Gelen Siparişler</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Trendyol mağazanızdan gelen son siparişler</p>
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
                    <a href="/settings" className="px-6 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors">
                        Ayarları Kontrol Et
                    </a>
                </div>
            )}

            {!error && orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-zinc-200">
                        <ShoppingBag className="w-12 h-12 text-zinc-200" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Sipariş Bulunamadı</h3>
                    <p className="text-zinc-500">Şu an aktif bir siparişiniz bulunmuyor.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {orders.map((order: any) => (
                    <div key={order.orderNumber} className="group bg-white rounded-[2.5rem] border border-zinc-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col">
                        {/* Order Header Info */}
                        <div className="p-6 md:p-8 border-b border-zinc-50 bg-zinc-50/50 group-hover:bg-white transition-colors">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sipariş No</span>
                                        <span className="text-sm font-mono font-bold text-indigo-600">#{order.orderNumber}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">
                                        {order.customerFirstName} {order.customerLastName}
                                    </h3>
                                </div>
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                    order.status === 'Created' ? "bg-amber-500 text-white" :
                                        order.status === 'Picking' ? "bg-indigo-500 text-white" :
                                            order.status === 'Shipped' ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white"
                                )}>
                                    {order.status === 'Created' ? 'Yeni Sipariş' : order.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2.5 text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600">
                                        {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600">
                                        {order.lines.length} Farklı Ürün
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order Lines */}
                        <div className="p-6 md:p-8 space-y-4">
                            {order.lines.map((line: any) => (
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
                                            <span className="text-xs font-black text-indigo-600">
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
