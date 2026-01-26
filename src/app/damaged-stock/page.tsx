import { getDamagedProducts } from '@/lib/actions'
import { Trash2, AlertTriangle } from 'lucide-react'
import DamagedStockList from '@/components/DamagedStockList'

export const dynamic = 'force-dynamic'

export default async function DamagedStockPage() {
    const products = await getDamagedProducts()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <Trash2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">Hasarlı Ürün Takibi</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Envanterdeki hasarlı ve kusurlu ürünleri izleyin</p>
                    </div>
                </div>

                {products.length > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-wider">{products.length} Ürün İnceleme Bekliyor</span>
                    </div>
                )}
            </div>

            <DamagedStockList products={products} />
        </div>
    )
}
