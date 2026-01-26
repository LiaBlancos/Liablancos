import { PackagePlus, PackageMinus, ScanLine, AlertTriangle, History, ArrowUpRight, ArrowDownLeft, TrendingUp, Package, ChevronRight, MapPin, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { getRecentLogs, getLowStockProducts, fetchTrendyolProducts } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [logs, lowStockProducts, trendyolData] = await Promise.all([
    getRecentLogs(),
    getLowStockProducts(),
    fetchTrendyolProducts()
  ])

  const trendyolProducts = trendyolData.products || []
  const criticalTrendyol = trendyolProducts.filter((p: any) => p.onSale && p.quantity <= 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Hoş geldiniz 👋</h1>
        <p className="text-zinc-500 mt-1">Depo operasyonlarınızı buradan yönetin.</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/stock-in"
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <PackagePlus className="w-8 h-8 mb-3 relative z-10" />
          <span className="font-bold text-lg block relative z-10">Stok Giriş</span>
          <span className="text-emerald-100 text-sm relative z-10">Ürün ekle</span>
          <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/stock-out"
          className="group relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <PackageMinus className="w-8 h-8 mb-3 relative z-10" />
          <span className="font-bold text-lg block relative z-10">Stok Çıkış</span>
          <span className="text-rose-100 text-sm relative z-10">Ürün çıkar</span>
          <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/audit"
          className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <ScanLine className="w-8 h-8 mb-3 relative z-10" />
          <span className="font-bold text-lg block relative z-10">Hızlı Kontrol</span>
          <span className="text-indigo-100 text-sm relative z-10">Tarama yap</span>
          <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/inventory"
          className="group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 text-white p-6 rounded-2xl shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <Package className="w-8 h-8 mb-3 relative z-10" />
          <span className="font-bold text-lg block relative z-10">Depo Stoğu</span>
          <span className="text-slate-300 text-sm relative z-10">Tümünü gör</span>
          <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Critical Stock Alerts - Split View */}
      {(lowStockProducts.length > 0 || criticalTrendyol.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warehouse Critical Stock */}
          {lowStockProducts.length > 0 ? (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-amber-200 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-amber-900 leading-tight">Depo Kritik Stok</h3>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{lowStockProducts.length} ürün kritik seviyede</p>
                  </div>
                </div>
                <Link href="/low-stock" className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-lg shadow-amber-600/20">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-amber-100 flex-1">
                {lowStockProducts.slice(0, 3).map((product: any) => (
                  <div key={product.id} className="p-4 flex items-center justify-between hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center shadow-sm">
                        <Package className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900 leading-tight truncate max-w-[180px]" title={product.name}>{product.name}</p>
                        <p className="text-[11px] text-zinc-800 font-black font-mono mt-0.5">{product.barcode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-rose-600">{product.quantity}</p>
                      <p className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider">{product.barcode.slice(-4)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockProducts.length > 3 && (
                <Link href="/low-stock" className="p-3 bg-white/30 text-center text-[10px] font-black uppercase text-amber-700 hover:bg-white/50 transition-colors tracking-widest">
                  +{lowStockProducts.length - 3} Ürün Daha
                </Link>
              )}
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-zinc-900">Depo Stokları İyi</p>
              <p className="text-xs text-zinc-400">Tüm ürünler güvenli seviyede.</p>
            </div>
          )}

          {/* Trendyol Critical Stock */}
          {criticalTrendyol.length > 0 ? (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-orange-200 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-orange-900 leading-tight">Trendyol Kritik Stok</h3>
                    <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">{criticalTrendyol.length} ürün tükeniyor</p>
                  </div>
                </div>
                <Link href="/low-stock" className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-lg shadow-orange-600/20">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-orange-100 flex-1">
                {criticalTrendyol.slice(0, 3).map((product: any) => (
                  <div key={product.barcode} className="p-4 flex items-center justify-between hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center shadow-sm overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-zinc-900 leading-tight truncate max-w-[180px]" title={product.title}>{product.title}</p>
                        <p className="text-[11px] text-zinc-800 font-black font-mono mt-0.5">{product.barcode}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-orange-600">{product.quantity}</p>
                      <p className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider">{product.barcode.slice(-4)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {criticalTrendyol.length > 3 && (
                <Link href="/low-stock" className="p-3 bg-white/30 text-center text-[10px] font-black uppercase text-orange-700 hover:bg-white/50 transition-colors tracking-widest">
                  +{criticalTrendyol.length - 3} Ürün Daha
                </Link>
              )}
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-zinc-900">Mağaza Stokları İyi</p>
              <p className="text-xs text-zinc-400">Mağazanızda ürünleriniz yeterli.</p>
            </div>
          )}
        </div>
      )}

      {/* Stats & Activity Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Stats Cards */}
        <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">0</p>
            <p className="text-sm text-zinc-500">Bugün Giriş</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">0</p>
            <p className="text-sm text-zinc-500">Bugün Çıkış</p>
          </div>

          <Link href="/low-stock" className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:border-amber-200 transition-colors group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5 text-amber-600 group-hover:text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{lowStockProducts.length + criticalTrendyol.length}</p>
            <p className="text-sm text-zinc-500">Kritik Stok</p>
          </Link>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-400" />
              Son Hareketler
            </h3>
          </div>

          <div className="space-y-3">
            {logs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.transaction_type === 'STOCK_IN'
                  ? 'bg-emerald-100 text-emerald-600'
                  : log.transaction_type === 'STOCK_OUT'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-indigo-100 text-indigo-600'
                  }`}>
                  {log.transaction_type === 'STOCK_IN' ? <ArrowUpRight className="w-4 h-4" /> :
                    log.transaction_type === 'STOCK_OUT' ? <ArrowDownLeft className="w-4 h-4" /> :
                      <ScanLine className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate" title={log.products?.name}>{log.products?.name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold font-mono">
                    {log.products?.barcode}
                  </p>
                </div>
                <span className={`text-sm font-bold ${log.transaction_type === 'STOCK_OUT' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                  {log.transaction_type === 'STOCK_OUT' ? '-' : '+'}{Math.abs(log.quantity_change)}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz hareket kaydı yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
