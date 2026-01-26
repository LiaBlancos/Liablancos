import { fetchAllTrendyolProducts, getProducts } from '@/lib/actions'
import { ShoppingBag } from 'lucide-react'
import TrendyolLimitList from '@/components/TrendyolLimitList'

export const dynamic = 'force-dynamic'

export default async function TrendyolLimitsPage() {
    const [trendyolData, allLocalProducts] = await Promise.all([
        fetchAllTrendyolProducts(),
        getProducts()
    ])

    if (trendyolData.error) {
        return (
            <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-rose-800">
                <h2 className="text-xl font-bold mb-2">Trendyol Bağlantı Hatası</h2>
                <p>{trendyolData.error}</p>
            </div>
        )
    }

    // Create a lookup map for local product settings by barcode
    const localLimitMap = new Map((allLocalProducts || []).map(p => [p.barcode, { id: p.id, min_stock: p.min_stock }]))

    const enhancedProducts = (trendyolData.products || []).map((p: any) => {
        const localData = localLimitMap.get(p.barcode)
        return {
            title: p.title,
            barcode: p.barcode,
            quantity: p.quantity,
            onSale: p.onSale,
            images: p.images,
            productContentId: p.productContentId,
            localId: localData?.id,
            minStock: localData?.min_stock || 10
        }
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 leading-tight">Trendyol Limit Yönetimi</h1>
                    <p className="text-zinc-500 font-medium tracking-tight">Mağaza ürünleriniz için özel kritik stok uyarıları tanımlayın</p>
                </div>
            </div>

            <TrendyolLimitList products={enhancedProducts} />
        </div>
    )
}
