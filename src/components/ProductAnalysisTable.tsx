'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    Package, Barcode, TrendingUp, Tag, Award,
    RefreshCcw, CheckCircle2, Trash2, Download,
    LayoutDashboard, FilePieChart, ChevronRight,
    ArrowRightCircle, Info, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateTrendyolProfit, CalculationResult, safeParsePrice } from '@/lib/calculation-utils'
import { fetchTrendyolPricesByBarcodes } from '@/lib/actions'

interface Product {
    id: string
    name: string
    barcode: string
    modelCode?: string
    image?: string
    stock: number
    cost: number
    costVatRate?: number
    shipping: number
    desi?: number
    notFound?: boolean
    targetProfitMargin?: number | null
}

interface ExcelData {
    commission: any[]
    advantage: any[]
    plus: any[]
}

// --- Helper Functions for Fuzzy Extraction ---
const getColumnValue = (row: any, prefix: string | number, suffixes: string[]) => {
    if (!row) return undefined
    for (const suffix of suffixes) {
        const key1 = `${prefix}.${suffix}`
        if (row[key1] !== undefined) return row[key1]

        const key2 = `${prefix}. ${suffix}`
        if (row[key2] !== undefined) return row[key2]

        const key3 = `${prefix} ${suffix}`
        if (row[key3] !== undefined) return row[key3]

        const key4 = `${prefix}${suffix}`
        if (row[key4] !== undefined) return row[key4]

        // Fallback: Try suffix directly (for flat files where prefix is implicit)
        if (row[suffix] !== undefined) return row[suffix]

        // Also try case-insensitive and trimmed versions if needed, but for now this covers most cases
    }
    return undefined
}

// --- Helper Components ---

const ProfitBadge = ({ dualResult, className }: {
    dualResult?: { minProfit: number, minPercent: number, maxProfit: number, maxPercent: number },
    className?: string
}) => {
    if (!dualResult) return null

    const getBadgeStyle = (percent: number) => {
        if (percent > 20) return "bg-[#5cb85c] text-white"
        if (percent >= 10) return "bg-[#f0ad4e] text-white"
        return "bg-[#d9534f] text-white"
    }

    return (
        <div className={cn("flex flex-col gap-1 w-full", className)}>
            <div className={cn("px-2 py-1 rounded-full flex items-center justify-center gap-1 shadow-sm text-[11px] font-bold", getBadgeStyle(dualResult.maxPercent))}>
                <span>Max: {dualResult.maxProfit.toFixed(2)}₺</span>
                <span className="opacity-90">({dualResult.maxPercent.toFixed(1)}%)</span>
            </div>
            <div className={cn("px-2 py-1 rounded-full flex items-center justify-center gap-1 shadow-sm text-[10px] font-bold opacity-90 scale-95", getBadgeStyle(dualResult.minPercent))}>
                <span>Min: {dualResult.minProfit.toFixed(2)}₺</span>
                <span className="opacity-90">({dualResult.minPercent.toFixed(1)}%)</span>
            </div>
        </div>
    )
}

const CampaignBlock = ({ title, children, isEmpty, className }: { title: string, children?: React.ReactNode, isEmpty?: boolean, className?: string }) => {
    return (
        <div className={cn(
            "flex flex-col gap-2 p-3 rounded-xl border border-dashed transition-all h-full min-h-[100px]",
            isEmpty ? "bg-zinc-50 border-zinc-200" : "bg-white border-zinc-100 shadow-sm",
            className
        )}>
            {title && (
                <div className="flex items-center gap-1.5 opacity-60 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{title}</span>
                    {isEmpty && <span className="text-[9px] text-zinc-300 italic">(Veri Yok)</span>}
                </div>
            )}
            {children}
        </div>
    )
}

