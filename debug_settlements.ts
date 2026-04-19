import * as dotenv from 'dotenv'
const result = dotenv.config({ path: '.env.local' })
console.log('Dotenv result:', result)
console.log('ENV CHECK:', {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
})
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSettlements() {
    const { data: settings, error } = await supabase.from('settings').select('*')
    if (error) {
        console.error('Error fetching settings:', error)
        return
    }
    const sellerId = settings?.find((s: any) => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings?.find((s: any) => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings?.find((s: any) => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        console.error('Missing credentials')
        return
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    // Last 15 days to cover the order in screenshot (Feb 11)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 15)

    const startTimestamp = startDate.getTime()
    const endTimestamp = endDate.getTime()

    const url = `https://apigw.trendyol.com/integration/finance/che/sellers/${sellerId}/settlements?` +
        `startDate=${startTimestamp}&endDate=${endTimestamp}&` +
        `size=100` // Fetch first 100 to see types

    console.log(`Fetching from ${url}`)
    console.log('Current CWD:', process.cwd())

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': `${sellerId} - SelfIntegration`
            }
        })

        console.log('Response Status:', response.status)

        if (!response.ok) {
            console.error('API Error:', await response.text())
            // return // Don't return, let's see if we can parse error json
        }

        const text = await response.text()
        console.log('Response Length:', text.length)

        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error('Failed to parse JSON')
            return
        }

        const content = data.content || []

        console.log(`Fetched ${content.length} items`)

        // Analyze Transaction Types
        const types = new Set(content.map((i: any) => i.transactionType))
        console.log('Unique Transaction Types:', Array.from(types))

        // Analyze specific order
        const targetOrder = content.filter((i: any) => i.orderNumber === '10955446178')
        console.log(`Found ${targetOrder.length} transactions for order 10955446178`)

        // Write to file for better inspection
        const fs = await import('fs')
        const path = await import('path')
        const outputPath = path.join(process.cwd(), 'debug_output.json')
        fs.writeFileSync(outputPath, JSON.stringify({
            types: Array.from(types),
            targetOrder: targetOrder,
            sample: content.slice(0, 3)
        }, null, 2))
        console.log(`Output written to ${outputPath}`)

    } catch (e) {
        console.error('Fatal Error:', e)
    }
}

debugSettlements()
