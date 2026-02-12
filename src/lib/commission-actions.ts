'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getShippingRate, TEX_VAT_INCLUSIVE_RATES } from '@/lib/calculation-utils'

async function getSettings() {
    const { data } = await supabase.from('settings').select('*')
    return data || []
}

/**
 * Fetch commission rates from Trendyol Settlements API
 * Endpoint: GET /integration/finance/che/sellers/{sellerId}/settlements
 * Returns Sale transactions with commissionRate for each barcode
 */
export async function fetchTrendyolCommissionRates(daysBack: number = 7) {
    // Get Trendyol credentials
    const settings = await getSettings()
    const sellerId = settings.find((s: any) => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find((s: any) => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find((s: any) => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        return { error: 'Trendyol API bilgileri eksik. Ayarlar sayfasından doldurun.' }
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        // Calculate date range (last N days)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysBack)

        const startTimestamp = startDate.getTime()
        const endTimestamp = endDate.getTime()

        console.log(`[Commission] Fetching settlements from ${startDate.toISOString()} to ${endDate.toISOString()}`)

        // Fetch settlements with pagination
        let page = 0
        const size = 500 // Max page size
        let allSettlements: any[] = []
        let hasMore = true

        while (hasMore) {
            const url = `https://apigw.trendyol.com/integration/finance/che/sellers/${sellerId}/settlements?` +
                `startDate=${startTimestamp}&endDate=${endTimestamp}&` +
                `transactionTypes=Sale&page=${page}&size=${size}`

            console.log(`[Commission] Fetching page ${page}, size ${size}`)

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'User-Agent': `${sellerId} - SelfIntegration`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`[Commission API Error] ${response.status}:`, errorText)
                throw new Error(`Trendyol API Hatası (${response.status})`)
            }

            const data = await response.json()
            const content = data.content || []

            console.log(`[Commission] Page ${page}: ${content.length} items`)

            allSettlements = [...allSettlements, ...content]

            hasMore = content.length === size
            page++

            if (page > 100) break
        }

        // Group by barcode and find the most recent transaction for each
        const barcodeMap = new Map<string, { commissionRate: number, transactionDate: string }>()

        for (const settlement of allSettlements) {
            const barcode = settlement.barcode
            const commissionRate = settlement.commissionRate
            const transactionDate = settlement.transactionDate

            if (!barcode || commissionRate === undefined || commissionRate === null) continue

            const existing = barcodeMap.get(barcode)
            if (!existing || new Date(transactionDate) > new Date(existing.transactionDate)) {
                barcodeMap.set(barcode, {
                    commissionRate: parseFloat(commissionRate.toString()),
                    transactionDate
                })
            }
        }

        // Upsert to database
        const upsertData = Array.from(barcodeMap.entries()).map(([barcode, data]) => ({
            barcode,
            commission_rate: data.commissionRate,
            last_transaction_date: new Date(data.transactionDate).toISOString(),
            updated_at: new Date().toISOString()
        }))

        if (upsertData.length > 0) {
            const { error: upsertError } = await supabase
                .from('trendyol_commission_rates')
                .upsert(upsertData, { onConflict: 'barcode' })

            if (upsertError) throw upsertError
        }

        revalidatePath('/campaigns/commission-tariffs')

        return {
            success: true,
            count: upsertData.length,
            message: `${upsertData.length} ürün komisyon oranı güncellendi`
        }

    } catch (error: any) {
        console.error('[Commission] Error:', error)
        return { error: error.message || 'Komisyon verileri çekilirken hata oluştu' }
    }
}

/**
 * Get commission rates from database
 */
export async function getCommissionRates() {
    const { data, error } = await supabase
        .from('trendyol_commission_rates')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('[Commission] Get error:', error)
        return []
    }

    return data || []
}

/**
 * Get commission rate for a specific barcode
 */
export async function getCommissionRateByBarcode(barcode: string) {
    const { data, error } = await supabase
        .from('trendyol_commission_rates')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle()

    if (error) return null
    return data
}

// Deprecated local utility moved to @/lib/calculation-utils

/**
 * Get shipping rates from database (Deprecated in favor of TEX hardcoded list but kept for compatibility)
 */
export async function getShippingRates() {
    const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('desi', { ascending: true })

    if (error) {
        console.error('[Shipping] Get error:', error)
        return Object.entries(TEX_VAT_INCLUSIVE_RATES).map(([desi, price]) => ({ desi: parseInt(desi), price }))
    }

    return data || []
}

/**
 * Get all data needed for commission tariffs page
 */
export async function getCommissionTariffsData() {
    try {
        // 1. Get all products
        const { data: products, error: pError } = await supabase
            .from('products')
            .select('*')
            .order('name')

        if (pError) throw pError

        // 2. Get all commission rates
        const { data: commissions, error: cError } = await supabase
            .from('trendyol_commission_rates')
            .select('*')

        if (cError) throw cError

        // 3. Get all wholesale prices (to find min cost)
        const { data: prices, error: prError } = await supabase
            .from('wholesale_prices')
            .select('*')
            .eq('is_active', true)

        if (prError) throw prError

        // 4. Get shipping rates
        const { data: shippingRates, error: sError } = await supabase
            .from('shipping_rates')
            .select('*')
            .order('desi', { ascending: true })

        if (sError) throw sError

        // Process data: group prices by product_id and find min
        const productCosts = new Map<string, number>()
        prices?.forEach(p => {
            const currentMin = productCosts.get(p.product_id) || Infinity
            if (p.buy_price < currentMin) {
                productCosts.set(p.product_id, p.buy_price)
            }
        })

        // Map everything together
        const joinedData = products?.map(p => {
            const commission = commissions?.find(c => c.barcode === p.barcode)
            const cost = productCosts.get(p.id) || 0

            // Find shipping price based on desi from TEX list
            const desi = p.desi || 0
            const shipping = getShippingRate(desi)

            return {
                id: p.id,
                barcode: p.barcode,
                name: p.name,
                sku: p.sku,
                image: p.image_url,
                stock: p.quantity,
                salePrice: p.sale_price || 0,
                cost: p.cost || cost, // Manual cost override
                costVatRate: p.cost_vat_rate || 10,
                shipping: shipping,
                desi: desi,
                modelId: p.model_id,
                brandName: p.brand_name,
                color: p.color,
                size: p.size,
                returnRate: p.return_rate,
                isShippedToday: p.is_shipped_today,
                targetProfitMargin: p.target_profit_margin,
                commissionRate: commission?.commission_rate || null,
                lastTransactionDate: commission?.last_transaction_date || null
            }
        })

        return {
            success: true,
            products: joinedData || [],
            shippingRates: shippingRates || []
        }
    } catch (error: any) {
        console.error('[Commission Data] Error:', error)
        return { error: error.message || 'Veriler yüklenirken hata oluştu' }
    }
}
