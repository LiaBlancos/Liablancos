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
    }

    const settings = data || []

    // Fallback to environment variables if missing in DB
    const keys = [
        { db: 'trendyol_seller_id', env: 'TRENDYOL_SELLER_ID' },
        { db: 'trendyol_api_key', env: 'TRENDYOL_API_KEY' },
        { db: 'trendyol_api_secret', env: 'TRENDYOL_API_SECRET' }
    ]

    keys.forEach(({ db, env }) => {
        if (!settings.find(s => s.key === db) && process.env[env]) {
            settings.push({ key: db, value: process.env[env] as string })
        }
    })

    return settings
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

        // 2. Prepare data for upsert
        const upsertData = allTrendyolProducts.map((p: any) => ({
            trendyol_product_id: p.id,
            name: p.title,
            barcode: p.barcode,
            sku: p.stockCode,
            image_url: (p.images && p.images.length > 0)
                ? (typeof p.images[0] === 'string' ? p.images[0] : (p.images[0].url || null))
                : null,
            quantity: p.quantity,
            is_active: p.onSale,
            updated_at: new Date().toISOString()
        }))

        // 3. Upsert into products table (onConflict barcode)
        const { error: upsertError } = await supabase
            .from('products')
            .upsert(upsertData, { onConflict: 'barcode' })

        if (upsertError) throw new Error(upsertError.message)

        revalidatePath('/inventory')
        revalidatePath('/low-stock')
        revalidatePath('/urun-islemleri/toptancilar')

        return { success: true, count: upsertData.length, message: `${upsertData.length} ürün başarıyla senkronize edildi.` }
    } catch (error: any) {
        console.error('Sync error:', error)
        return { error: error.message || 'Senkronizasyon sırasında bir hata oluştu.' }
    }
}

// --- WHOLESALERS MANAGEMENT ---

export async function getWholesalers() {
    const { data, error } = await supabase
        .from('wholesalers')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching wholesalers:', error)
        return []
    }
    return data
}

export async function createWholesaler(data: { name: string; phone?: string; address?: string; note?: string }) {
    const { data: newWholesaler, error } = await supabase
        .from('wholesalers')
        .insert([data])
        .select()
        .single()

    if (error) {
        console.error('Error creating wholesaler:', error)
        return { error: error.message }
    }

    revalidatePath('/urun-islemleri/toptancilar')
    return { success: true, wholesaler: newWholesaler }
}

export async function updateWholesaler(id: string, data: Partial<{ name: string; phone: string; address: string; note: string; is_active: boolean }>) {
    const { error } = await supabase
        .from('wholesalers')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Error updating wholesaler:', error)
        return { error: error.message }
    }

    revalidatePath('/urun-islemleri/toptancilar')
    return { success: true }
}

