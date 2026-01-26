import { getTrendyolOrders, getSettings } from '@/lib/actions'
import { Timer, AlertCircle } from 'lucide-react'
import InTransitList from '@/components/InTransitList'

export const dynamic = 'force-dynamic'

export default async function DelayedOrdersPage() {
    // 1. Fetch threshold from settings
    const settings = await getSettings()
    const thresholdStr = settings.find(s => s.key === 'shipping_delay_threshold')?.value || '3'
    const threshold = parseInt(thresholdStr)

    // 2. Fetch orders with Shipped status
    const result = await getTrendyolOrders('Shipped')
    const orders = result.orders || []
    const error = result.error

    // 3. Helper to parse date (reusing logic from InTransitList)
    const parseDate = (dateVal: any) => {
        if (!dateVal) return null
        if (typeof dateVal === 'number') {
            const timestamp = dateVal < 10000000000 ? dateVal * 1000 : dateVal
            return new Date(timestamp)
        }
        if (typeof dateVal === 'string' && /^\d+$/.test(dateVal)) {
            const num = parseInt(dateVal)
            const timestamp = num < 10000000000 ? num * 1000 : num
            return new Date(timestamp)
        }
        const d = new Date(dateVal)
        return isNaN(d.getTime()) ? null : d
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <Timer className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">Gecikenler</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">
                            En az {threshold} gündür yolda olan paketler
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col items-center text-center space-y-3 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-rose-900">Hata Oluştu</h3>
                        <p className="text-sm text-rose-600 max-w-sm mx-auto">{error}</p>
                    </div>
                </div>
            )}

            {!error && orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                    <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-zinc-200">
                        <Timer className="w-12 h-12 text-zinc-200" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Aktif Sevkiyat Yok</h3>
                    <p className="text-zinc-500">Şu an yolda olan bir paketiniz bulunmuyor.</p>
                </div>
            )}

            {!error && orders.length > 0 && (
                <InTransitList
                    orders={orders}
                    initialThreshold={threshold}
                    showThresholdInput={true}
                />
            )}
        </div>
    )
}
