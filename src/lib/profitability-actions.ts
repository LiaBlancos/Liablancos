'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { ProfitabilityOrder, ProfitabilityOrderItem, ProfitabilityOrderFee } from '@/types'
import { getShippingRate, TEX_VAT_INCLUSIVE_RATES } from '@/lib/calculation-utils'

// Helper to get credentials
async function getTrendyolCredentials() {
    const { data: settings } = await supabase.from('settings').select('*')
    if (!settings) return null

    const sellerId = settings.find((s: any) => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find((s: any) => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find((s: any) => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) return null
    return { sellerId, apiKey, apiSecret }
}

export async function syncTrendyolOrders(daysBack: number = 3) {
    const creds = await getTrendyolCredentials()

    if (!creds) {
        return { success: false, error: 'Trendyol API ayarları eksik.' }
    }

    const { sellerId, apiKey, apiSecret } = creds
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysBack)

        const startTimestamp = startDate.getTime()
        const endTimestamp = endDate.getTime()

        console.log(`[Profitability] Syncing orders from ${startDate.toISOString()}...`)

        // 1. Fetch Orders
        let allOrders: any[] = []
        let orderPage = 0
        let hasMoreOrders = true

        while (hasMoreOrders) {
            const url = `https://api.trendyol.com/sapigw/suppliers/${sellerId}/orders?` +
                `orderBy=LastModifiedDate&order=DESC&size=200&page=${orderPage}&` +
                `startDate=${startTimestamp}&endDate=${endTimestamp}`

            const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': `${sellerId} - SelfIntegration` } })
            if (!response.ok) throw new Error(`Trendyol Orders API Error: ${response.status}`)

            const data = await response.json()
            const content = data.content || []
            allOrders = [...allOrders, ...content]

            if (content.length === 0 || orderPage > 50) hasMoreOrders = false
            orderPage++
        }
        console.log(`[Profitability] Fetched ${allOrders.length} orders.`)

        // 2. Fetch Settlements (Financial Transactions) - Wider range to catch late settlements
        // Fetching 15 days back for settlements to ensure we catch transactions for older orders being synced
        const settlementStartDate = new Date()
        settlementStartDate.setDate(settlementStartDate.getDate() - (daysBack + 15))
        const settlementStartTimestamp = settlementStartDate.getTime()

        let allSettlements: any[] = []
        let settlementPage = 0
        let hasMoreSettlements = true

        console.log(`[Profitability] Fetching settlements from ${settlementStartDate.toISOString()}...`)

        while (hasMoreSettlements) {
            const url = `https://apigw.trendyol.com/integration/finance/che/sellers/${sellerId}/settlements?` +
                `startDate=${settlementStartTimestamp}&endDate=${endTimestamp}&` +
                `page=${settlementPage}&size=500`

            const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': `${sellerId} - SelfIntegration` } })
            if (!response.ok) {
                console.error(`Trendyol Settlements API Error: ${response.status}`)
                break // Don't fail entire sync, just skip settlements if API fails
            }

            const data = await response.json()
            const content = data.content || []
            allSettlements = [...allSettlements, ...content]

            if (content.length < 500 || settlementPage > 50) hasMoreSettlements = false
            settlementPage++
        }
        console.log(`[Profitability] Fetched ${allSettlements.length} settlement transactions.`)

        // Group Settlements by Order Number
        const settlementsByOrder = new Map<string, any[]>()
        allSettlements.forEach(item => {
            if (item.orderNumber) {
                const existing = settlementsByOrder.get(item.orderNumber) || []
                existing.push(item)
                settlementsByOrder.set(item.orderNumber, existing)
            }
        })

        // 3. Process Each Order
        let successCnt = 0
        let errorCnt = 0

        for (const tOrder of allOrders) {
            const orderSettlements = settlementsByOrder.get(tOrder.orderNumber) || []
            const res = await processSingleOrder(tOrder, orderSettlements, supabase)

            if (res?.error) {
                errorCnt++
                console.error(`Order ${tOrder.orderNumber} error:`, res.error)
            } else {
                successCnt++
            }
        }

        revalidatePath('/finans/karlilik')
        return { success: true, message: `${successCnt} sipariş işlendi (${errorCnt} hata).` }

    } catch (error: any) {
        console.error('Sync failed:', error)
        return { success: false, error: error.message }
    }
}