export async function getWholesalePrices(productId?: string) {
    let query = supabase
        .from('wholesale_prices')
        .select('*, wholesalers(name, phone, address, note, is_active)')

    if (productId) {
        query = query.eq('product_id', productId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching wholesale prices:', error)
        return []
    }
    return data
}

export async function updateWholesalePrice(data: {
    product_id: string;
    wholesaler_id: string;
    buy_price: number;
    currency?: string;
    old_price?: number;
}) {
    const { data: { user } } = await supabase.auth.getUser()

    try {
        // 1. Get the SKU of the source product
        const { data: sourceProduct } = await supabase
            .from('products')
            .select('sku')
            .eq('id', data.product_id)
            .single()

        // 2. Find all products with the same SKU (if SKU exists)
        let productIds = [data.product_id]
        if (sourceProduct?.sku) {
            const { data: relatedProducts } = await supabase
                .from('products')
                .select('id')
                .eq('sku', sourceProduct.sku)

            if (relatedProducts) {
                productIds = relatedProducts.map(p => p.id)
            }
        }

        // 3. Upsert prices for all matching products
        const upsertData = productIds.map(pid => ({
            product_id: pid,
            wholesaler_id: data.wholesaler_id,
            buy_price: data.buy_price,
            currency: data.currency || 'TRY',
            last_updated_at: new Date().toISOString()
        }))

        const { error: priceError } = await supabase
            .from('wholesale_prices')
            .upsert(upsertData, { onConflict: 'product_id,wholesaler_id' })

        if (priceError) throw priceError

        // 4. Log changes for all matching products (if price changed)
        if (data.old_price === undefined || data.old_price !== data.buy_price) {
            const logData = productIds.map(pid => ({
                product_id: pid,
                wholesaler_id: data.wholesaler_id,
                old_price: data.old_price,
                new_price: data.buy_price,
                currency: data.currency || 'TRY',
                changed_by: user?.id
            }))

            await supabase
                .from('price_change_logs')
                .insert(logData)
        }

        revalidatePath('/urun-islemleri/toptancilar')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating SKU wholesale prices:', error)
        return { error: error.message }
    }
}

export async function toggleWholesalePriceStatus(productId: string, wholesalerId: string, currentStatus: boolean) {
    try {
        const { data: sourceProduct } = await supabase
            .from('products')
            .select('sku')
            .eq('id', productId)
            .single()

        let productIds = [productId]
        if (sourceProduct?.sku) {
            const { data: relatedProducts } = await supabase
                .from('products')
                .select('id')
                .eq('sku', sourceProduct.sku)
            if (relatedProducts) {
                productIds = relatedProducts.map(p => p.id)
            }
        }

        const { error } = await supabase
            .from('wholesale_prices')
            .update({ is_active: !currentStatus })
            .in('product_id', productIds)
            .eq('wholesaler_id', wholesalerId)

        if (error) throw error

        revalidatePath('/urun-islemleri/toptancilar')
        return { success: true }
    } catch (error: any) {
        console.error('Error toggling wholesale price status:', error)
        return { error: error.message }
    }
}

export async function deleteWholesalePrice(productId: string, wholesalerId: string) {
    try {
        // 1. Get the SKU of the source product
        const { data: sourceProduct } = await supabase
            .from('products')
            .select('sku')
            .eq('id', productId)
            .single()

        // 2. Find all products with the same SKU
        let productIds = [productId]
        if (sourceProduct?.sku) {
            const { data: relatedProducts } = await supabase
                .from('products')
                .select('id')
                .eq('sku', sourceProduct.sku)

            if (relatedProducts) {
                productIds = relatedProducts.map(p => p.id)
            }
        }

        // 3. Delete prices for all matching products
        const { error } = await supabase
            .from('wholesale_prices')
            .delete()
            .in('product_id', productIds)
            .eq('wholesaler_id', wholesalerId)

        if (error) throw error

        revalidatePath('/urun-islemleri/toptancilar')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting SKU wholesale prices:', error)
        return { error: error.message }
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
    const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value?.trim()
    const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value?.trim()
    const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value?.trim()

    if (!sellerId || !apiKey || !apiSecret) {
        console.error('[Trendyol API] Credentials missing in settings table!', { sellerId: !!sellerId, apiKey: !!apiKey, apiSecret: !!apiSecret })
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
            const errorText = await response.text();
            console.error(`[Trendyol API Error] ${response.status}:`, errorText);
            throw new Error(`Trendyol Hatası (${response.status}) ${errorText}`);
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

export async function syncTrendyolOrdersToDb() {
    try {
        const now = Date.now()
        const CHUNK_SIZE_MS = 13 * 24 * 60 * 60 * 1000 // Trendyol limit is 14 days (336 hours)
        const chunkIndices = Array.from({ length: 4 }, (_, i) => i)

        let savedCount = 0
        console.log('[LiaBlancos] Starting Chunked Order Sync...')

        for (const i of chunkIndices) {
            const endDate = now - (i * CHUNK_SIZE_MS)
            const startDate = endDate - CHUNK_SIZE_MS
            const result = await getTrendyolOrders(undefined, 0, 100, startDate, endDate)

            if (!result.success || !result.orders) {
                console.warn(`[LiaBlancos] Order sync chunk ${i} skipped: ${result.error}`)
                continue
            }

            for (const order of result.orders) {
                // IMPORTANT: One order can have multiple shipment packages
                const packages = order.shipmentPackages && order.shipmentPackages.length > 0
                    ? order.shipmentPackages
                    : [{ id: null }] // Fallback if no packages listed

                for (const pkgInfo of packages) {
                    // FIX: If package ID is null, use Order Number to prevent duplicate rows on upsert
                    // Postgres unique constraints treat NULLs as distinct, causing duplicates.
                    const shipmentPackageId = pkgInfo.id?.toString() || order.orderNumber.toString()

                    const { data: pkg, error: pkgError } = await supabase
                        .from('shipment_packages')
                        .upsert({
                            order_number: order.orderNumber,
                            shipment_package_id: shipmentPackageId,
                            customer_name: `${order.customerFirstName} ${order.customerLastName}`,
                            total_price: order.totalPrice,
                            order_date: new Date(order.orderDate).toISOString(),
                            status: order.status,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'shipment_package_id' })
                        .select('id')
                        .maybeSingle()

                    if (pkgError) {
                        console.error(`[LiaBlancos] Error upserting package ${shipmentPackageId} for order ${order.orderNumber}:`, pkgError)
                        continue
                    }

                    if (pkg && order.lines) {
                        await supabase.from('shipment_package_items').delete().eq('package_id', pkg.id)
                        const items = order.lines.map((line: any) => ({
                            package_id: pkg.id,
                            barcode: line.barcode,
                            product_name: line.productName,
                            quantity: line.quantity,
                            price: line.price
                        }))
                        await supabase.from('shipment_package_items').insert(items)
                    }
                    savedCount++
                }
            }
        }

        console.log(`[LiaBlancos] Orders Sync Complete. Saved ${savedCount} packages.`)
        return { success: true, count: savedCount }
    } catch (error: any) {
        console.error('syncTrendyolOrdersToDb error:', error)
        return { error: error.message }
    }
}

export async function syncTrendyolPayments() {
    const runAt = new Date().toISOString()
    let log = {
        pulled_count: 0,
        matched_count: 0,
        paid_count: 0,
        unpaid_count: 0,
        unmatched_count: 0,
        error: null as string | null
    }

    try {
        // 1. Sync orders first
        const orderSync = await syncTrendyolOrdersToDb()
        if (orderSync.error) {
            throw new Error(`Sipariş senkronizasyonu hatası: ${orderSync.error}`)
        }

        // 2. Get credentials and trim
        const settings = await getSettings()
        const sellerId = settings.find(s => s.key === 'trendyol_seller_id')?.value?.trim()
        const apiKey = settings.find(s => s.key === 'trendyol_api_key')?.value?.trim()
        const apiSecret = settings.find(s => s.key === 'trendyol_api_secret')?.value?.trim()

        if (!sellerId || !apiKey || !apiSecret) {
            throw new Error('Trendyol API bilgileri eksik.')
        }

        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
        const now = Date.now()
        const CHUNK_SIZE_MS = 7 * 24 * 60 * 60 * 1000 // Very safe 7 days
        const chunkIndices = Array.from({ length: 12 }, (_, i) => i) // 84 days
        let allTransactions: any[] = []

        console.log(`[LiaBlancos] Starting Conservative Payment Sync (84 days, 7-day chunks)...`)

        for (const i of chunkIndices) {
            const endDate = now - (i * CHUNK_SIZE_MS)
            const startDate = endDate - CHUNK_SIZE_MS
            const url = `https://api.trendyol.com/integration/finance/sellers/${sellerId}/settlements?startDate=${startDate}&endDate=${endDate}&size=1000`

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'User-Agent': `${sellerId} - SelfIntegration`
                }
            })

            if (response.ok) {
                const data = await response.json()
                if (data.content) {
                    console.log(`[LiaBlancos] Finance Chunk ${i + 1} Pulled: ${data.content.length}`)
                    allTransactions = [...allTransactions, ...data.content]
                }
            } else {
                const errorBody = await response.text()
                console.error(`[LiaBlancos] Finance API Error (Chunk ${i}): ${response.status} - ${errorBody}`)
                log.error = `API Error ${response.status}: ${errorBody}`
            }
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        const transactions = allTransactions
        log.pulled_count = transactions.length
        console.log(`[LiaBlancos] Total Transactions Pulled: ${log.pulled_count}`)

        for (const tx of transactions) {
            const shipmentPackageId = tx.shipmentPackageId?.toString()
            const orderNumber = tx.orderNumber?.toString()
            const amount = tx.transactionAmount
            const reference = tx.transactionId?.toString()

            console.log(`[LiaBlancos] Processing TX: ${reference}, Package: ${shipmentPackageId}, Order: ${orderNumber}`)

            // Try to find by shipmentPackageId
            let pkgFound = false
            if (shipmentPackageId) {
                const { data: pkg } = await supabase
                    .from('shipment_packages')
                    .select('id, payment_status')
                    .eq('shipment_package_id', shipmentPackageId)
                    .maybeSingle()

                if (pkg) {
                    pkgFound = true
                    console.log(`[LiaBlancos] Match Found (Package ID): ${shipmentPackageId}`)
                    await supabase.from('shipment_packages').update({
                        payment_status: 'paid',
                        paid_at: new Date(tx.transactionDate).toISOString(),
                        paid_amount: amount,
                        payment_reference: reference,
                        payment_last_checked_at: runAt,
                        updated_at: new Date().toISOString()
                    }).eq('id', pkg.id)
                    log.matched_count++
                    log.paid_count++
                }
            }

            // If not found, try by orderNumber
            if (!pkgFound && orderNumber) {
                const { data: pkg } = await supabase
                    .from('shipment_packages')
                    .select('id, payment_status')
                    .eq('order_number', orderNumber)
                    .maybeSingle()

                if (pkg) {
                    pkgFound = true
                    console.log(`[LiaBlancos] Match Found (Order No): ${orderNumber}`)
                    await supabase.from('shipment_packages').update({
                        payment_status: 'paid',
                        paid_at: new Date(tx.transactionDate).toISOString(),
                        paid_amount: amount,
                        payment_reference: reference,
                        payment_last_checked_at: runAt,
                        updated_at: new Date().toISOString()
                    }).eq('id', pkg.id)
                    log.matched_count++
                    log.paid_count++
                }
            }

            // If still not found, save to unmatched
            if (!pkgFound) {
                await supabase.from('unmatched_payments').upsert({
                    shipment_package_id: shipmentPackageId,
                    order_number: orderNumber,
                    transaction_date: new Date(tx.transactionDate).toISOString(),
                    amount: amount,
                    payment_reference: reference,
                    raw_data: tx
                }, { onConflict: 'payment_reference' })
                log.unmatched_count++
            }
        }

        // Count unpaid
        const { count: unpaidCount } = await supabase
            .from('shipment_packages')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'unpaid')

        log.unpaid_count = unpaidCount || 0

        // Save log
        await supabase.from('payment_sync_logs').insert({
            run_at: runAt,
            ...log
        })

        revalidatePath('/finans/odemeler')
        return { success: true, log }
    } catch (error: any) {
        console.error('syncTrendyolPayments error:', error)
        log.error = error.message
        await supabase.from('payment_sync_logs').insert({
            run_at: runAt,
            ...log
        })
        return { error: error.message }
    }
}

export async function getPaymentStats() {
    try {
        const { count: paidCount } = await supabase
            .from('shipment_packages')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'paid')

        const { count: unpaidCount } = await supabase
            .from('shipment_packages')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'unpaid')

        const { data: lastLog } = await supabase
            .from('payment_sync_logs')
            .select('run_at, error')
            .order('run_at', { ascending: false })
            .limit(1)

        return {
            paid: paidCount || 0,
            unpaid: unpaidCount || 0,
            last_checked: lastLog?.[0]?.run_at || null,
            last_error: lastLog?.[0]?.error || null
        }
    } catch (e) {
        return { paid: 0, unpaid: 0, last_checked: null, last_error: null }
    }
}

