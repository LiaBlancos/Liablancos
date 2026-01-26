'use server'

import { supabase } from './supabase'
import { Product, Shelf, InventoryLog } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getRecentLogs() {
    const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
      *,
      products (name, barcode)
    `)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) console.error('Error fetching logs:', error)
    return data || []
}

export async function getShelves() {
    const { data, error } = await supabase
        .from('shelves')
        .select('*')
        .order('code')

    if (error) console.error('Error fetching shelves:', error)
    return (data as Shelf[]) || []
}

export async function getLowStockCount() {
    const { data, error } = await supabase
        .from('products')
        .select('id, quantity, min_stock')

    if (error) {
        console.error('Error fetching low stock count:', error)
        return 0
    }

    return data?.filter(p => p.quantity <= p.min_stock).length || 0
}

export async function getDamagedProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            shelves (code),
            categories (name)
        `)
        .gt('damaged_quantity', 0)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Fetch damaged products error:', error)
        return []
    }

    return data as Product[]
}

export async function getLowStockProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            shelves (id, code)
        `)
        .order('quantity', { ascending: true })

    if (error) {
        console.error('Error fetching low stock products:', error)
        return []
    }

    return (data?.filter(p => p.quantity <= p.min_stock) as Product[]) || []
}

export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      shelves (id, code, capacity),
      categories (id, name)
    `)
        .order('name')

    if (error) console.error('Error fetching products:', error)
    return (data as Product[]) || []
}

