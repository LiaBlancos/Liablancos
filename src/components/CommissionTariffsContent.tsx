'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchTrendyolCommissionRates, getCommissionTariffsData } from '@/lib/commission-actions'
import { syncTrendyolProducts } from '@/lib/actions'
import { RefreshCw, Search, ChevronDown, ChevronRight, Calculator, Package, Info, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

// Profit calculation (from ProfitCalculator.tsx logic)
function calculateProfit(salePrice: number, cost: number, shipping: number, commissionRate: number) {
    const saleVatFactor = 1.10
    const costVatFactor = 1.10
    const shippingVatFactor = 1.20
    const commVatFactor = 1.20
    const stopajRatio = 0.02 // Updated stopaj ratio often 2% in these calculations, but user's code had 0.01. I will use 0.01 as in original.

    const saleExcl = salePrice / saleVatFactor
    const costExcl = cost / costVatFactor
    const shippingExcl = shipping / shippingVatFactor

    const commRatio = commissionRate / 100
    const commAmount = salePrice * commRatio
    const commExcl = commAmount / commVatFactor
    const stopajAmount = saleExcl * 0.01 // Consistent with previous code piece

    const netProfit = saleExcl - costExcl - shippingExcl - commExcl - stopajAmount
    const profitPercent = saleExcl > 0 ? (netProfit / saleExcl) * 100 : 0

    return { netProfit, profitPercent }
}

type ProductData = {
    id: string
    barcode: string
    name: string
    sku: string
    image: string | null
    stock: number
    salePrice: number
    cost: number
    shipping: number
    desi: number
    modelId: string | null
    commissionRate: number | null
    lastTransactionDate: string | null
}

export default function CommissionTariffsContent() {
    const [products, setProducts] = useState<ProductData[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [manualPrices, setManualPrices] = useState<Map<string, number>>(new Map())

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const result = await getCommissionTariffsData()
        if (result.success) {
            setProducts(result.products || [])
        } else {
            console.error(result.error)
        }
        setLoading(false)
    }

    async function handleSyncCommissions() {
        setSyncing(true)
        try {
            // 1. Sync Product Data (Prices, Desi, ModelID)
            console.log('[Commission Sync] Starting Product Sync...')
            const productSyncResult = await syncTrendyolProducts()
            if (productSyncResult.error) {
                console.warn('[Commission Sync] Product sync warning:', productSyncResult.error)
            }

            // 2. Sync Commission Rates (Finance API)
            console.log('[Commission Sync] Starting Finance Sync...')
            const commissionResult = await fetchTrendyolCommissionRates(15) // Last 15 days

            if (commissionResult.error) {
                alert(`Hata: ${commissionResult.error}`)
            } else {
                alert(`Başarılı: Ürün bilgileri ve ${commissionResult.count} komisyon oranı güncellendi.`)
                await loadData()
            }
        } catch (error: any) {
            console.error('[Commission Sync] Error:', error)
            alert('Senkronizasyon sırasında bir hata oluştu.')
        } finally {
            setSyncing(false)
        }
    }

    // Grouping logic
    const groupedProducts = useMemo(() => {
        const groups = new Map<string, ProductData[]>()

        products.forEach(p => {
            const groupKey = p.modelId || p.name
            const existing = groups.get(groupKey) || []
            groups.set(groupKey, [...existing, p])
        })

        return Array.from(groups.entries()).map(([key, items]) => ({
            key,
            items,
            main: items[0],
            totalStock: items.reduce((sum, item) => sum + item.stock, 0),
            hasWarning: items.some(item => item.commissionRate === null)
        }))
    }, [products])

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groupedProducts
        const lowerSearch = searchTerm.toLowerCase()
        return groupedProducts.filter(g =>
            g.main.name.toLowerCase().includes(lowerSearch) ||
            g.items.some(item =>
                item.barcode.includes(lowerSearch) ||
                (item.sku && item.sku.toLowerCase().includes(lowerSearch))
            )
        )
    }, [groupedProducts, searchTerm])

    const toggleExpand = (key: string) => {
        const newExpanded = new Set(expandedGroups)
        if (newExpanded.has(key)) newExpanded.delete(key)
        else newExpanded.add(key)
        setExpandedGroups(newExpanded)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header section with glassmorphism */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-2xl shadow-zinc-200/50">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                        <Calculator className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Ürün Komisyon Tarifeleri</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm text-zinc-500 font-medium">Trendyol Finans Entegrasyonu Aktif</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Ürün, barkod veya SKU ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 pl-12 pr-4 py-4 bg-white/80 border border-zinc-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm group-hover:bg-white"
                        />
                    </div>
                    <button
                        onClick={handleSyncCommissions}
                        disabled={syncing}
                        className="flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-zinc-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 group"
                    >
                        <RefreshCw className={cn("w-4 h-4 transition-transform duration-700", syncing && "animate-spin")} />
                        {syncing ? 'GÜNCELLENİYOR' : 'VERİLERİ GÜNCELLE'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="TOPLAM ÜRÜN" value={products.length} icon={<Package className="text-blue-500" />} color="blue" />
                <StatCard label="KOMİSYON VERİSİ" value={products.filter(p => p.commissionRate !== null).length} icon={<TrendingUp className="text-emerald-500" />} color="emerald" />
                <StatCard label="VERİ EKSİK" value={products.filter(p => p.commissionRate === null).length} icon={<AlertTriangle className="text-amber-500" />} color="amber" />
                <StatCard label="DÜŞÜK KÂRLI" value={products.filter(p => {
                    if (p.commissionRate === null) return false;
                    const { profitPercent } = calculateProfit(p.salePrice, p.cost, p.shipping, p.commissionRate);
                    return profitPercent < 5;
                }).length} icon={<TrendingDown className="text-rose-500" />} color="rose" />
            </div>

            {/* Product Table Container */}
            <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ürün Bilgisi</th>
                                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Stok</th>
                                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Satış Fiyatı</th>
                                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Komisyon %</th>
                                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kargo & Desi</th>
                                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maliyet</th>
                                <th className="px-6 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kâr Analizi</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Simülasyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Veriler Hazırlanıyor...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Package className="w-20 h-20 text-zinc-400" />
                                            <p className="text-lg font-bold text-zinc-950 uppercase tracking-widest">Hiç Ürün Bulunamadı</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredGroups.map((group) => {
                                    const isExpanded = expandedGroups.has(group.key)
                                    const hasItems = group.items.length > 1

                                    return (
                                        <div key={group.key} className="contents">
                                            {/* Group Header Row */}
                                            <tr
                                                className={cn(
                                                    "transition-all duration-300 group cursor-pointer",
                                                    isExpanded ? "bg-indigo-50/30" : "hover:bg-zinc-50/50"
                                                )}
                                                onClick={() => hasItems && toggleExpand(group.key)}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center group-hover:border-indigo-200 group-hover:shadow-lg transition-all">
                                                                {group.main.image ? (
                                                                    <img src={group.main.image} alt="" className="w-full h-full object-contain p-1" />
                                                                ) : (
                                                                    <Package className="w-6 h-6 text-zinc-300" />
                                                                )}
                                                            </div>
                                                            {hasItems && (
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                                                                    {group.items.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                {hasItems && (
                                                                    isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />
                                                                )}
                                                                <p className="font-extrabold text-zinc-900 truncate max-w-[300px] leading-tight group-hover:text-indigo-600 transition-colors">
                                                                    {group.main.name}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                                    {group.main.modelId ? `Model ID: ${group.main.modelId}` : group.main.barcode}
                                                                </span>
                                                                {group.hasWarning && (
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                                                                        <Info className="w-3 h-3 text-amber-500" />
                                                                        <span className="text-[9px] font-black text-amber-600 uppercase">Eksik Veri</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-black transition-all",
                                                        group.totalStock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" : "bg-rose-50 text-rose-700 border border-rose-100/50"
                                                    )}>
                                                        {group.totalStock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-zinc-900">₺{formatCurrency(group.main.salePrice)}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">Mevcut Fiyat</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    {group.main.commissionRate !== null ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-black text-indigo-600">%{group.main.commissionRate.toFixed(2)}</span>
                                                            <span className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">
                                                                {group.main.lastTransactionDate ? `${new Date(group.main.lastTransactionDate).toLocaleDateString('tr-TR')}` : 'Son İşlem'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col opacity-30">
                                                            <span className="text-sm font-bold text-zinc-400 tracking-widest">YOK</span>
                                                            <span className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">Satış Bekleniyor</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-zinc-800">₺{formatCurrency(group.main.shipping)}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">{group.main.desi} Desi</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-zinc-800">₺{formatCurrency(group.main.cost)}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">Giriş Fiyatı</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    {group.main.commissionRate !== null ? (
                                                        <ProfitSummary data={calculateProfit(group.main.salePrice, group.main.cost, group.main.shipping, group.main.commissionRate)} />
                                                    ) : (
                                                        <div className="h-10 w-32 bg-zinc-50 rounded-xl border border-dashed border-zinc-200" />
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="inline-flex items-center gap-3 p-2 bg-zinc-50 border border-zinc-100 rounded-2xl group shadow-sm hover:border-indigo-200 transition-all" onClick={(e) => e.stopPropagation()}>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder={`${group.main.salePrice.toFixed(0)}...`}
                                                                value={manualPrices.get(group.main.barcode) || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '')
                                                                    const newMap = new Map(manualPrices)
                                                                    if (val) newMap.set(group.main.barcode, parseFloat(val))
                                                                    else newMap.delete(group.main.barcode)
                                                                    setManualPrices(newMap)
                                                                }}
                                                                className="w-24 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-black text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-zinc-300"
                                                            />
                                                            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-300 pointer-events-none" />
                                                        </div>
                                                        {manualPrices.has(group.main.barcode) && group.main.commissionRate !== null && (
                                                            <div className="flex flex-col items-end pr-1 min-w-[60px] animate-in slide-in-from-right-2 duration-300">
                                                                <span className={cn(
                                                                    "text-xs font-black",
                                                                    calculateProfit(manualPrices.get(group.main.barcode)!, group.main.cost, group.main.shipping, group.main.commissionRate).netProfit > 0 ? "text-emerald-600" : "text-rose-600"
                                                                )}>
                                                                    ₺{calculateProfit(manualPrices.get(group.main.barcode)!, group.main.cost, group.main.shipping, group.main.commissionRate).netProfit.toFixed(1)}
                                                                </span>
                                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">İndirimli Kâr</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Variants Rows */}
                                            {isExpanded && group.items.map((variant) => (
                                                <tr key={variant.barcode} className="bg-zinc-50/10 border-l-4 border-indigo-500/50 hover:bg-zinc-50 transition-all animate-in slide-in-from-top-2 duration-200">
                                                    <td className="px-8 py-5 pl-16">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center p-1">
                                                                {variant.image ? <img src={variant.image} className="w-full h-full object-contain" /> : <Package className="w-4 h-4 text-zinc-300" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-zinc-700">{variant.sku || 'Barkod Bazlı'}</p>
                                                                <p className="text-[10px] font-mono font-bold text-zinc-400 tracking-tight leading-none mt-1 uppercase">{variant.barcode}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="text-xs font-black p-2 bg-white border border-zinc-100 rounded-lg text-zinc-600">{variant.stock}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-bold text-zinc-500">₺{formatCurrency(variant.salePrice)}</td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-xs font-black text-indigo-400">%{variant.commissionRate?.toFixed(2) || '---'}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-medium text-zinc-400">{variant.desi} Desi</td>
                                                    <td className="px-6 py-5 text-sm font-bold text-zinc-400">₺{formatCurrency(variant.cost)}</td>
                                                    <td className="px-6 py-5">
                                                        {variant.commissionRate !== null ? (
                                                            <ProfitSummary data={calculateProfit(variant.salePrice, variant.cost, variant.shipping, variant.commissionRate)} compact />
                                                        ) : <span className="text-[10px] text-zinc-200 uppercase font-black tracking-widest">BİLGİ YOK</span>}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="inline-flex relative scale-90 translate-x-4">
                                                            <input
                                                                type="text"
                                                                placeholder="Fiyat..."
                                                                value={manualPrices.get(variant.barcode) || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '')
                                                                    const newMap = new Map(manualPrices)
                                                                    if (val) newMap.set(variant.barcode, parseFloat(val))
                                                                    else newMap.delete(variant.barcode)
                                                                    setManualPrices(newMap)
                                                                }}
                                                                className="w-24 px-4 py-2 bg-white/50 border border-zinc-200 rounded-xl text-xs font-black text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-zinc-300"
                                                            />
                                                            {manualPrices.has(variant.barcode) && variant.commissionRate !== null && (
                                                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col items-end animate-in fade-in duration-300">
                                                                    <span className={cn(
                                                                        "text-[10px] font-black leading-none",
                                                                        calculateProfit(manualPrices.get(variant.barcode)!, variant.cost, variant.shipping, variant.commissionRate).netProfit > 0 ? "text-emerald-500" : "text-rose-500"
                                                                    )}>
                                                                        ₺{calculateProfit(manualPrices.get(variant.barcode)!, variant.cost, variant.shipping, variant.commissionRate).netProfit.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </div>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color }: { label: string, value: number | string, icon: React.ReactNode, color: string }) {
    const colors: Record<string, string> = {
        blue: "from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-100 shadow-blue-500/5",
        emerald: "from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100 shadow-emerald-500/5",
        amber: "from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-100 shadow-amber-500/5",
        rose: "from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-100 shadow-rose-500/5",
    }
    return (
        <div className={cn("bg-gradient-to-br p-6 rounded-[2rem] border shadow-xl transition-all hover:scale-[1.02] duration-300", colors[color])}>
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{value}</p>
        </div>
    )
}

function ProfitSummary({ data, compact = false }: { data: { netProfit: number, profitPercent: number }, compact?: boolean }) {
    const isProfitable = data.netProfit > 0
    return (
        <div className={cn("flex flex-col gap-1", compact ? "scale-90 origin-left" : "")}>
            <div className="flex items-baseline gap-1.5">
                <span className={cn("text-base font-black tracking-tight", isProfitable ? "text-emerald-600" : "text-rose-600")}>
                    ₺{data.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                    isProfitable ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                    %{data.profitPercent.toFixed(1)}
                </span>
            </div>
            {!compact && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">KDV Dahil Net Kâr</span>}
        </div>
    )
}
