import React from 'react'
import { getProfitabilityOrderDetails } from '@/lib/profitability-actions'
import ProfitabilityDetail from '@/components/ProfitabilityDetail'
import { notFound } from 'next/navigation'

export default async function OrderProfitabilityPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const result = await getProfitabilityOrderDetails(params.id)

    if (result.error || !result.data) {
        return notFound()
    }

    return (
        <div className="p-6">
            <ProfitabilityDetail order={result.data} />
        </div>
    )
}