export async function getShipmentPackages(filter: 'all' | 'paid' | 'unpaid' = 'all') {
    try {
        let query = supabase
            .from('shipment_packages')
            .select(`
                *,
                shipment_package_items (*)
            `)
            .order('order_date', { ascending: false })

        if (filter === 'paid') query = query.eq('payment_status', 'paid')
        if (filter === 'unpaid') query = query.eq('payment_status', 'unpaid')

        const { data, error } = await query

        if (error) throw error
        return data as any[]
    } catch (e) {
        console.error('getShipmentPackages error:', e)
        return []
    }
}

export async function resetDatabase() {
    try {
        console.log('[LiaBlancos] Resetting database...')
        // Delete child items first to avoid FK constraint issues
        await supabase.from('shipment_package_items').delete().neq('id', 0) // Delete all

        // Delete packages
        await supabase.from('shipment_packages').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all UUIDs

        // Delete unmatched payments
        await supabase.from('unmatched_payments').delete().neq('id', 0)

        // Delete logs
        await supabase.from('payment_sync_logs').delete().neq('id', 0)

        revalidatePath('/finans/odemeler')
        return { success: true }
    } catch (error: any) {
        console.error('resetDatabase error:', error)
        return { error: error.message }
    }
}

// ------ EXCEL IMPORT (Trendyol Payments) ------
import * as XLSX from 'xlsx'