export async function getProductByBarcode(barcode: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      shelves (id, code, capacity)
    `)
        .eq('barcode', barcode)
        .single()

    if (error) return null
    return data as Product
}

export async function updateStock(
    productId: string,
    quantityChange: number,
    type: InventoryLog['transaction_type']
) {
    // 1. Get current product to calculate new quantity
    const { data: product } = await supabase
        .from('products')
        .select('quantity, shelf_id')
        .eq('id', productId)
        .single()

    if (!product) throw new Error('Product not found')

    const newQuantity = Math.max(0, product.quantity + quantityChange)

    // 2. Update product quantity
    const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', productId)

    if (updateError) throw new Error(updateError.message)

    // 3. Log transaction
    const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
            product_id: productId,
            transaction_type: type,
            quantity_change: quantityChange,
            old_shelf_id: product.shelf_id,
            new_shelf_id: product.shelf_id // No move here
        })

    if (logError) console.error('Error logging transaction:', logError)

    revalidatePath('/inventory')
    revalidatePath('/')
    return { success: true, newQuantity }
}

export async function moveProductToShelf(productId: string, newShelfId: string) {
    // Get current shelf
    const { data: product } = await supabase
        .from('products')
        .select('shelf_id')
        .eq('id', productId)
        .single()

    if (!product) throw new Error('Product not found')

    // Update shelf
    const { error } = await supabase
        .from('products')
        .update({ shelf_id: newShelfId, updated_at: new Date().toISOString() })
        .eq('id', productId)

    if (error) throw new Error(error.message)

    // Log move
    await supabase.from('inventory_logs').insert({
        product_id: productId,
        transaction_type: 'MOVE',
        quantity_change: 0,
        old_shelf_id: product.shelf_id,
        new_shelf_id: newShelfId
    })

    revalidatePath('/inventory')
    return { success: true }
}

export async function createProduct(data: Partial<Product>) {
    const { error } = await supabase
        .from('products')
        .insert([{
            name: data.name,
            barcode: data.barcode,
            description: data.description,
            min_stock: data.min_stock || 5,
            quantity: data.quantity || 0,
            shelf_id: data.shelf_id || null,
        }])

    if (error) throw new Error(error.message)

    revalidatePath('/inventory')
    return { success: true }
}

export async function createShelf(data: Partial<Shelf>) {
    const { error } = await supabase
        .from('shelves')
        .insert([{
            code: data.code,
            capacity: data.capacity || 100,
        }])

    if (error) throw new Error(error.message)

    revalidatePath('/shelves')
    revalidatePath('/audit')
    return { success: true }
}

export async function deleteShelf(shelfId: string) {
    // First, unassign products from this shelf
    await supabase
        .from('products')
        .update({ shelf_id: null })
        .eq('shelf_id', shelfId)

    const { error } = await supabase
        .from('shelves')
        .delete()
        .eq('id', shelfId)

    if (error) throw new Error(error.message)

    revalidatePath('/shelves')
    revalidatePath('/inventory')
    return { success: true }
}

export async function getProductsByShelf(shelfId: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shelf_id', shelfId)
        .order('name')

    if (error) {
        console.error('Error fetching products by shelf:', error)
        return []
    }

    return (data as Product[]) || []
}
export async function getSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('key, value')

    if (error) {
        console.error('Error fetching settings:', error)
        return []
    }
    return data
}

export async function updateSettings(key: string, value: string) {
    const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw new Error(error.message)
    revalidatePath('/settings')
    return { success: true }
}

export async function fetchTrendyolProducts(page: number = 0, size: number = 50) {
    // 1. Get credentials from settings
    const settings = await getSettings()
    const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        return { error: 'Trendyol API bilgileri eksik. Ayarlar sayfasından doldurun.' }
    }

    // 2. Prepare auth header (Basic Auth: apiKey:apiSecret)
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        const response = await fetch(`https://api.trendyol.com/integration/product/sellers/${sellerId}/products?page=${page}&size=${size}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': `${sellerId} - SelfIntegration`
            }
        })

        const contentType = response.headers.get('content-type')

        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Trendyol Hatası (${response.status})`)
            } else {
                const text = await response.text()
                console.error('Trendyol HTML Error:', text)
                throw new Error(`Trendyol API bir hata sayfası döndürdü (HTTP ${response.status}). Bilgilerinizi kontrol edin.`)
            }
        }

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            return {
                success: true,
                products: data.content || [],
                totalElements: data.totalElements || 0,
                totalPages: data.totalPages || 0,
                page: data.page || 0,
                size: data.size || 50
            }
        } else {
            throw new Error('Trendyol API geçersiz bir yanıt döndürdü (JSON bekleniyordu).')
        }
    } catch (error: any) {
        console.error('Trendyol fetch error:', error)
        return { error: error.message || 'Trendyol ürünleri çekilemedi.' }
    }
}

export async function fetchAllTrendyolProducts() {
    let allProducts: any[] = []
    let currentPage = 0
    let totalPages = 1

    try {
        while (currentPage < totalPages) {
            const result = await fetchTrendyolProducts(currentPage, 100)
            if (result.error) throw new Error(result.error)

            allProducts = [...allProducts, ...(result.products || [])]
            totalPages = result.totalPages || 1
            currentPage++
        }
        return { success: true, products: allProducts }
    } catch (error: any) {
        console.error('Fetch all products error:', error)
        return { error: error.message || 'Ürünler çekilemedi.' }
    }
}
export async function syncTrendyolProducts() {
    try {
        // 1. Fetch ALL products using helper
        const result = await fetchAllTrendyolProducts()
        if (result.error) throw new Error(result.error)
        const allTrendyolProducts = result.products || []

        if (allTrendyolProducts.length === 0) {
            return { success: true, count: 0, message: 'Aktarılacak ürün bulunamadı.' }
        }

        // 2. Fetch current local products to avoid duplicates
        const { data: localProducts, error: fetchError } = await supabase
            .from('products')
            .select('barcode')

        if (fetchError) throw new Error(fetchError.message)
        const localBarcodes = new Set(localProducts?.map(p => p.barcode) || [])

        // 3. Filter products that don't exist locally
        const newProducts = allTrendyolProducts
            .filter((p: any) => !localBarcodes.has(p.barcode))
            .map((p: any) => ({
                name: p.title,
                barcode: p.barcode,
                quantity: 0,
                min_stock: 10,
                updated_at: new Date().toISOString()
            }))

        if (newProducts.length === 0) {
            return { success: true, count: 0, message: 'Tüm ürünler zaten yerel stokta mevcut.' }
        }

        // 4. Batch insert new products
        const { error: insertError } = await supabase
            .from('products')
            .insert(newProducts)

        if (insertError) throw new Error(insertError.message)

        revalidatePath('/inventory')
        revalidatePath('/low-stock')
        return { success: true, count: newProducts.length, message: `${newProducts.length} yeni ürün başarıyla aktarıldı.` }
    } catch (error: any) {
        console.error('Sync error:', error)
        return { error: error.message || 'Senkronizasyon sırasında bir hata oluştu.' }
    }
}

export async function updateDamagedStock(
    productId: string,
    quantityChange: number,
    type: 'DAMAGED_IN' | 'DAMAGED_OUT',
    fromMainStock: boolean = false
) {
    try {
        // 1. Get current product
        const { data: product } = await supabase
            .from('products')
            .select('id, quantity, damaged_quantity, shelf_id')
            .eq('id', productId)
            .single()

        if (!product) throw new Error('Product not found')

        let newQuantity = product.quantity
        let newDamagedQuantity = product.damaged_quantity

        if (type === 'DAMAGED_IN') {
            newDamagedQuantity += quantityChange
            if (fromMainStock) {
                newQuantity = Math.max(0, newQuantity - quantityChange)
            }
        } else {
            newDamagedQuantity = Math.max(0, newDamagedQuantity - quantityChange)
        }

        // 2. Update product
        const { error: updateError } = await supabase
            .from('products')
            .update({
                quantity: newQuantity,
                damaged_quantity: newDamagedQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)

        if (updateError) throw new Error(updateError.message)

        // 3. Log transaction
        const { error: logError } = await supabase
            .from('inventory_logs')
            .insert({
                product_id: productId,
                transaction_type: type,
                quantity_change: quantityChange,
                old_shelf_id: product.shelf_id,
                new_shelf_id: product.shelf_id,
                note: fromMainStock ? 'Sağlam stoktan hasarlıya aktarıldı' : null
            })

        if (logError) console.error('Error logging damaged transaction:', logError)

        revalidatePath('/inventory')
        revalidatePath('/low-stock')
        revalidatePath('/')
        return { success: true, newQuantity, newDamagedQuantity }
    } catch (error: any) {
        console.error('Update damaged stock error:', error)
        return { error: error.message || 'Hata oluştu.' }
    }
}

export async function updateProductMinStock(productId: string, minStock: number) {
    try {
        const { error } = await supabase
            .from('products')
            .update({
                min_stock: minStock,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)

        if (error) throw new Error(error.message)

        revalidatePath('/inventory')
        revalidatePath('/low-stock')
        revalidatePath('/trendyol/limits')
        revalidatePath('/')

        return { success: true }
    } catch (error: any) {
        console.error('Update min stock error:', error)
        return { error: error.message || 'Kritik limit güncellenemedi.' }
    }
}
export async function getTrendyolOrders(
    status?: string | string[],
    page: number = 0,
    size: number = 50,
    startDate?: number,
    endDate?: number
) {
    // 1. Get credentials
    const settings = await getSettings()
    const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        return { error: 'Trendyol API bilgileri eksik.' }
    }

    // 2. Auth header
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        let url = `https://api.trendyol.com/integration/order/sellers/${sellerId}/orders?page=${page}&size=${size}&orderByField=OrderDate&orderByDirection=DESC`

        if (startDate) url += `&startDate=${startDate}`
        if (endDate) url += `&endDate=${endDate}`

        if (status) {
            if (Array.isArray(status)) {
                // If multiple statuses, append each one
                status.forEach(s => {
                    url += `&status=${s}`
                })
            } else {
                url += `&status=${status}`
            }
        }


        console.log(`[Trendyol API] Fetching: ${url}`)
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': `${sellerId} - SelfIntegration`
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error(`[Trendyol API Error] ${response.status}:`, errorData)
            throw new Error(errorData.message || `Trendyol Hatası (${response.status})`)
        }

        const data = await response.json()
        let orders = data.content || []

        // Debug: Log first order to see full structure for return reasons
        if (orders.length > 0 && (status?.includes('Returned') || status?.includes('UnDelivered'))) {
            console.log('[Trendyol Orders] Sample Order Structure:', JSON.stringify(orders[0], null, 2))
        }

        console.log(`[Trendyol API] Success: Received ${orders.length} orders for chunk.`)



        return {
            success: true,
            orders,
            totalElements: data.totalElements || 0,
            totalPages: data.totalPages || 0,
            page: data.page || 0,
            size: data.size || 50
        }
    } catch (error: any) {
        console.error('Fetch Trendyol orders error:', error)
        return { error: error.message || 'Siparişler çekilemedi.' }
    }
}