// --- NEW: Report Modal Component ---
const ReportModal = ({ isOpen, onClose, product, baremData, advantageData, calculateProfit }: any) => {
    if (!isOpen) return null

    const pairs = [
        { label: "1 YILDIZ ÜST FİYAT", leftLabel: "1. Fiyat Alt Limit", rightLabel: "2. Fiyat Üst Limiti", leftVal: baremData[0]?.priceRange?.min, rightVal: baremData[1]?.priceRange?.max },
        { label: "1 YILDIZ ALT FİYAT", leftLabel: "2. Fiyat Üst Limiti", rightLabel: "2. Fiyat Alt Limit", leftVal: baremData[1]?.priceRange?.max, rightVal: baremData[1]?.priceRange?.min },
        { label: "2 YILDIZ ÜST FİYAT", leftLabel: "2. Fiyat Alt Limit", rightLabel: "3. Fiyat Üst Limiti", leftVal: baremData[1]?.priceRange?.min, rightVal: baremData[2]?.priceRange?.max },
        { label: "2 YILDIZ ALT FİYAT", leftLabel: "3. Fiyat Üst Limiti", rightLabel: "3. Fiyat Alt Limit", leftVal: baremData[2]?.priceRange?.max, rightVal: baremData[2]?.priceRange?.min },
        { label: "3 YILDIZ ÜST FİYAT", leftLabel: "3. Fiyat Alt Limit", rightLabel: "4. Fiyat Üst Limiti", leftVal: baremData[2]?.priceRange?.min, rightVal: baremData[3]?.priceRange?.max }
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-zinc-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <FilePieChart className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Kapsamlı Kampanya Raporu</h2>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{product.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pairs.map((pair, idx) => {
                            const lv = safeParsePrice(pair.leftVal)
                            const rv = safeParsePrice(pair.rightVal)

                            if (lv === 0 || rv === 0) return null

                            // Need a way to get commission... let's simplify for the modal or pass extra data
                            // For simplicity, we'll assume we pass a helper or use the first barem comm for now
                            // OR better: we define a calculation within the loop if we have all data
                            const leftRes = calculateProfit(lv)
                            const rightRes = calculateProfit(rv)
                            const profitDiff = rightRes.netProfit - leftRes.netProfit
                            const priceDiff = rv - lv

                            return (
                                <div key={idx} className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm border-orange-50/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all group relative overflow-hidden flex flex-col h-full">
                                    {/* Design Accent (Orange Bar) */}
                                    <div className="absolute top-6 left-0 w-1.5 h-8 bg-orange-500 rounded-r-full" />

                                    {/* Header: Label & Badge */}
                                    <div className="flex items-center justify-between mb-8 pl-4">
                                        <span className="text-xs font-black text-zinc-900 uppercase tracking-tight">{pair.label}</span>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                            profitDiff > 0 ? "bg-rose-50 text-rose-500 border border-rose-100" : "bg-emerald-50 text-emerald-500 border border-emerald-100"
                                        )}>
                                            {profitDiff > 0 ? "BAREM KAÇIRIYORSUN" : "HEM AVANTAJLI HEM KÂRLI"}
                                        </div>
                                    </div>

                                    {/* Main Body: Diffs */}
                                    <div className="space-y-4 mb-8 pl-4 pr-2">
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Limit Farkı:</span>
                                            <span className="text-2xl font-black text-zinc-900 leading-none tracking-tight">
                                                {priceDiff > 0 ? "+" : ""}{priceDiff.toFixed(2)}₺
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Kâr Değişimi:</span>
                                            <span className={cn(
                                                "text-2xl font-black leading-none tracking-tight",
                                                profitDiff > 0 ? "text-emerald-500" : "text-rose-500"
                                            )}>
                                                {profitDiff > 0 ? "+" : ""}{profitDiff.toFixed(2)}₺
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer: Individual values */}
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex justify-between items-center bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100/50">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate mr-2">{pair.leftLabel}:</span>
                                            <span className="text-xs font-black text-zinc-700 whitespace-nowrap">{lv.toFixed(2)}₺</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate mr-2">{pair.rightLabel}:</span>
                                            <span className="text-xs font-black text-emerald-700 whitespace-nowrap">{rv.toFixed(2)}₺</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-center">
                    <button onClick={onClose} className="bg-zinc-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-zinc-900/20">
                        Anladım, Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}

const AnalysisCell = ({
    price, priceRange, commission, dualResult,
    isSelected, onSelect, className
}: any) => {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer relative group/cell h-full",
                isSelected
                    ? "bg-[#fff1f0] border-orange-200 ring-2 ring-orange-500 ring-opacity-20"
                    : "bg-[#fff5f5] border-transparent hover:border-orange-200",
                className
            )}
        >
            <div className="flex items-center gap-1 text-sm font-black tracking-tight flex-wrap justify-center">
                {priceRange ? (
                    <>
                        <span className="text-zinc-900">{priceRange.min}</span>
                        <span className="text-zinc-400 font-medium">-</span>
                        <span className="text-[#ff7f50]">{priceRange.max}</span>
                    </>
                ) : (
                    <span className="text-[#ff7f50]">{price}</span>
                )}
            </div>

            <span className="text-[11px] font-medium text-zinc-600">
                Komisyon {commission}
            </span>

            <div className="mt-1 w-full">
                <ProfitBadge dualResult={dualResult} />
            </div>

            <button className={cn(
                "mt-auto w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors",
                isSelected
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-[#faeceb] text-orange-600 group-hover:bg-orange-100"
            )}>
                {isSelected ? 'Seçildi' : 'Tüm Varyantlarını Seç'}
            </button>
        </div>
    )
}

