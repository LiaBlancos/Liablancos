import { getProducts, getWholesalers, getWholesalePrices } from '@/lib/actions'
import WholesalersContent from '@/components/WholesalersContent'
import AuthWrapper from '@/components/AuthWrapper'

export default async function ToptancilarPage() {
    const products = await getProducts()
    const wholesalers = await getWholesalers()
    const prices = await getWholesalePrices()

    return (
        <AuthWrapper>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Toptancılar</h1>
                    <p className="text-zinc-500 mt-1">Ürün alış fiyatlarını ve toptancıları yönetin.</p>
                </div>
                <WholesalersContent
                    initialProducts={products}
                    initialWholesalers={wholesalers}
                    initialPrices={prices}
                />
            </div>
        </AuthWrapper>
    )
}
