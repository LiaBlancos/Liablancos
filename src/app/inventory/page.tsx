import { getProducts, getShelves } from '@/lib/actions'
import InventoryList from '@/components/InventoryList'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
    const [products, shelves] = await Promise.all([getProducts(), getShelves()])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Depo Stoğu</h1>
                    <p className="text-zinc-500 text-sm">{products.length} ürün kayıtlı</p>
                </div>
            </div>

            <InventoryList products={products} shelves={shelves} />
        </div>
    )
}