export async function importPaymentExcel(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error('Dosya yüklenemedi.')

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        let processed = 0
        let matched = 0
        const runAt = new Date().toISOString()

        // Log import start
        const { data: importLog, error: logError } = await supabase
            .from('payment_imports')
            .insert({ filename: file.name })
            .select()
            .single()

        if (logError) console.error('Import log error:', logError)

        console.log(`[Excel Import] Processing ${jsonData.length} rows...`)

        for (const r of jsonData) {
            const row = r as any
            // Adjust these keys based on actual Trendyol Excel headers
            // Assuming common headers: "Sipariş Numarası", "İşlem Tarihi", "Tutar", "İşlem Numarası" etc.
            // We'll try to support a few variations or use loose matching

            const orderNumber = row['Sipariş Numarası']?.toString() || row['Sipariş No']?.toString() || row['Order Number']?.toString()
            const packageId = row['Paket Numarası']?.toString() || row['Paket No']?.toString() || row['Shipment Package ID']?.toString()
            const amount = row['Tutar'] || row['Amount'] || row['Ödenen Tutar']
            const date = row['İşlem Tarihi'] || row['Transaction Date'] || row['Tarih']
            const ref = row['İşlem Numarası'] || row['Transaction ID'] || row['Referans'] || `EXCEL-${Date.now()}-${Math.random()}`

            if (!orderNumber && !packageId) continue // Skip invalid rows

            processed++
            let found = false

            // Strategy 1: Match by Order Number (Preferred)
            if (orderNumber) {
                const { data: pkgs } = await supabase
                    .from('shipment_packages')
                    .select('id')
                    .eq('order_number', orderNumber)

                if (pkgs && pkgs.length > 0) {
                    // Update ALL packages for this order as paid (since payment is usually per order)
                    // Or if specific amount match is needed, we might need logic.
                    // For now, mark all as paid if order matches.
                    await supabase.from('shipment_packages').update({
                        payment_status: 'paid',
                        paid_at: new Date(date).toISOString(),
                        paid_amount: amount, // Note: This applies total amount to each package? Ideally split, but usually acceptable for status tracking
                        payment_reference: ref,
                        payment_source: 'excel',
                        payment_last_checked_at: runAt,
                        updated_at: runAt
                    }).eq('order_number', orderNumber)

                    matched += pkgs.length // specific packages updated
                    found = true
                }
            }

            // Strategy 2: Match by Package ID (Fallback)
            if (!found && packageId) {
                const { data: pkg } = await supabase
                    .from('shipment_packages')
                    .select('id')
                    .eq('shipment_package_id', packageId)
                    .maybeSingle()

                if (pkg) {
                    await supabase.from('shipment_packages').update({
                        payment_status: 'paid',
                        paid_at: new Date(date).toISOString(),
                        paid_amount: amount,
                        payment_reference: ref,
                        payment_source: 'excel',
                        payment_last_checked_at: runAt,
                        updated_at: runAt
                    }).eq('id', pkg.id)
                    matched++
                    found = true
                }
            }

            // Log unmatched
            if (!found) {
                await supabase.from('unmatched_payments').upsert({
                    order_number: orderNumber,
                    shipment_package_id: packageId,
                    transaction_date: date ? new Date(date).toISOString() : new Date().toISOString(),
                    amount: amount,
                    payment_reference: ref + '-EXCEL',
                    raw_data: row
                }, { onConflict: 'payment_reference' })
            }
        }

        // Update log
        if (importLog) {
            await supabase.from('payment_imports').update({
                processed_count: processed,
                matched_count: matched
            }).eq('id', importLog.id)
        }

        revalidatePath('/finans/odemeler')
        return { success: true, processed, matched, unmatched: processed - matched }

    } catch (error: any) {
        console.error('Excel import error:', error)
        return { error: error.message }
    }
}

