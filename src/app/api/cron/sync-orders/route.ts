import { NextResponse } from 'next/server'
import { getTrendyolOrders } from '@/lib/actions'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60 // 1 minute max duration
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Authenticate the cron request if needed (e.g. using a secret token in headers)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        // Fetch last 14 days of orders from Trendyol
        const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)
        
        console.log('[CRON] Fetching Trendyol orders for the last 14 days...')
        const result = await getTrendyolOrders(
            undefined, // all statuses
            0,
            200, // fetch up to 200 at a time
            fourteenDaysAgo
        )

        if (result.error) {
            console.error('[CRON] Error fetching from Trendyol:', result.error)
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }

        const orders = result.orders || []
        
        if (orders.length === 0) {
            return NextResponse.json({ success: true, message: 'No new orders to sync.' })
        }

        console.log(`[CRON] Fetched ${orders.length} orders. Syncing to database...`)

        // Format orders for the cache table
        const recordsToUpsert = orders.map((order: any) => ({
            order_number: order.orderNumber,
            order_date: new Date(order.orderDate).toISOString(),
            status: order.status,
            total_price: order.totalPrice,
            raw_data: order,
            updated_at: new Date().toISOString()
        }))

        // Upsert into Supabase
        const { error: dbError } = await supabase
            .from('trendyol_orders_cache')
            .upsert(recordsToUpsert, {
                onConflict: 'order_number',
                ignoreDuplicates: false
            })

        if (dbError) {
            console.error('[CRON] Supabase upsert error:', dbError)
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
        }

        console.log(`[CRON] Successfully synced ${orders.length} orders to cache.`)
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully synced ${orders.length} orders.`,
            count: orders.length
        })

    } catch (error: any) {
        console.error('[CRON] Unexpected error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
