import { getLowStockProducts, fetchTrendyolProducts, getProducts } from '@/lib/actions'
import { AlertTriangle } from 'lucide-react'
import LowStockList from '@/components/LowStockList'

export const dynamic = 'force-dynamic'

export default async function LowStockPage() {
    const [warehouseProducts, trendyolData, allLocalProducts] = await Promise.all([
        getLowStockProducts(),
        fetchTrendyolProducts(),
        getProducts()
    ])

    // Create a lookup map for local product settings by barcode
    const localLimitMap = new Map(allLocalProducts.map(p => [p.barcode, { id: p.id, min_stock: p.min_stock }]))

    const trendyolProducts = (trendyolData.products || []).map((p: any) => {
        const localData = localLimitMap.get(p.barcode)
        return {
            ...p,
            localId: localData?.id,
            minStock: localData?.min_stock || 10
        }
    }).filter((p: any) => p.onSale && p.quantity <= p.minStock)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                    <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 leading-tight">Kritik Stoklar</h1>
                    <p className="text-zinc-500 font-medium tracking-tight">Envanter sağlığını buradan takip edin</p>
                </div>
            </div>

            <LowStockList
                warehouseProducts={warehouseProducts}
                trendyolProducts={trendyolProducts}
            />
        </div>
    )
}
