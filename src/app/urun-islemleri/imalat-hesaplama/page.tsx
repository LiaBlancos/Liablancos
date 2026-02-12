import { getProducts, getRawMaterials } from '@/lib/actions'
import { supabase } from '@/lib/supabase'
import ManufacturingCalculator from '@/components/ManufacturingCalculator'
import { Calculator } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ImalatHesaplamaPage() {
    const products = await getProducts()
    const rawMaterials = await getRawMaterials()

    // Fetch manufacturing catalog
    const { data: catalog, error: catalogError } = await supabase
        .from('manufacturing_catalog')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false })

    if (catalogError) {
        console.error('Error fetching manufacturing catalog:', catalogError)
    }

    // Joint fetch for product materials with their raw material info
    const { data: productMaterials, error } = await supabase
        .from('product_materials')
        .select('*, material:raw_materials(*)')

    if (error) {
        console.error('Error fetching product materials:', error)
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Calculator className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">İmalat Hesaplama</h1>
                        <p className="text-zinc-500 font-medium tracking-tight">Ürün maliyetlerini hammaddeler üzerinden kalem kalem hesaplayın</p>
                    </div>
                </div>
            </div>

            <ManufacturingCalculator
                initialProducts={products}
                initialRawMaterials={rawMaterials}
                initialProductMaterials={productMaterials || []}
                initialCatalog={catalog || []}
            />
        </div>
    )
}