async function processSingleOrder(tOrder: any, settlements: any[], supabase: any) {
    // Determine if order is settled based on having financial transactions (Sale, Deduction)
    // We look for 'Settlement' or just presence of financial items. 
    // Usually a 'Sale' transaction implies it's being paid.
    const isSettled = settlements.length > 0 && settlements.some(s => s.transactionType === 'Sale')

    // 1. Upsert Order
    const orderData: Partial<ProfitabilityOrder> & { is_settled: boolean } = {
        order_number: tOrder.orderNumber,
        customer_name: `${tOrder.customerFirstName} ${tOrder.customerLastName}`,
        total_price: tOrder.grossAmount,
        currency: tOrder.currencyCode || 'TRY',
        status: tOrder.status,
        order_date: new Date(tOrder.orderDate).toISOString(),
        last_synced_at: new Date().toISOString(),
        is_settled: isSettled
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert(orderData, { onConflict: 'order_number' })
        .select()
        .single()

    if (orderError) return { error: orderError.message }

    // 2. Process Items & Calculate Costs
    // Remove existing items/fees to rebuild
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('order_fees').delete().eq('order_id', order.id)

    let totalGrossCost = 0
    const itemsToInsert: any[] = []
    const feesToInsert: any[] = []

    // --- A. Process Order Lines (Products) ---
    for (const line of tOrder.lines) {
        // Fetch Product Cost
        const { data: product } = await supabase
            .from('products')
            .select('id, cost, cost_vat_rate, desi, barcode')
            .eq('barcode', line.barcode)
            .maybeSingle()

        const unitCost = product?.cost || 0
        const quantity = line.quantity
        const lineTotal = line.price * quantity
        totalGrossCost += (unitCost * quantity)

        const item = {
            id: crypto.randomUUID(),
            order_id: order.id,
            product_id: product?.id,
            sku: line.sku,
            barcode: line.barcode,
            product_name: line.productName,
            quantity: quantity,
            unit_price: line.price,
            vat_rate: line.vatBaseAmount ? (line.vatBaseAmount / line.amount) * 100 : 0,
            unit_cost: unitCost,
            status: line.status
        }
        itemsToInsert.push(item)
    }

    // --- B. Process Fees (Settled vs Estimated) ---

    if (isSettled) {
        // --- 1. SETTLED MODE: Use Actual Transactions ---
        // Filter relevant transaction types
        // Types: Sale, Deduction, Return, Other
        // Deduction usually contains: Commission, Shipping, Service fees

        for (const s of settlements) {
            // Skip 'Sale' transactions for fee calculation (they represent revenue)
            // But check if they have negative amounts just in case
            // We are interested in Deductions (Commission, Shipping etc)

            // Note: Trendyol API returns Commission inside 'Settlement' object sometimes,
            // or as separate line items. 
            // Logic based on standard settlements API:
            // transactionType: 'Deduction' -> Commission, Shipping, etc.

            if (s.transactionType === 'Deduction' || s.transactionType === 'Return') {
                // Map specific reasons to Fee Types
                let feeType = 'OTHER'
                let desc = s.debtorCreditReason || s.transactionType

                const reason = (s.debtorCreditReason || '').toLowerCase()

                if (reason.includes('komisyon')) feeType = 'COMMISSION'
                else if (reason.includes('kargo') || reason.includes('transport')) feeType = 'SHIPPING'
                else if (reason.includes('hizmet') || reason.includes('service')) feeType = 'SERVICE_FEE'
                else if (reason.includes('iade')) feeType = 'RETURN_COST'
                else if (reason.includes('stoppage') || reason.includes('stopaj')) feeType = 'TAX'

                feesToInsert.push({
                    order_id: order.id,
                    fee_type: feeType,
                    amount: -Math.abs(s.amount), // Ensure negative for deduction
                    currency: s.currency || 'TRY',
                    description: desc,
                    transaction_date: new Date(s.transactionDate).toISOString()
                })
            }
        }
    } else {
        // --- 2. ESTIMATED MODE: Calculate Predicted Fees ---

        // Fetch Commission Rates
        // We do this per line item usually
        for (const line of tOrder.lines) {
            const { data: commission } = await supabase
                .from('trendyol_commission_rates')
                .select('commission_rate')
                .eq('barcode', line.barcode)
                .maybeSingle()

            const lineTotal = line.price * line.quantity
            const rate = commission?.commission_rate

            // 1. Estimated Commission
            if (rate) {
                const commissionAmount = (lineTotal * rate) / 100
                feesToInsert.push({
                    order_id: order.id,
                    fee_type: 'COMMISSION',
                    amount: -Math.abs(commissionAmount),
                    currency: 'TRY',
                    description: `Komisyon (Tahmini %${rate})`,
                    transaction_date: new Date().toISOString()
                })
            }

            // 2. Estimated Shipping (Desi based)
            // Fetch product for Desi
            const { data: product } = await supabase
                .from('products')
                .select('desi')
                .eq('barcode', line.barcode)
                .maybeSingle()

            const desi = product?.desi || 1 // Default to 1 if missing
            const estimatedShipping = getShippingRate(desi)

            // Check if we already added shipping for this order? 
            // Simple logic: Add shipping for every item? No, usually per package.
            // For estimation, we will assume 1 package per order for simplicity 
            // OR sum up Desi.
            // Let's add shipping ONCE per order based on max desi or sum? 
            // For now, per item shipping is safer to not under-estimate, but might over-estimate.
            // BETTER: Single fixed shipping fee per order for estimation if multiple items?
            // Let's stick to: If it's the first item, add base shipping. 
            // OR: Sum total desi of order.
        }

        // TOTAL ORDER ESTIMATIONS (Shipping & Service Fee)
        // 1. Service Fee (Fixed)
        // Platform Hizmet Bedeli (13.19 TL) + MicroExport (if applicable)
        feesToInsert.push({
            order_id: order.id,
            fee_type: 'SERVICE_FEE',
            amount: -13.19, // Hardcoded current rate
            currency: 'TRY',
            description: 'Platform Hizmet Bedeli (Tahmini)',
            transaction_date: new Date().toISOString()
        })

        // 2. Shipping (Total Desi Calculation)
        // We need total desi of the order
        let totalDesi = 0
        for (const line of tOrder.lines) {
            const { data: product } = await supabase
                .from('products')
                .select('desi')
                .eq('barcode', line.barcode)
                .maybeSingle()
            totalDesi += (product?.desi || 0) * line.quantity
        }

        if (totalDesi === 0) totalDesi = 1 // Min 1 desi
        const shippingCost = getShippingRate(totalDesi)

        feesToInsert.push({
            order_id: order.id,
            fee_type: 'SHIPPING',
            amount: -Math.abs(shippingCost),
            currency: 'TRY',
            description: `Kargo Ücreti (Tahmini - ${Math.ceil(totalDesi)} Desi)`,
            transaction_date: new Date().toISOString()
        })
    }

    // Insert Data
    if (itemsToInsert.length > 0) {
        await supabase.from('order_items').insert(itemsToInsert)
    }
    if (feesToInsert.length > 0) {
        await supabase.from('order_fees').insert(feesToInsert)
    }

    // 3. Update Order Totals
    const totalFees = feesToInsert.reduce((sum, f) => sum + Math.abs(f.amount), 0)
    const netProfit = tOrder.grossAmount - totalGrossCost - totalFees

    await supabase.from('orders').update({
        gross_cost: totalGrossCost,
        net_profit: netProfit,
        updated_at: new Date().toISOString()
    }).eq('id', order.id)

    return { success: true }
}

export async function getProfitabilityOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error fetching profitability orders:', error)
        return []
    }
    return data as any[]
}

export async function getProfitabilityOrderDetails(id: string) {
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', id)
        .single()

    if (orderError) return { error: orderError.message }

    const { data: fees, error: feesError } = await supabase
        .from('order_fees')
        .select('*')
        .eq('order_id', id)

    if (feesError) return { error: feesError.message }

    return { data: { ...order, fees } }
}