export async function getTrendyolOrderDetail(orderNumber: string) {
    const settings = await getSettings()
    const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        return { error: 'Trendyol API bilgileri eksik.' }
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        const url = `https://api.trendyol.com/integration/order/sellers/${sellerId}/orders?orderNumber=${orderNumber}`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': `${sellerId} - SelfIntegration`
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Trendyol Hatası (${response.status})`)
        }

        const data = await response.json()
        const order = data.content?.[0]
        return { success: true, order }
    } catch (error: any) {
        console.error('Fetch Trendyol order detail error:', error)
        return { error: error.message || 'Sipariş detayı çekilemedi.' }
    }
}

export async function getTrendyolClaims(
    page: number = 0,
    size: number = 50,
    startDate?: number,
    endDate?: number
) {
    const settings = await getSettings()
    const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        return { error: 'Trendyol API bilgileri eksik.' }
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        // Fetch claims (returns)
        let url = `https://api.trendyol.com/integration/claims/sellers/${sellerId}/claims?page=${page}&size=${size}`

        if (startDate) url += `&startDate=${startDate}`
        if (endDate) url += `&endDate=${endDate}`

        console.log(`[Trendyol Claims] Fetching: ${url}`)


        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': `${sellerId} - SelfIntegration`
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Trendyol Hatası (${response.status})`)
        }

        const data = await response.json()

        // Debug: Log first claim to see full structure
        if (data.content && data.content.length > 0) {
            console.log('[Trendyol Claims] Sample Claim Structure:', JSON.stringify(data.content[0], null, 2))
        }

        return {
            success: true,
            claims: data.content || [],
            totalElements: data.totalElements || 0,
            totalPages: data.totalPages || 0
        }

    } catch (error: any) {
        console.error('Fetch Trendyol claims error:', error)
        return { error: error.message || 'İade talepleri çekilemedi.' }
    }
}

// Fetch available claim reasons (return reasons lookup table)
export async function getClaimReasons() {
    const settings = await getSettings()
    const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value
    const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value
    const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value

    if (!sellerId || !apiKey || !apiSecret) {
        return { error: 'Trendyol API bilgileri eksik.' }
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    try {
        const url = `https://api.trendyol.com/integration/claims/sellers/${sellerId}/claims/issue-reasons`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': `${sellerId} - SelfIntegration`
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Trendyol Hatası (${response.status})`)
        }

        const data = await response.json()
        console.log('[Trendyol] Claim Reasons:', JSON.stringify(data, null, 2))
        return { success: true, reasons: data }
    } catch (error: any) {
        console.error('Fetch claim reasons error:', error)
        return { error: error.message || 'İade sebepleri çekilemedi.' }
    }
}


export async function getExtendedTrendyolReturns(page: number = 0, size: number = 50) {
    const statuses = ['Returned', 'UnDelivered', 'Cancelled']
    let allOrders: any[] = []

    // Fetch in 14-day chunks, going back ~1 year (26 chunks)
    const CHUNK_SIZE_MS = 14 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const chunkIndices = Array.from({ length: 26 }, (_, i) => i)

    try {
        console.log(`[LiaBlancos] Starting Deep Scan (1 Year) for Returns & Claims...`)


        // 1. Fetch Orders in chunks
        const orderResults = await Promise.all(chunkIndices.map(chunkIdx => {
            const endDate = now - (chunkIdx * CHUNK_SIZE_MS)
            const startDate = endDate - CHUNK_SIZE_MS
            return getTrendyolOrders(statuses, 0, 100, startDate, endDate)
        }))

        // NOTE: Claims API disabled temporarily - returning "Service Unavailable"
        // TODO: Re-enable when Trendyol Claims API access is restored
        // const claimResults = await Promise.all(chunkIndices.map(chunkIdx => {
        //     const endDate = now - (chunkIdx * CHUNK_SIZE_MS)
        //     const startDate = endDate - CHUNK_SIZE_MS
        //     return getTrendyolClaims(0, 100, startDate, endDate)
        // }))

        // Process Orders - Extract return reason from lines
        orderResults.forEach(res => {
            if (res.success && res.orders) {
                // Map orders to include extracted return reasons from lines
                const ordersWithReasons = res.orders.map((order: any) => ({
                    ...order,
                    // Try to get return reason from multiple possible fields
                    extractedReturnReason:
                        order.lines?.[0]?.returnReasonName ||
                        order.lines?.[0]?.statusName ||
                        order.shipmentPackages?.[0]?.packageHistory?.slice(-1)[0]?.description ||
                        null
                }))
                allOrders = [...allOrders, ...ordersWithReasons]
            }
        })


        // NOTE: Claims processing disabled - API returning "Service Unavailable"
        // claimResults.forEach(res => {
        //     if (res.success && res.claims) {
        //         const unifiedClaims = res.claims.map((c: any) => ({
        //             ...c,
        //             orderNumber: c.orderNumber,
        //             orderDate: c.claimDate,
        //             status: 'Returned',
        //             customerFirstName: c.customerFirstName,
        //             customerLastName: c.customerLastName,
        //             totalPrice: c.totalPrice,
        //             claimReasonName: c.items?.[0]?.claimReason?.name || c.claimReasonName || c.claimReason?.name,
        //             lines: c.items?.map((item: any) => ({
        //                 ...item,
        //                 productName: item.productName || item.productTitle,
        //                 quantity: item.quantity || 1
        //             })) || []
        //         }))
        //         allOrders = [...allOrders, ...unifiedClaims]
        //     }
        // })


        // De-duplicate by orderNumber
        const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values())

        // Sort newest first
        uniqueOrders.sort((a: any, b: any) => {
            const dateA = typeof a.orderDate === 'number' ? a.orderDate : new Date(a.orderDate).getTime()
            const dateB = typeof b.orderDate === 'number' ? b.orderDate : new Date(b.orderDate).getTime()
            return dateB - dateA
        })

        const totalElements = uniqueOrders.length
        const totalPages = Math.ceil(totalElements / size)
        const paginatedOrders = uniqueOrders.slice(page * size, (page + 1) * size)

        console.log(`[LiaBlancos] Deep Scan Complete. Found ${totalElements} unique records.`)

        return {
            success: true,
            orders: paginatedOrders,
            totalElements,
            totalPages,
            page,
            size
        }
    } catch (error: any) {
        console.error('Extended returns error:', error)
        return { error: 'Genişletilmiş iade verileri çekilemedi.' }
    }
}
