'use client'

import { useState, useEffect } from 'react'
import {
    ShoppingBag,
    Percent,
    Truck,
    ChevronDown,
    HelpCircle,
    Zap,
    Wallet,
    Box,
    Minus,
    Star,
    ChevronRight,
    RotateCcw,
    Calculator,
    Package
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Move sub-components and helpers outside to avoid re-creation on every render
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
}

const Toggle = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative" onClick={onClick}>
            <div className={cn(
                "w-10 h-5 rounded-full transition-all duration-300 flex items-center px-1",
                active ? "bg-zinc-900" : "bg-zinc-200"
            )}>
                <div className={cn(
                    "w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
                    active ? "translate-x-5" : "translate-x-0"
                )} />
            </div>
        </div>
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
    </label>
)

export default function ProfitCalculator() {
    // Toggles
    const [isMicroExport, setIsMicroExport] = useState(false)
    const [isShippedToday, setIsShippedToday] = useState(false)

    // Inputs
    const [cost, setCost] = useState<number>(0)
    const [profitMode, setProfitMode] = useState<'amount' | 'rate'>('amount')
    const [targetProfit, setTargetProfit] = useState<number>(0)
    const [shipping, setShipping] = useState<number>(0)
    const [category, setCategory] = useState('')
    const [commission, setCommission] = useState<number>(0)

    // Results Breakdown
    const [breakdown, setBreakdown] = useState({
        salePrice: 0,
        costVat: 0,
        shippingVat: 0,
        commissionVat: 0,
        saleVat: 0,
        netVat: 0,
        commissionAmount: 0,
        serviceFeeAmount: 0,
        intlServiceFeeAmount: 0,
        serviceFeeVat: 0,
        intlServiceFeeVat: 0,
        stopajAmount: 0,
        netProfit: 0,
        roi: 0,
        margin: 0
    })
    const [isCalculated, setIsCalculated] = useState(false)

    const handleCalculate = () => {
        const commRatio = commission / 100

        // Fixed VAT Rates as per user request
        const saleVatVal = 0.10
        const saleVatFactor = 1 + saleVatVal

        const costVatVal = 0.10
        const costVatFactor = 1 + costVatVal

        const shippingVatVal = 0.20
        const shippingVatFactor = 1 + shippingVatVal

        const commVatVal = 0.20
        const commVatFactor = 1 + commVatVal

        // Service Fees (Marketplace fees usually include 20% VAT)
        const platformServiceFeeVal = 10.19
        const intlServiceFeeVal = isMicroExport ? 47.71 : 0
        const feeVatVal = 0.20
        const feeVatFactor = 1 + feeVatVal

        // Excluded Values
        const costExcl = cost / costVatFactor
        const shippingExcl = shipping / shippingVatFactor
        const platformFeeExcl = platformServiceFeeVal / feeVatFactor
        const intlFeeExcl = intlServiceFeeVal / feeVatFactor

        let calculatedPriceIncl = 0
        // PriceIncl = (PriceExcl * SaleVatFactor)
        // Profit = PriceExcl - CostExcl - ShippingExcl - (PriceExcl * CommRatio / CommVatFactor?? No) 
        // Note: Marketplace commission is calculated on INCLUSIVE price but is a cost for us.
        // CommissionAmount = PriceIncl * CommRatio
        // CommExcl = CommissionAmount / CommVatFactor

        const stopajRatio = 0.01 // 1% Stopaj

        if (profitMode === 'amount') {
            // Formula: SaleExcl - CostExcl - ShippingExcl - (SaleExcl * SaleVatFactor * CommRatio / CommVatFactor) - FeesExcl - (SaleExcl * StopajRatio) = TargetProfit
            // SaleExcl * (1 - (SaleVatFactor * CommRatio / CommVatFactor) - StopajRatio) = TargetProfit + CostExcl + ShippingExcl + FeesExcl
            const denominator = 1 - (saleVatFactor * commRatio / commVatFactor) - stopajRatio
            const numerator = targetProfit + costExcl + shippingExcl + platformFeeExcl + intlFeeExcl
            const saleExcl = denominator > 0 ? numerator / denominator : 0
            calculatedPriceIncl = saleExcl * saleVatFactor
        } else {
            // Formula: SaleExcl * (1 - (SaleVatFactor * CommRatio / CommVatFactor) - StopajRatio - ProfitRatio) = CostExcl + ShippingExcl + FeesExcl
            const profitRatio = targetProfit / 100
            const denominator = 1 - (saleVatFactor * commRatio / commVatFactor) - stopajRatio - profitRatio
            const numerator = costExcl + shippingExcl + platformFeeExcl + intlFeeExcl
            const saleExcl = denominator > 0 ? numerator / denominator : 0
            calculatedPriceIncl = saleExcl * saleVatFactor
        }

        const saleExcl = calculatedPriceIncl / saleVatFactor
        const stopajAmount = saleExcl * stopajRatio
        const commAmount = calculatedPriceIncl * commRatio
        const commExcl = commAmount / commVatFactor

        const netProfit = saleExcl - costExcl - shippingExcl - commExcl - platformFeeExcl - intlFeeExcl - stopajAmount

        // VAT Components
        const saleVat = calculatedPriceIncl - saleExcl
        const costVat = cost - costExcl
        const shippingVat = shipping - shippingExcl
        const commVat = commAmount - commExcl
        const platformFeeVat = platformServiceFeeVal - platformFeeExcl
        const intlFeeVat = intlServiceFeeVal - intlFeeExcl
        const netVat = saleVat - (costVat + shippingVat + commVat + platformFeeVat + intlFeeVat)

        setBreakdown({
            salePrice: calculatedPriceIncl,
            costVat,
            shippingVat,
            commissionVat: commVat,
            serviceFeeVat: platformFeeVat,
            intlServiceFeeVat: intlFeeVat,
            saleVat,
            netVat,
            commissionAmount: commAmount,
            serviceFeeAmount: platformServiceFeeVal,
            intlServiceFeeAmount: intlServiceFeeVal,
            stopajAmount,
            netProfit,
            roi: costExcl > 0 ? (netProfit / costExcl) * 100 : 0,
            margin: saleExcl > 0 ? (netProfit / saleExcl) * 100 : 0
        })
        setIsCalculated(true)
    }

    // Reset status when inputs change
    useEffect(() => {
        setIsCalculated(false)
    }, [cost, targetProfit, profitMode, commission, shipping, isMicroExport])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Column 1: Seçimler/Maliyet & KDV */}
            <div className="space-y-8">
                {/* Seçimler & Ürün Maliyeti Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-50 shadow-sm space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-zinc-900">Seçimler</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <Toggle
                                active={isMicroExport}
                                onClick={() => setIsMicroExport(!isMicroExport)}
                                label="Mikro ihracat"
                            />
                            <Toggle
                                active={isShippedToday}
                                onClick={() => setIsShippedToday(!isShippedToday)}
                                label="Bugün kargoda"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-zinc-900">Ürün Maliyeti</h3>
                            <HelpCircle className="w-5 h-5 text-sky-400 opacity-60" />
                        </div>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Box className="w-4 h-4 text-zinc-400" />
                            </div>
                            <input
                                type="number"
                                value={cost || ''}
                                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                                placeholder="0 ₺"
                                className="w-full pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-lg font-bold text-zinc-900 focus:outline-none focus:border-zinc-200 transition-all placeholder:text-zinc-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Kargo Ücreti Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-50 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900">Kargo Ücreti</h3>
                        <HelpCircle className="w-5 h-5 text-sky-400 opacity-60" />
                    </div>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Truck className="w-4 h-4 text-zinc-400" />
                        </div>
                        <input
                            type="number"
                            value={shipping || ''}
                            onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                            placeholder="0 ₺"
                            className="w-full pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-lg font-bold text-zinc-900 focus:outline-none focus:border-zinc-200 transition-all placeholder:text-zinc-400"
                        />
                    </div>
                </div>
            </div>

            {/* Column 2: İstenilen Kâr & Kategori */}
            <div className="space-y-8">
                {/* İstenilen Kâr Oranı / Tutarı Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-50 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900">İstenilen Kâr Oranı / Tutarı</h3>
                        <HelpCircle className="w-5 h-5 text-sky-400 opacity-60" />
                    </div>
                    <div className="relative group">
                        <select
                            value={profitMode}
                            onChange={(e) => setProfitMode(e.target.value as any)}
                            className="w-full pl-6 pr-12 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-900 appearance-none focus:outline-none transition-all"
                        >
                            <option value="amount">Tutara Göre (₺)</option>
                            <option value="rate">Orana Göre (%)</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Wallet className="w-4 h-4 text-zinc-400" />
                        </div>
                        <input
                            type="number"
                            value={targetProfit || ''}
                            onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                            placeholder="0 ₺"
                            className="w-full pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-lg font-bold text-zinc-900 focus:outline-none focus:border-zinc-200 transition-all placeholder:text-zinc-400"
                        />
                    </div>
                </div>

                {/* Kategori Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-50 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900">Kategori</h3>
                        <HelpCircle className="w-5 h-5 text-sky-400 opacity-60" />
                    </div>
                    <div className="relative group">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full pl-6 pr-12 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-900 appearance-none focus:outline-none transition-all"
                        >
                            <option value="">Kategori Seçin</option>
                            <option value="moda">Giyim & Moda</option>
                            <option value="elektronik">Elektronik</option>
                            <option value="kozmetik">Kozmetik</option>
                            <option value="ev">Ev & Yaşam</option>
                            <option value="diger">Diğer</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight pl-1">Kategori Komisyonu (%)</span>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Percent className="w-3 h-3 text-zinc-300" />
                                </div>
                                <input
                                    type="number"
                                    value={commission || ''}
                                    onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-8 pr-3 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none focus:border-zinc-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column 3: Result Button */}
            <div className="space-y-8 h-full">

                {/* Build Price Button Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-50 shadow-sm flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden md:h-full min-h-[360px] md:min-h-[400px]">
                    <div className="space-y-1 relative z-10">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 pl-1">ÖNERİLEN SATIŞ FİYATI</p>
                        <h2 className={cn(
                            "text-6xl font-extrabold tracking-tight transition-all duration-500",
                            isCalculated ? "text-zinc-900 scale-100 opacity-100" : "text-zinc-200 scale-95 opacity-50"
                        )}>
                            ₺{formatCurrency(breakdown.salePrice)}
                        </h2>
                    </div>

                    {isCalculated && (
                        <div className="w-full grid grid-cols-3 gap-2 py-4 border-y border-zinc-50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tight mb-1">NET KÂR</p>
                                <p className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">₺{formatCurrency(breakdown.netProfit)}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-tight mb-1">KOMİSYON</p>
                                <p className="text-sm font-bold text-zinc-900 group-hover:text-amber-600 transition-colors">₺{formatCurrency(breakdown.commissionAmount)}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-tight mb-1">NET KDV</p>
                                <p className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">₺{formatCurrency(breakdown.netVat)}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleCalculate}
                        className="w-full py-5 bg-[#FFB096] hover:bg-[#FF9F81] text-white rounded-2xl text-base font-bold transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-3 active:scale-[0.98] relative z-10"
                    >
                        <Zap className={cn("w-5 h-5 transition-all duration-500", isCalculated ? "fill-white scale-110" : "fill-none")} />
                        {isCalculated ? 'Fiyatı Güncelle' : 'Fiyat Oluştur'}
                    </button>
                    {!isCalculated && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/10 to-transparent pointer-events-none" />
                    )}
                </div>
            </div>

            {/* Detailed Results (Below the 3 columns) */}
            {
                isCalculated && (
                    <div className="col-span-1 md:col-span-3 space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pl-2">
                                <div className="w-1 h-6 bg-sky-500 rounded-full" />
                                <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Nasıl Hesapladık?</h3>
                            </div>

                            <div className="bg-sky-50/50 p-6 rounded-[2.5rem] border border-sky-100/50 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-6 shadow-inner overflow-x-auto">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Satıştan Oluşan</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.saleVat)}</p>
                                </div>
                                <div className="text-sky-200 shrink-0"><Minus className="w-4 h-4" /></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Alıştan Oluşan</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.costVat)}</p>
                                </div>
                                <div className="text-sky-200 shrink-0"><Minus className="w-4 h-4" /></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Kargodan Oluşan</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.shippingVat)}</p>
                                </div>
                                <div className="text-sky-200 shrink-0"><Minus className="w-4 h-4" /></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Komisyondan Oluşan</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.commissionVat)}</p>
                                </div>
                                <div className="text-sky-200 shrink-0"><Minus className="w-4 h-4" /></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Hizmet Bedelinden</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.serviceFeeVat)}</p>
                                </div>
                                <div className="text-sky-200 shrink-0"><Minus className="w-4 h-4" /></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Uluslararası</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.intlServiceFeeVat)}</p>
                                </div>
                                <div className="text-sky-200 shrink-0"><Minus className="w-4 h-4" /></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-sky-600/60 uppercase tracking-widest leading-none">Stopaj (%1)</p>
                                    <p className="text-xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.stopajAmount)}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-4 bg-white px-6 py-4 rounded-3xl border border-sky-100 shadow-lg shadow-sky-500/5">
                                    <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20"><Box className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[8px] font-black text-sky-500 uppercase tracking-widest mb-0.5 leading-none">NET KDV</p>
                                        <p className="text-2xl font-black text-zinc-900 leading-none">₺{formatCurrency(breakdown.netVat)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <Wallet className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Komisyon</p>
                                        <p className="text-xl font-black text-zinc-900">₺{formatCurrency(breakdown.commissionAmount)}</p>
                                    </div>
                                </div>


                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <Truck className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Kargo Ücreti</p>
                                        <p className="text-xl font-black text-zinc-900">₺{formatCurrency(shipping)}</p>
                                    </div>
                                </div>

                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <Percent className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Stopaj Kesintisi</p>
                                        <p className="text-xl font-black text-zinc-900">₺{formatCurrency(breakdown.stopajAmount)}</p>
                                    </div>
                                </div>

                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <Percent className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Kâr Oranı</p>
                                        <p className="text-xl font-black text-zinc-900">%{breakdown.roi.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Kâr Marjı</p>
                                        <p className="text-xl font-black text-zinc-900">%{breakdown.margin.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <Zap className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Hizmet Bedeli</p>
                                        <p className="text-xl font-black text-zinc-900">₺{formatCurrency(breakdown.serviceFeeAmount)}</p>
                                    </div>
                                </div>

                                <div className="bg-sky-50/20 p-6 rounded-[2rem] border border-sky-100/20 flex items-center gap-5 hover:bg-sky-50/40 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-sky-500 shadow-md border border-sky-50 group-hover:scale-110 transition-transform">
                                        <HelpCircle className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-600/50 uppercase tracking-widest mb-1.5 leading-none">Uluslararası Hizmet Bedeli</p>
                                        <p className="text-xl font-black text-zinc-900">₺{formatCurrency(breakdown.intlServiceFeeAmount)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Profit Bar */}
                            <div className="bg-emerald-500 p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-500/30 flex items-center justify-between text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400 rounded-full translate-y-1/4 -translate-x-1/4 blur-3xl pointer-events-none" />

                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                                        <Star className="w-10 h-10 fill-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-[0.3em] opacity-70">TOPLAM NET KÂR</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black tracking-tight">₺{formatCurrency(breakdown.netProfit)}</span>
                                            <span className="text-xl font-bold opacity-60">/ Birim</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden lg:flex items-center gap-4 relative z-10">
                                    <div className="px-8 py-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1.5">MİNİNUM SATIŞ FİYATI</p>
                                        <p className="text-3xl font-black">₺{formatCurrency(breakdown.salePrice)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