const ProductWideCard = ({ product, onSelect, selection, excelData, trendyolPrice, scenario, manualCams }: {
    product: Product,
    onSelect: (type: 'barem' | 'advantage' | 'plus', index: number) => void,
    selection?: { type: string, index: number },
    excelData?: ExcelData,
    trendyolPrice?: number,
    scenario: string,
    manualCams: string[]
}) => {
    const [manualPrice, setManualPrice] = useState('')
    const [manualResult, setManualResult] = useState<CalculationResult | null>(null)
    const [isReportOpen, setIsReportOpen] = useState(false)

    // Data Bridge
    const commRow = excelData?.commission?.find(r => String(r.Barkod || r.BARKOD) === product.barcode)
    const advRow = excelData?.advantage?.find(r => String(r.Barkod || r.BARKOD) === product.barcode)
    const plusRow = excelData?.plus?.find(r => String(r.Barkod || r.BARKOD) === product.barcode)

    const handleCalculate = () => {
        const priceNum = safeParsePrice(manualPrice)
        if (isNaN(priceNum) || priceNum === 0) return
        const result = calculateTrendyolProfit(priceNum, product.cost, product.shipping, 18.5, product.costVatRate || 10)
        setManualResult(result)
    }

    const parsePriceRange = (priceStr: any): { min: number, max: number } | null => {
        if (!priceStr) return null
        const raw = String(priceStr)
        if (raw.includes('-')) {
            const parts = raw.split('-').map(p => safeParsePrice(p.trim()))
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return { min: parts[0], max: parts[1] }
        }
        const num = safeParsePrice(raw)
        return isNaN(num) ? null : { min: num, max: num }
    }

    // --- HELPER: APPLY SCENARIOS ---
    const getEffectiveValues = (price: number, shipping: number) => {
        let ep = price
        let es = shipping

        // 1. Preset Scenario
        if (scenario === 'discount10') ep *= 0.90
        else if (scenario === 'discount20') ep *= 0.80
        else if (scenario === 'coupon50') ep = Math.max(ep - 50, 0)
        else if (scenario === 'freeshipping') es = 0

        // 2. Manual Campaigns
        manualCams.forEach(cam => {
            if (!cam) return
            const clean = cam.replace(/\s/g, '').replace(',', '.')
            if (clean.includes('%')) {
                const percent = parseFloat(clean.replace('%', ''))
                if (!isNaN(percent)) ep *= (1 - percent / 100)
            } else {
                const amount = parseFloat(clean.replace('₺', ''))
                if (!isNaN(amount)) ep = Math.max(ep - amount, 0)
            }
        })
        return { ep, es }
    }

    // --- BAREM DATA ---
    const baremData = useMemo(() => {
        if (!commRow || product.notFound) return []
        const scenarios = []
        for (let i = 1; i <= 4; i++) {
            const minVal = getColumnValue(commRow, i, ['Fiyat Alt Limit', 'Fiyat Alt Limiti', 'Alt Limit', 'Alt Limiti', 'Barem Alt Limit'])
            let maxVal = getColumnValue(commRow, i, ['Fiyat Üst Limit', 'Fiyat Üst Limiti', 'Üst Limit', 'Üst Limiti', 'Barem Üst Limit'])

            // For 1st barem only: use Trendyol API price as upper limit if available
            if (i === 1 && trendyolPrice && trendyolPrice > 0) {
                maxVal = trendyolPrice
            }

            const comm = getColumnValue(commRow, i, ['KOMİSYON', 'Komisyon', 'Komisyon Oranı', 'Oran']) || 21.5

            if (minVal !== undefined || maxVal !== undefined) {
                const minPrice = safeParsePrice(minVal)
                const maxPrice = safeParsePrice(maxVal)

                const calcPriceMin = minPrice
                const calcPriceMax = maxPrice > 0 ? maxPrice : 999999

                const effMin = getEffectiveValues(calcPriceMin, product.shipping)
                const effMax = getEffectiveValues(calcPriceMax, product.shipping)

                const minRes = calculateTrendyolProfit(effMin.ep, product.cost, effMin.es, Number(comm), product.costVatRate || 10)
                const maxRes = calculateTrendyolProfit(effMax.ep, product.cost, effMax.es, Number(comm), product.costVatRate || 10)

                const priceLabelMin = minPrice > 0 ? `₺${minPrice.toFixed(2)}` : ''
                const priceLabelMax = maxPrice > 0 && maxPrice < 999999 ? `₺${maxPrice.toFixed(2)}` : ''

                scenarios.push({
                    price: `${priceLabelMin} - ${priceLabelMax}`,
                    priceRange: (priceLabelMin || priceLabelMax) ? { min: priceLabelMin || '---', max: priceLabelMax || '---' } : undefined,
                    commission: String(comm),
                    dualResult: { minProfit: minRes.netProfit, minPercent: minRes.margin, maxProfit: maxRes.netProfit, maxPercent: maxRes.margin }
                })
                continue
            }

            const priceVal = getColumnValue(commRow, i, ['Fiyat Aralığı', 'Barem Fiyat', 'Fiyat'])
            if (priceVal) {
                const range = parsePriceRange(priceVal)
                if (range) {
                    const effMin = getEffectiveValues(range.min, product.shipping)
                    const effMax = getEffectiveValues(range.max, product.shipping)
                    const minRes = calculateTrendyolProfit(effMin.ep, product.cost, effMin.es, Number(comm), product.costVatRate || 10)
                    const maxRes = calculateTrendyolProfit(effMax.ep, product.cost, effMax.es, Number(comm), product.costVatRate || 10)
                    scenarios.push({
                        price: `₺${range.min} - ₺${range.max}`,
                        priceRange: { min: `₺${range.min}`, max: `₺${range.max}` },
                        commission: String(comm),
                        dualResult: { minProfit: minRes.netProfit, minPercent: minRes.margin, maxProfit: maxRes.netProfit, maxPercent: maxRes.margin }
                    })
                }
            }
        }
        return scenarios
    }, [commRow, product, trendyolPrice])

    // --- DYNAMIC COMMISSION SEARCH ---
    const getCommissionForPrice = (price: number) => {
        if (!baremData || baremData.length === 0) return 21.5
        for (const item of baremData) {
            if (!item.priceRange) continue
            const min = safeParsePrice(item.priceRange.min)
            let max = safeParsePrice(item.priceRange.max)
            if (max === 0 || isNaN(max)) max = 999999 // Infinity

            if (price >= min && price <= max) {
                return safeParsePrice(item.commission)
            }
        }
        return safeParsePrice(baremData[0].commission) || 21.5
    }

    // --- ADVANTAGE DATA ---
    const advantageData = useMemo(() => {
        if (!advRow || product.notFound) return []

        if (advRow) {
            const grayFormatTiers = [
                { label: 'Avantajlı', prefix: '1 YILDIZ' },
                { label: 'Çok Avantajlı', prefix: '2 YILDIZ' },
                { label: 'Süper Avantajlı', prefix: '3 YILDIZ' }
            ]
            return grayFormatTiers.map(tier => {
                const minVal = getColumnValue(advRow, tier.prefix, ['ALT FİYAT', 'Alt Fiyat', 'Min', 'Alt Limiti'])
                const maxVal = getColumnValue(advRow, tier.prefix, ['ÜST FİYAT', 'Üst Fiyat', 'Max', 'Üst Limiti'])

                const validMin = safeParsePrice(minVal)
                const validMax = safeParsePrice(maxVal)

                const effMin = getEffectiveValues(validMin, product.shipping)
                const effMax = getEffectiveValues(validMax, product.shipping)

                // User Request: Dynamic commission based on price
                const commRateMin = getCommissionForPrice(validMin)
                const commRateMax = getCommissionForPrice(validMax)

                // For the UI and card summary, we use the commission of the max price (Upper Limit)
                const commRate = commRateMax

                const minRes = calculateTrendyolProfit(effMin.ep, product.cost, effMin.es, commRateMin, product.costVatRate || 10)
                const maxRes = calculateTrendyolProfit(effMax.ep, product.cost, effMax.es, commRateMax, product.costVatRate || 10)

                return {
                    price: `₺${validMin.toFixed(2)} - ₺${validMax.toFixed(2)}`,
                    priceRange: { min: validMin > 0 ? `₺${validMin.toFixed(2)}` : '---', max: validMax > 0 ? `₺${validMax.toFixed(2)}` : '---' },
                    commission: String(commRate),
                    label: tier.label,
                    dualResult: { minProfit: minRes.netProfit, minPercent: minRes.margin, maxProfit: maxRes.netProfit, maxPercent: maxRes.margin }
                }
            })
        }
        return []
    }, [advRow, product, baremData])

    const plusData = useMemo(() => {
        if (!plusRow || product.notFound) return []
        const grayPrice = getColumnValue(plusRow, 'Plus', [
            'Fiyat Üst Limiti',
            'Fiyat Üst Limit',
            'Komisyona Esas Fiyat',
            'Fiyat',
            'Satış Fiyatı',
            'Plus Fiyat',
            'Fiyat (KDV Dahil)'
        ])
        const grayComm = getColumnValue(plusRow, 'Plus', [
            'Plus Komisyon Oranı (%)',
            'Önerilen Komisyon Oranı (%)',
            'Komisyon Teklifi',
            'Komisyon',
            'Komisyon Oranı',
            'Plus Komisyon'
        ])
        const commRate = safeParsePrice(grayComm) || 11.9
        const priceNum = safeParsePrice(grayPrice)
        const eff = getEffectiveValues(priceNum, product.shipping)
        const res = calculateTrendyolProfit(eff.ep, product.cost, eff.es, commRate, product.costVatRate || 10)
        return [{
            price: `₺${priceNum.toFixed(2)}`,
            commission: String(commRate),
            dualResult: { minProfit: res.netProfit, minPercent: res.margin, maxProfit: res.netProfit, maxPercent: res.margin },
            label: 'Plus'
        }]
    }, [plusRow, product])

    // --- SCENARIO CALCULATION ---
    const effectivePriceInfo = useMemo(() => {
        const basePrice = trendyolPrice || 0
        const { ep, es } = getEffectiveValues(basePrice, product.shipping)
        const baseCommRaw = commRow ? getColumnValue(commRow, 1, ['KOMİSYON', 'Komisyon', 'Komisyon Oranı', 'Oran']) : null
        const baseComm = safeParsePrice(baseCommRaw) || 21.5

        const result = calculateTrendyolProfit(
            ep,
            product.cost,
            es,
            baseComm,
            product.costVatRate || 10
        )

        const targetMargin = product.targetProfitMargin ?? 0.15
        const isPassing = (result.margin / 100) >= targetMargin

        // Color Logic: 🟢 %20+ (margin > 20), 🟡 %10-20, 🔴 %0-10, ⚫ <0
        const getStatusColor = (margin: number) => {
            if (margin < 0) return 'zinc' // Black/Dark
            if (margin < 10) return 'rose' // Red
            if (margin < 20) return 'amber' // Yellow
            return 'emerald' // Green
        }

        return {
            effectivePrice: ep,
            effectiveShipping: es,
            result,
            isPassing,
            targetMargin,
            statusColor: getStatusColor(result.margin)
        }
    }, [scenario, trendyolPrice, product, commRow, manualCams])

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg shadow-zinc-200/20 overflow-hidden hover:border-orange-200/50 transition-all duration-300 flex flex-col md:flex-row group min-h-[180px]">
            {/* Left Side: Product Info */}
            <div className="w-full md:w-[280px] bg-zinc-50 p-5 flex flex-col gap-4 border-r border-zinc-100 shrink-0">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white border border-zinc-200 p-1 shrink-0">
                        {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                            <Package className="w-full h-full text-zinc-200 p-3" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-sm text-zinc-900 leading-tight line-clamp-2 mb-1" title={product.name}>
                            {product.name}
                        </h3>
                        <span className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded font-mono text-zinc-500">
                            {product.barcode}
                        </span>
                    </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                    <div className="bg-white px-3 py-2 rounded-lg border border-zinc-200">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Stok</span>
                        <span className={cn("block text-xs font-black", product.stock > 0 ? "text-emerald-600" : "text-rose-600")}>
                            {product.stock} Adet
                        </span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg border border-zinc-200">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Maliyet</span>
                        <span className="block text-xs font-black text-zinc-900">{product.cost}₺</span>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={cn(
                    "mt-auto p-3 rounded-xl border flex flex-col gap-1.5",
                    effectivePriceInfo.statusColor === 'emerald' ? "bg-emerald-50 border-emerald-100" :
                        effectivePriceInfo.statusColor === 'amber' ? "bg-amber-50 border-amber-100" :
                            effectivePriceInfo.statusColor === 'rose' ? "bg-rose-50 border-rose-100" :
                                "bg-zinc-100 border-zinc-200"
                )}>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Durum</span>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            effectivePriceInfo.statusColor === 'emerald' ? "bg-emerald-500" :
                                effectivePriceInfo.statusColor === 'amber' ? "bg-amber-500" :
                                    effectivePriceInfo.statusColor === 'rose' ? "bg-rose-500" :
                                        "bg-zinc-900"
                        )} />
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className={cn(
                            "text-lg font-black tracking-tighter",
                            effectivePriceInfo.statusColor === 'emerald' ? "text-emerald-700" :
                                effectivePriceInfo.statusColor === 'amber' ? "text-amber-700" :
                                    effectivePriceInfo.statusColor === 'rose' ? "text-rose-700" :
                                        "text-zinc-900"
                        )}>
                            %{effectivePriceInfo.result.margin.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">Kâr Marjı</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-black/5">
                        <span className="text-[9px] font-bold text-zinc-500">Hedef: %{(effectivePriceInfo.targetMargin * 100).toFixed(1)}</span>
                        {effectivePriceInfo.isPassing ? (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">HEDEF GEÇİLDİ</span>
                        ) : (
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">HEDEF ALTI</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side: Data Grid */}
            <div className="flex-1 p-5 bg-white flex flex-col gap-4">
                {/* Scenario Result Header */}
                <div className="flex items-center justify-between bg-zinc-50/80 p-4 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-6">
                        <div>
                            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Efektif Satış Fiyatı</span>
                            <span className="text-xl font-black text-zinc-900 tracking-tighter">
                                {effectivePriceInfo.effectivePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}₺
                                {scenario !== 'normal' && <span className="text-xs font-bold text-orange-500 ml-2">(Senaryo)</span>}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-zinc-200" />
                        <div>
                            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Net Kâr</span>
                            <span className={cn(
                                "text-xl font-black tracking-tighter",
                                effectivePriceInfo.result.netProfit > 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {effectivePriceInfo.result.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}₺
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Kargo</span>
                        <span className="text-sm font-bold text-zinc-600">
                            {effectivePriceInfo.effectiveShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}₺
                        </span>
                    </div>
                </div>

                <div className="col-span-12 h-full flex flex-col gap-4">
                    {/* OPPORTUNITY TRACKER - Moved to Top for visibility */}
                    {advantageData.length > 0 && (
                        <div className="bg-orange-50/30 border border-orange-100/50 p-4 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Kampanya Fırsat Analizi</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {advantageData.map((item, i) => {
                                    // Mapping logic based on user request:
                                    // Avantajlı (i=0) -> Barem 1 Alt
                                    // Çok Avantajlı (i=1) -> Barem 2 Alt
                                    // Süper Avantajlı (i=2) -> Barem 4 Üst

                                    let targetBaremIndex = 0
                                    let useMinLimit = true // Alt Limit default

                                    if (i === 1) { // Çok Avantajlı
                                        targetBaremIndex = 1 // Barem 2
                                        useMinLimit = true
                                    } else if (i === 2) { // Süper Avantajlı
                                        targetBaremIndex = 3 // Barem 4
                                        useMinLimit = false // Üst Limit
                                    }

                                    const targetBarem = baremData[targetBaremIndex]
                                    if (!targetBarem) return null

                                    const refLimit = useMinLimit
                                        ? safeParsePrice(targetBarem.priceRange?.min || '0')
                                        : safeParsePrice(targetBarem.priceRange?.max || '0')

                                    // User Request: Use dynamic commission based on price even for tracker
                                    const refComm = getCommissionForPrice(refLimit)
                                    const advLimit = safeParsePrice(item.priceRange?.max || '0')
                                    const advComm = getCommissionForPrice(advLimit)

                                    const diff = refLimit - advLimit

                                    // Profit at Reference Barem Limit
                                    const refVal = getEffectiveValues(refLimit, product.shipping)
                                    const refRes = calculateTrendyolProfit(refVal.ep, product.cost, refVal.es, refComm, product.costVatRate || 10)

                                    // Profit at Advantage Label Limit
                                    const targetVal = getEffectiveValues(advLimit, product.shipping)
                                    const targetRes = calculateTrendyolProfit(targetVal.ep, product.cost, targetVal.es, advComm, product.costVatRate || 10)

                                    const profitChange = targetRes.netProfit - refRes.netProfit
                                    const isLosing = refLimit > advLimit

                                    return (
                                        <div key={i} className="flex flex-col gap-1 bg-white border border-orange-100 p-3 rounded-xl min-w-[210px] shadow-sm shadow-orange-500/5 relative overflow-hidden">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">{item.label}</span>
                                                <div className={cn(
                                                    "px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter",
                                                    isLosing ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                                )}>
                                                    {isLosing ? `BAREM ${targetBaremIndex + 1} DE KAÇIRIYORSUN` : 'Kazanıyorsun'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5 my-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[9px] font-bold text-zinc-500">Limit Farkı:</span>
                                                    <span className="text-xs font-black text-zinc-900">-{diff.toFixed(2)}₺</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[9px] font-bold text-zinc-500">Kâr Değişimi:</span>
                                                    <span className={cn("text-xs font-black", profitChange < 0 ? "text-rose-500" : "text-emerald-600")}>
                                                        {profitChange >= 0 ? `+${profitChange.toFixed(2)}₺` : `${profitChange.toFixed(2)}₺`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-[8px] font-bold text-zinc-400 leading-tight border-t border-zinc-50 pt-1 mt-1 flex flex-col gap-1">
                                                <div className="flex justify-between items-center bg-zinc-50/50 p-1 rounded">
                                                    <span>Barem {targetBaremIndex + 1} ({useMinLimit ? 'Alt' : 'Üst'}):</span>
                                                    <span className="text-zinc-700 font-black">{refRes.netProfit.toFixed(2)}₺</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-emerald-50/50 p-1 rounded">
                                                    <span>{item.label} (Üst):</span>
                                                    <span className="text-emerald-700 font-black">{targetRes.netProfit.toFixed(2)}₺</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* BAREM ROW */}
                    {commRow && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {baremData.map((item, i) => (
                                <AnalysisCell
                                    key={i} {...item}
                                    isSelected={selection?.type === 'barem' && selection?.index === i}
                                    onSelect={() => onSelect('barem', i)}
                                />
                            ))}
                        </div>
                    )}

                    {/* ADVANCED / PLUS / MANUAL ROW */}
                    <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4">
                        {/* Advantage Section */}
                        <div className="col-span-1 flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Avantajlı Etiketler</span>
                            {advantageData.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {advantageData.map((item, i) => (
                                        <div key={i} onClick={() => onSelect('advantage', i)} className={cn("group flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer relative", selection?.type === 'advantage' && selection?.index === i ? "border-orange-500 bg-orange-50/50 shadow-sm shadow-orange-500/10" : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm")}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">{item.label}</span>
                                                    <span className="text-[10px] font-black text-zinc-500 tracking-tight mt-0.5">
                                                        {item.priceRange?.min} - {item.priceRange?.max}
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-900 text-white px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                    %{item.commission}
                                                </div>
                                            </div>

                                            {item.dualResult && (
                                                <div className="grid grid-cols-2 gap-1.5 mt-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest pl-0.5">Min Kâr</span>
                                                        <div className={cn("px-2 py-1 rounded-lg text-[10px] font-black text-white text-center shadow-sm", item.dualResult.minPercent > 10 ? "bg-amber-500" : "bg-rose-500")}>
                                                            {item.dualResult.minProfit.toFixed(2)}₺
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest pl-0.5">Max Kâr</span>
                                                        <div className={cn("px-2 py-1 rounded-lg text-[10px] font-black text-white text-center shadow-sm", item.dualResult.maxPercent > 10 ? "bg-emerald-500" : "bg-rose-500")}>
                                                            {item.dualResult.maxProfit.toFixed(2)}₺
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-zinc-300 text-[10px] italic">Veri Yok</div>}
                        </div>

                        {/* Plus Section */}
                        <div className="col-span-1 flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Trendyol Plus</span>
                            {plusData.map((item, i) => (
                                <AnalysisCell
                                    key={i} {...item}
                                    isSelected={selection?.type === 'plus' && selection?.index === i}
                                    onSelect={() => onSelect('plus', i)}
                                    className="h-auto"
                                />
                            ))}
                        </div>

                        {/* Manual Section */}
                        <div className="col-span-1 flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Manuel Hesaplama</span>
                            <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        value={manualPrice} onChange={e => setManualPrice(e.target.value)}
                                        placeholder="Fiyat..."
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 ring-orange-100 outline-none"
                                    />
                                    <button onClick={handleCalculate} className="bg-zinc-900 text-white px-3 rounded-lg text-[10px] font-black uppercase hover:bg-black">
                                        HESAPLA
                                    </button>
                                </div>
                                {manualResult && (
                                    <div className={cn("text-center py-2 rounded-lg text-[10px] font-bold text-white", manualResult.netProfit > 0 ? "bg-emerald-500" : "bg-rose-500")}>
                                        {manualResult.netProfit.toFixed(2)}₺ (%{manualResult.margin.toFixed(2)})
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsReportOpen(true)}
                                    className="w-full py-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    <FilePieChart className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                    Kampanya Raporu
                                </button>
                            </div>
                        </div>

                        {/* Report Modal */}
                        <ReportModal
                            isOpen={isReportOpen}
                            onClose={() => setIsReportOpen(false)}
                            product={product}
                            baremData={baremData}
                            advantageData={advantageData}
                            calculateProfit={(price: number) => {
                                const comm = getCommissionForPrice(price)
                                const eff = getEffectiveValues(price, product.shipping)
                                return calculateTrendyolProfit(eff.ep, product.cost, eff.es, comm, product.costVatRate || 10)
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ProductAnalysisTable({ products = [], excelData }: { products?: Product[], excelData?: ExcelData }) {
    const [page, setPage] = useState(1)
    const itemsPerPage = 8
    const [trendyolPrices, setTrendyolPrices] = useState<Record<string, number>>({})
    const [loadingPrices, setLoadingPrices] = useState(false)
    const [scenario, setScenario] = useState('normal')
    const [manualCam1, setManualCam1] = useState('')
    const [manualCam2, setManualCam2] = useState('')
    const [lastUpdated] = useState(new Date())

    // --- PERSISTENCE: LOAD FROM LOCALSTORAGE ---
    useEffect(() => {
        const savedScenario = localStorage.getItem('campaign_scenario')
        const savedCam1 = localStorage.getItem('campaign_manualCam1')
        const savedCam2 = localStorage.getItem('campaign_manualCam2')

        if (savedScenario) setScenario(savedScenario)
        if (savedCam1) setManualCam1(savedCam1)
        if (savedCam2) setManualCam2(savedCam2)
    }, [])

    // --- PERSISTENCE: SAVE TO LOCALSTORAGE ---
    useEffect(() => {
        localStorage.setItem('campaign_scenario', scenario)
    }, [scenario])

    useEffect(() => {
        localStorage.setItem('campaign_manualCam1', manualCam1)
    }, [manualCam1])

    useEffect(() => {
        localStorage.setItem('campaign_manualCam2', manualCam2)
    }, [manualCam2])

    // Data Bridge
    const allAnalyticProducts = useMemo(() => {
        const barcodesInExcel = new Set([
            ...(excelData?.commission?.map(r => String(r.Barkod || r.BARKOD)) || []),
            ...(excelData?.advantage?.map(r => String(r.Barkod || r.BARKOD)) || []),
            ...(excelData?.plus?.map(r => String(r.Barkod || r.BARKOD)) || [])
        ].filter(Boolean))

        if (barcodesInExcel.size === 0) return products
        const productMap = new Map(products.map(p => [p.barcode, p]))
        const combined = Array.from(barcodesInExcel).map(bc => {
            const existing = productMap.get(bc!)
            if (existing) return existing
            return {
                id: `ghost-${bc}`, name: 'Ürün Ayarları Bulunamadı', barcode: bc!,
                stock: 0, cost: 0, costVatRate: 10, shipping: 93.05, desi: 0, notFound: true
            } as Product
        })
        const excelBarcodeSet = new Set(barcodesInExcel)
        const others = products.filter(p => !excelBarcodeSet.has(p.barcode))
        return [...combined, ...others]
    }, [products, excelData])

    // Fetch Trendyol prices for all products
    useEffect(() => {
        const fetchPrices = async () => {
            if (allAnalyticProducts.length === 0) return

            setLoadingPrices(true)
            const barcodes = allAnalyticProducts.map(p => p.barcode).filter(Boolean)

            try {
                const result = await fetchTrendyolPricesByBarcodes(barcodes)
                if (result.success && result.prices) {
                    setTrendyolPrices(result.prices)
                }
            } catch (error) {
                console.error('Error fetching Trendyol prices:', error)
            } finally {
                setLoadingPrices(false)
            }
        }

        fetchPrices()
    }, [allAnalyticProducts])

    const [selectedParticipations, setSelectedParticipations] = useState<Record<string, { type: 'barem' | 'advantage' | 'plus', index: number, price: string, commission: string }>>({})

    const paginatedProducts = useMemo(() => {
        return allAnalyticProducts.slice(0, page * itemsPerPage)
    }, [allAnalyticProducts, page, itemsPerPage])

    const handleSelect = (barcode: string, type: 'barem' | 'advantage' | 'plus', index: number) => {
        setSelectedParticipations(prev => {
            const current = prev[barcode]
            if (current?.type === type && current?.index === index) {
                const { [barcode]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [barcode]: { type, index, price: 'Seçildi', commission: '' } }
        })
    }
    const clearSelection = () => setSelectedParticipations({})
    const selectionCount = Object.keys(selectedParticipations).length

    return (
        <div className="space-y-6 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Detaylı Komisyon Analizi</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-zinc-500 font-medium">{allAnalyticProducts.length} Ürün Listeleniyor</p>
                            <span className="text-[10px] text-zinc-300">•</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">🕒 Sayfa Yüklendi:</span>
                                <span className="text-[10px] text-zinc-500 font-black">
                                    {lastUpdated.toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm flex-wrap md:flex-nowrap">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 shrink-0">Kampanya:</span>
                    <select
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        className="bg-zinc-50 border-none rounded-xl px-4 py-2.5 text-xs font-black text-zinc-700 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                    >
                        <option value="normal">Normal Satış</option>
                        <option value="discount10">%10 İndirim</option>
                        <option value="discount20">%20 İndirim</option>
                        <option value="coupon50">50₺ Kupon</option>
                        <option value="freeshipping">Ücretsiz Kargo</option>
                    </select>

                    <div className="w-px h-8 bg-zinc-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                placeholder="Man. Kampanya 1 (% veya ₺)"
                                value={manualCam1}
                                onChange={(e) => setManualCam1(e.target.value)}
                                className="w-full bg-zinc-50 border-zinc-100 border rounded-xl px-3 py-2.5 text-[11px] font-black text-zinc-700 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 pointer-events-none uppercase text-[8px] font-black">
                                <span>M1</span>
                            </div>
                        </div>
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                placeholder="Man. Kampanya 2 (% veya ₺)"
                                value={manualCam2}
                                onChange={(e) => setManualCam2(e.target.value)}
                                className="w-full bg-zinc-50 border-zinc-100 border rounded-xl px-3 py-2.5 text-[11px] font-black text-zinc-700 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 pointer-events-none uppercase text-[8px] font-black">
                                <span>M2</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {paginatedProducts.map(product => (
                    <ProductWideCard
                        key={product.barcode}
                        product={product}
                        onSelect={(type, index) => handleSelect(product.barcode, type, index)}
                        selection={selectedParticipations[product.barcode]}
                        excelData={excelData}
                        trendyolPrice={trendyolPrices[product.barcode]}
                        scenario={scenario}
                        manualCams={[manualCam1, manualCam2]}
                    />
                ))}
            </div>

            {products.length > paginatedProducts.length && (
                <div className="flex justify-center pt-6">
                    <button onClick={() => setPage(p => p + 1)} className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all active:scale-95">
                        <RefreshCcw className="w-3.5 h-3.5" /> Daha Fazla Göster
                    </button>
                </div>
            )}

            {selectionCount > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-[2rem] px-6 py-4 shadow-2xl shadow-black/50 flex items-center gap-8 min-w-[400px]">
                        <div className="flex items-center gap-4 border-r border-zinc-800 pr-8">
                            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white text-[13px] font-black tracking-tight">{selectionCount} Ürün Seçildi</span>
                                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Excel Hazırlanıyor</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={clearSelection} className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                                <Trash2 className="w-3.5 h-3.5" /> Temizle
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-orange-500 hover:text-white transition-all transform active:scale-95 group shadow-xl">
                                <Download className="w-4 h-4" /> İndir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
