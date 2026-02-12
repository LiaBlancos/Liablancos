import { getProducts } from '@/lib/actions'
import ProductSettingsList from '@/components/ProductSettingsList'
import { Settings2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProductSettingsPage() {
    const products = await getProducts()

    return (
        <div className="space-y-6 p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Settings2 className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Ürün Ayarları</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <p className="text-sm text-zinc-500 font-bold">{products.length} Ürün Listeleniyor</p>
                    </div>
                </div>
            </div>

            <ProductSettingsList products={products} />
        </div>
    )
}