export async function importOrderExcel(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error('Dosya yüklenemedi.')

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        let processedCount = 0
        const orders = new Map<string, {
            orderNumber: string
            packageId: string | null
            customerName: string
            totalPrice: number
            orderDate: string
            deliveryDate: string | null
            status: string
            dueAt: string | null
            items: any[]
        }>()

        console.log(`[Order Excel Import] Processing ${jsonData.length} rows...`)

        // 1. Group rows by Order Number (UNIQUE KEY)
        for (const r of jsonData) {
            const row = r as any
            const orderNumber = row['Sipariş Numarası']?.toString() || row['Order Number']?.toString()
            if (!orderNumber) continue // Skip rows without order number

            const packageId = row['Paket No']?.toString() || row['Paket Numarası']?.toString() || null
            const status = row['Sipariş Statüsü'] || row['Satır Statüsü'] || row['Status'] || ''
            const deliveryDate = row['Teslim Tarihi'] || row['Delivery Date'] || null

            // Item details
            const productName = row['Ürün Adı'] || row['Product Name'] || ''
            const barcode = row['Barkod'] || row['Barcode'] || ''
            const quantity = parseInt(row['Adet'] || row['Quantity'] || '1')
            const price = parseFloat(row['Satış Tutarı'] || row['Birim Satış Fiyatı (KDV Dahil)'] || row['Price'] || '0')
            const customer = row['Müşteri Adı'] || row['Customer Name'] || ''
            const orderDate = row['Sipariş Tarihi'] || row['Order Date'] || new Date().toISOString()
            const total = parseFloat(row['Sipariş Tutarı'] || row['Order Total'] || '0')

            // Calculate due_at if order is delivered
            let dueAt: string | null = null
            if (deliveryDate && (status === 'Teslim Edildi' || status === 'Delivered' || status.includes('Teslim'))) {
                const deliveryDateObj = new Date(deliveryDate)
                deliveryDateObj.setDate(deliveryDateObj.getDate() + 28) // Add 28 days
                dueAt = deliveryDateObj.toISOString()
            }

            if (!orders.has(orderNumber)) {
                orders.set(orderNumber, {
                    orderNumber,
                    packageId,
                    customerName: customer,
                    totalPrice: total,
                    orderDate: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString(),
                    deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
                    status,
                    dueAt,
                    items: []
                })
            } else {
                // Update delivery info if this row has more recent data
                const existing = orders.get(orderNumber)!
                if (deliveryDate && !existing.deliveryDate) {
                    existing.deliveryDate = new Date(deliveryDate).toISOString()
                    existing.status = status
                    existing.dueAt = dueAt
                }
            }

            // Add item to order
            if (productName) {
                orders.get(orderNumber)?.items.push({
                    product_name: productName,
                    barcode: barcode,
                    quantity: quantity,
                    price: price
                })
            }
        }

        console.log(`[Order Excel Import] Found ${orders.size} unique orders. Saving...`)

        // 2. Save to DB - Upsert by order_number
        for (const [orderNum, data] of orders) {
            // Upsert Order - use order_number as unique key
            const { data: existingOrders } = await supabase
                .from('shipment_packages')
                .select('id')
                .eq('order_number', orderNum)
                .maybeSingle()

            let orderId: string

            if (existingOrders) {
                // Update existing order
                const { data: updated } = await supabase
                    .from('shipment_packages')
                    .update({
                        shipment_package_id: data.packageId,
                        customer_name: data.customerName,
                        total_price: data.totalPrice,
                        order_date: data.orderDate,
                        delivery_date: data.deliveryDate,
                        status: data.status,
                        due_at: data.dueAt,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingOrders.id)
                    .select('id')
                    .single()

                orderId = existingOrders.id
            } else {
                // Insert new order
                const { data: inserted } = await supabase
                    .from('shipment_packages')
                    .insert({
                        order_number: data.orderNumber,
                        shipment_package_id: data.packageId,
                        customer_name: data.customerName,
                        total_price: data.totalPrice,
                        order_date: data.orderDate,
                        delivery_date: data.deliveryDate,
                        status: data.status,
                        due_at: data.dueAt,
                        payment_status: 'unpaid'
                    })
                    .select('id')
                    .single()

                if (!inserted) continue
                orderId = inserted.id
            }

            // Replace items
            if (data.items.length > 0) {
                await supabase.from('shipment_package_items').delete().eq('package_id', orderId)

                const itemsToInsert = data.items.map(item => ({
                    package_id: orderId,
                    ...item
                }))

                await supabase.from('shipment_package_items').insert(itemsToInsert)
            }

            processedCount++
        }

        revalidatePath('/finans/odemeler')
        return { success: true, count: processedCount }

    } catch (error: any) {
        console.error('Order Excel import error:', error)
        return { error: error.message }
    }
}

export async function getUnmatchedPayments() {
    try {
        const { data, error } = await supabase
            .from('unmatched_payments')
            .select('*')
            .order('transaction_date', { ascending: false })

        if (error) throw error
        return data as any[]
    } catch (e) {
        console.error('getUnmatchedPayments error:', e)
        return []
    }
}
