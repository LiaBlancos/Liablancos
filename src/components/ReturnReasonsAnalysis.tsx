'use client'

import { useState, useMemo } from 'react'
import {
    BarChart3,
    ChevronDown,
    ChevronUp,
    Package,
    AlertCircle,
    Search,
    TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReturnReasonsAnalysisProps {
    orders: any[]
}

export default function ReturnReasonsAnalysis({ orders }: ReturnReasonsAnalysisProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'count',
        direction: 'desc'
    })

    // Aggregation Logic
    const analysisData = useMemo(() => {
        const stats: Record<string, { productName: string; barcodes: Set<string>; reasons: Record<string, number>; total: number }> = {}

        orders.forEach(order => {
            order.lines?.forEach((line: any) => {
                const productName = line.productName
                const reason = order.extractedReturnReason || 'Belirtilmemiş'

                if (!stats[productName]) {
                    stats[productName] = {
                        productName,
                        barcodes: new Set(),
                        reasons: {},
                        total: 0
                    }
                }

                stats[productName].barcodes.add(line.barcode)
                stats[productName].reasons[reason] = (stats[productName].reasons[reason] || 0) + (line.quantity || 1)
                stats[productName].total += (line.quantity || 1)
            })
        })

        // Flatten for table
        const flattened = Object.values(stats).flatMap(product =>
            Object.entries(product.reasons).map(([reason, count]) => ({
                productName: product.productName,
                barcode: Array.from(product.barcodes).join(', '),
                reason,
                count,
                totalForProduct: product.total
            }))
        )

        return flattened.filter(item =>
            item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.barcode.includes(searchTerm)
        ).sort((a: any, b: any) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [orders, searchTerm, sortConfig])

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    return (
        <div className="space-y-6">
            {/* Analysis Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 leading-tight">İade Analizi</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Ürün Bazlı Sebep Dağılımı</p>
                    </div>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Ürün, barkod veya sebep ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                </div>
            </div>

            {/* Analysis Table */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th
                                    className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors"
                                    onClick={() => handleSort('productName')}
                                >
                                    <div className="flex items-center gap-2">
                                        Ürün Adı
                                        {sortConfig.key === 'productName' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Barkod</th>
                                <th
                                    className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors"
                                    onClick={() => handleSort('reason')}
                                >
                                    <div className="flex items-center gap-2">
                                        İade Sebebi
                                        {sortConfig.key === 'reason' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center cursor-pointer hover:text-rose-600 transition-colors"
                                    onClick={() => handleSort('count')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Adet
                                        {sortConfig.key === 'count' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {analysisData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <TrendingDown className="w-10 h-10 text-zinc-200" />
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest italic">Analiz edilecek veri bulunamadı</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                analysisData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900 leading-tight line-clamp-1">{item.productName}</span>
                                                <span className="text-[10px] text-zinc-400 font-medium italic">Toplam İade: {item.totalForProduct}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-zinc-500">{item.barcode}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-100">
                                                <AlertCircle className="w-3 h-3" />
                                                {item.reason}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 text-xs font-black">
                                                {item.count}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
