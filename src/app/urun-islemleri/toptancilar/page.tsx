import { getProducts, getWholesalers, getWholesalePrices } from '@/lib/actions'
import WholesalersContent from '@/components/WholesalersContent'

export default async function ToptancilarPage() {
    const products = await getProducts()
    const wholesalers = await getWholesalers()
    const prices = await getWholesalePrices()

    return (
        <WholesalersContent
            initialProducts={products}
            initialWholesalers={wholesalers}
            initialPrices={prices}
        />
    )
}
