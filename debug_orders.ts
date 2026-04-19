import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugOrders() {
    console.log('--- DEBUG ORDERS ---')
    const { data: settings, error } = await supabase.from('settings').select('*')
    if (error) {
        console.error('Error fetching settings:', error)
        return
    }
    const sellerId = settings?.find((s: any) => s.key === 'trendyol_seller_id')?.value?.trim()
    const apiKey = settings?.find((s: any) => s.key === 'trendyol_api_key')?.value?.trim()
    const apiSecret = settings?.find((s: any) => s.key === 'trendyol_api_secret')?.value?.trim()

    if (!sellerId || !apiKey || !apiSecret) {
        console.error('Missing credentials')
        return
    }

    console.log('Credentials loaded for Seller ID:', sellerId)
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    const statuses = ['Created', 'Picking', 'Shipped', 'Cancelled', 'Delivered']

    for (const status of statuses) {
        const url = `https://api.trendyol.com/integration/order/sellers/${sellerId}/orders?status=${status}&size=5&orderByField=OrderDate&orderByDirection=DESC`
        console.log(`\nChecking status: ${status}`)

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'User-Agent': `${sellerId} - SelfIntegration`
                }
            })

            if (!response.ok) {
                console.error(`API Error (${response.status}):`, await response.text())
                continue
            }

            const data: any = await response.json()
            const count = data.totalElements || 0
            console.log(`Found ${count} orders in status ${status}`)

            if (data.content && data.content.length > 0) {
                console.log('Latest Order Date:', data.content[0].orderDate)
                console.log('Latest Order Number:', data.content[0].orderNumber)
            }
        } catch (e) {
            console.error(`Fatal error for status ${status}:`, e)
        }
    }
}

debugOrders()
