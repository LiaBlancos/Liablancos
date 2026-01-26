'use client'

import { useState } from 'react'
import { RotateCcw, AlertCircle, Package, History, BarChart3 } from 'lucide-react'
import ReturnsTable from '@/components/ReturnsTable'
import ReturnReasonsAnalysis from '@/components/ReturnReasonsAnalysis'
import { cn } from '@/lib/utils'

interface ReturnsContentProps {
    orders: any[]
    totalElements: number
    totalPages: number
    currentPage: number
    pageSize: number
    error?: string
}

export default function ReturnsContent({
    orders,
    totalElements,
    totalPages,
    currentPage,
    pageSize,
    error
}: ReturnsContentProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'analysis'>('all')

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                        <RotateCcw className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">İadeler</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">İptal edilen ve iade sürecindeki paketler</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-zinc-100 p-1 rounded-2xl self-start md:self-center">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'all'
                                ? "bg-white text-rose-600 shadow-xl shadow-zinc-200"
                                : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <History className="w-4 h-4" />
                        Tüm İadeler
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'analysis'
                                ? "bg-white text-rose-600 shadow-xl shadow-zinc-200"
                                : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        <BarChart3 className="w-4 h-4" />
                        İade Analizi
                    </button>
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

            {!error && orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-zinc-200">
                        <Package className="w-12 h-12 text-zinc-200" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Kayıt Bulunmuyor</h3>
                    <p className="text-zinc-500">Henüz iade edilmiş veya teslim edilemeyen bir paket bulunmamaktadır.</p>
                </div>
            )}

            {!error && orders.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'all' ? (
                        <ReturnsTable
                            orders={orders}
                            totalElements={totalElements}
                            totalPages={totalPages}
                            currentPage={currentPage}
                            pageSize={pageSize}
                        />
                    ) : (
                        <ReturnReasonsAnalysis orders={orders} />
                    )}
                </div>
            )}
        </div>
    )
}
