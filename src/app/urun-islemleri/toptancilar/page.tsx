import { getProducts, getWholesalers, getWholesalePrices } from '@/lib/actions'
import WholesalersContent from '@/components/WholesalersContent'
import AuthWrapper from '@/components/AuthWrapper'

export default async function ToptancilarPage() {
    const products = await getProducts()
    const wholesalers = await getWholesalers()
    const prices = await getWholesalePrices()

    return (
        <AuthWrapper>
            <WholesalersContent
                initialProducts={products}
                initialWholesalers={wholesalers}
                initialPrices={prices}
            />
        </AuthWrapper>
    )
}
