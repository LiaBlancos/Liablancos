'use server'

import { supabase } from './supabase'
import { Product, Shelf, InventoryLog, FinanceOrder, FinancePaymentRow, ImportResult, FinanceUploadLog } from '@/types'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

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

// ------ FINANCE ACTIONS (EXCEL BASED) ------

// TR Format Parsers
function parseTRDate(value: any): string | null {
    if (!value) return null
    if (value instanceof Date) return value.toISOString()

    if (typeof value === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
        return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000).toISOString()
    }

    if (typeof value === 'string') {
        const str = value.trim()
        if (!str) return null

        // Match DD.MM.YYYY or DD.MM.YYYY HH:mm
        const parts = str.split(/[\s.]+/)
        if (parts.length >= 3) {
            const day = parseInt(parts[0])
            const month = parseInt(parts[1])
            const year = parseInt(parts[2])
            let hh = 0, mm = 0
            if (parts.length >= 5) {
                const timeParts = parts[3].includes(':') ? parts[3].split(':') : [parts[3], parts[4]]
                hh = parseInt(timeParts[0]) || 0
                mm = parseInt(timeParts[1]) || 0
            } else if (str.includes(':')) {
                const timeStr = str.split(' ')[1]
                if (timeStr) {
                    const timeParts = timeStr.split(':')
                    hh = parseInt(timeParts[0]) || 0
                    mm = parseInt(timeParts[1]) || 0
                }
            }
            const date = new Date(year, month - 1, day, hh, mm)
            if (!isNaN(date.getTime())) return date.toISOString()
        }
    }
    return null
}

function parseTRNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value

    // Convert to string and clean
    let str = value.toString().trim()
    if (!str) return 0

    // Remove currency symbols if any (TL, $, etc) - simplified
    str = str.replace(/[₺$€£]/g, '').trim()

    // Turkish format: 1.234,56
    // If it contains both . and , -> Remove . and replace , with .
    if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.')
    }
    // If it only contains , -> Replace with .
    else if (str.includes(',')) {
        str = str.replace(',', '.')
    }
    // If it only contains . -> Usually in Excel if it is 119.000 it might be thousands.
    // However, without a comma, it's ambiguous. 
    // Usually Excel exports 119000 without dots if it's a number, 
    // but if it's formatted text it might be 119.000.
    // If there is only a dot and it is followed by 3 digits at the end, 
    // we should treat it as thousands separator for TR context.
    else if (str.includes('.')) {
        const parts = str.split('.')
        // If multiple dots, definitely thousands separator (e.g. 1.000.000)
        if (parts.length > 2) {
            str = str.replace(/\./g, '')
        }
        else if (parts.length === 2 && parts[1].length === 3) {
            str = str.replace(/\./g, '')
        }
    }

    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
}

function calculateExpectedPayout(dueAtStr: string | null): string | null {
    if (!dueAtStr) return null
    const dueAt = new Date(dueAtStr)
    const day = dueAt.getDay() // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat

    const payout = new Date(dueAt)
    let daysToAdd = 0

    if (day === 1 || day === 4) {
        daysToAdd = 0
    } else if (day === 2) {
        daysToAdd = 2 // Thu
    } else if (day === 3) {
        daysToAdd = 1 // Thu
    } else if (day === 5) {
        daysToAdd = 3 // Mon
    } else if (day === 6) {
        daysToAdd = 2 // Mon
    } else if (day === 0) {
        daysToAdd = 1 // Mon
    }

    payout.setDate(payout.getDate() + daysToAdd)
    return payout.toISOString()
}

// Helper for normalization
function normalizeOrderId(id: any): string | null {
    if (!id) return null
    return id.toString().replace(/\D/g, '').trim()
}

export async function importFinanceOrdersExcel(formData: FormData): Promise<ImportResult> {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error('Dosya seçilmedi.')

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        let processed = 0, updated = 0, inserted = 0
        const rows = jsonData as any[]
        const orderNumbers = Array.from(new Set(rows.map(r => r['Sipariş Numarası']?.toString().trim()).filter(Boolean)))

        // 1. Fetch existing orders to distinguish inserted/updated
        const { data: existingOrders } = await supabase
            .from('finance_orders')
            .select('order_number')
            .in('order_number', orderNumbers)

        const existingSet = new Set(existingOrders?.map(o => o.order_number) || [])

        // 2. Prepare bulk upsert data
        const orderMap = new Map<string, any>()

        for (const row of rows) {
            // Normalize Order Number for consistency with payment matching
            const rawOrderNo = row['Sipariş Numarası']
            const orderNumber = normalizeOrderId(rawOrderNo)
            if (!orderNumber) continue

            // Normalize Package Number
            const rawPackageNo = row['Paket No']
            const packageNo = normalizeOrderId(rawPackageNo)

            const saleTotal = parseTRNumber(row['Satış Tutarı'])
            const quantity = parseInt(row['Adet'] || '0')

            if (!orderMap.has(orderNumber)) {
                const deliveredAtRaw = row['Teslim Tarihi']
                const deliveredAt = parseTRDate(deliveredAtRaw)
                let dueAt: string | null = null
                let expectedPayoutAt: string | null = null
                if (deliveredAt) {
                    const d = new Date(deliveredAt)
                    d.setDate(d.getDate() + 28)
                    dueAt = d.toISOString()
                    expectedPayoutAt = calculateExpectedPayout(dueAt)
                }

                orderMap.set(orderNumber, {
                    order_number: orderNumber,
                    package_no: packageNo,
                    barcode: row['Barkod']?.toString() || null,
                    product_name: row['Ürün Adı']?.toString() || null,
                    quantity,
                    sale_total: saleTotal,
                    order_date: parseTRDate(row['Sipariş Tarihi']),
                    order_status: row['Sipariş Statüsü']?.toString() || null,
                    delivered_at: deliveredAt,
                    due_at: dueAt,
                    expected_payout_at: expectedPayoutAt,
                    updated_at: new Date().toISOString()
                })
            } else {
                const prev = orderMap.get(orderNumber)
                prev.sale_total += saleTotal
                prev.quantity += quantity
                // Append product name if different
                const newProd = row['Ürün Adı']?.toString()
                if (newProd && prev.product_name && !prev.product_name.includes(newProd)) {
                    prev.product_name += `, ${newProd}`
                }
            }
        }

        const upsertArray = Array.from(orderMap.values()).map(o => {
            if (existingSet.has(o.order_number)) {
                updated++
            } else {
                o.payment_status = 'unpaid'
                inserted++
            }
            processed++
            return o
        })

        // Chunk upsert to avoid large payloads
        const chunkSize = 100
        for (let i = 0; i < upsertArray.length; i += chunkSize) {
            const chunk = upsertArray.slice(i, i + chunkSize)
            const { error: upsertError } = await supabase
                .from('finance_orders')
                .upsert(chunk, { onConflict: 'order_number' })
            if (upsertError) throw upsertError
        }

        // 3. Retroactive Matching (Bulk)
        const { data: unmatchedPayments } = await supabase
            .from('unmatched_payment_rows')
            .select('*')
            .in('order_number', orderNumbers)

        if (unmatchedPayments && unmatchedPayments.length > 0) {
            const matchTasks = unmatchedPayments.map(unmatched => {
                return (async () => {
                    // Update the order status
                    await supabase.from('finance_orders').update({
                        payment_status: 'paid',
                        paid_at: unmatched.paid_at,
                        paid_amount: unmatched.paid_amount,
                        commission_amount: unmatched.commission_amount || 0,
                        discount_amount: unmatched.discount_amount || 0,
                        penalty_amount: unmatched.penalty_amount || 0,
                        payment_reference: unmatched.raw_row_json?.['Ekstre Referans No'] || unmatched.raw_row_json?.['Kayıt No'] || null,
                        updated_at: new Date().toISOString()
                    }).eq('order_number', unmatched.order_number)

                    // IMPORTANT: Move detail row to history
                    await supabase.from('finance_payment_rows').insert({
                        order_number: unmatched.order_number,
                        package_no: unmatched.package_no || null,
                        paid_at: unmatched.paid_at,
                        amount: unmatched.paid_amount,
                        commission: Math.abs(unmatched.commission_amount || 0),
                        discount: Math.abs(unmatched.discount_amount || 0),
                        penalty: Math.abs(unmatched.penalty_amount || 0),
                        transaction_type: unmatched.raw_row_json?.['İşlem Tipi'] || null,
                        raw_row_json: unmatched.raw_row_json,
                        created_at: new Date().toISOString()
                    })

                    // Remove from unmatched
                    await supabase.from('unmatched_payment_rows').delete().eq('id', unmatched.id)
                })()
            })
            // Run matching tasks in parallel chunks
            for (let i = 0; i < matchTasks.length; i += 50) {
                await Promise.all(matchTasks.slice(i, i + 50))
            }
        }



        revalidatePath('/finans/odemeler')

        // Log success
        await supabase.from('finance_upload_logs').insert({
            filename: file.name,
            upload_type: 'orders',
            processed_count: processed,
            updated_count: updated,
            inserted_count: inserted,
            status: 'success'
        })

        return { success: true, processed, updated, inserted }
    } catch (e: any) {
        console.error('importFinanceOrdersExcel error:', e)

        // Log error if file was selected
        const file = formData.get('file') as File
        if (file) {
            await supabase.from('finance_upload_logs').insert({
                filename: file.name,
                upload_type: 'orders',
                status: 'error',
                error_message: e.message
            })
        }

        return { success: false, error: e.message }
    }
}

export async function importFinancePaymentsExcel(formData: FormData): Promise<ImportResult> {
    try {
        const file = formData.get('file') as File
        if (!file) throw new Error('Dosya seçilmedi.')

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const rows = jsonData as any[]
        const historyInserts: any[] = []
        // Key is now OrderNumber + PackageNo
        const aggregated = new Map<string, {
            orderNumber: string,
            net: number,
            commission: number,
            discount: number,
            penalty: number,
            paidAt: string | null,
            ref: string | null,
            packageNo: string | null
        }>()

        for (const row of rows) {
            // Normalize Order Number immediately
            const rawOrderNo = row['Sipariş No'] || row['Alt Sipariş No'] || row['Sipariş Numarası']
            const orderNumber = normalizeOrderId(rawOrderNo)

            if (!orderNumber) continue

            // Normalize Package Number
            const rawPackageNo = row['Paket Numarası'] || row['Paket No']
            const packageNo = normalizeOrderId(rawPackageNo)

            // 1. Precise Column Mapping per User Request
            // "Toplam Tutar" -> gross_amount
            // "TY Hakediş" -> ty_commission
            // "Satıcı Hakediş" -> net_amount

            let gross = parseTRNumber(row['Toplam Tutar'] || row['Brüt Tutar'] || row['Tutar'] || row['Satış Tutarı'] || 0)
            const commission = parseTRNumber(row['TY Hakediş'] || row['Komisyon Tutarı'] || row['Komisyon'] || row['KOMİSYON'] || 0)
            const discount = parseTRNumber(row['Pazaryeri İndirimi'] || row['İndirim'] || 0)

            // Explicit Net columns first
            let net = parseTRNumber(row['Satıcı Hakediş'] || row['Net Tutar'] || row['Net Hakediş'] || 0)

            // If Gross is 0 but Net is provided, back-calculate Gross
            // Gross = Net + Commission + Discount + Penalty
            // (Penalty is tricky because it might be part of the net deduction)

            const paidAt = parseTRDate(row['İşlem Tarihi'] || row['Vade Tarihi'])
            // packageNo already normalized above
            const ref = row['Kayıt No'] || row['Fatura No'] || row['Ödeme Referans No'] || row['Ekstre Referans No'] || null

            const rawType = (row['İşlem Tipi'] || row['islem_tipi'] || '').toString()
            const typeLower = rawType.toLowerCase()

            // Identify penalty/cuts 
            // If the row type explicitly says "Ceza" or "Kesinti", the Net amount is likely the penalty (negative or positive depending on context)
            let penalty = 0
            if (typeLower.includes('ceza') || typeLower.includes('kesinti')) {
                // Usually these rows have a 'Tutar' which is the penalty amount.
                // If gross is present, use it as penalty base.
                penalty = Math.abs(gross || net)
            } else {
                penalty = parseTRNumber(row['Ceza Tutarı'] || row['Ceza'] || 0)
            }

            // If we didn't find specific Net column, calculate it
            if (net === 0 && (row['Satıcı Hakediş'] === undefined && row['Net Tutar'] === undefined && row['Net Hakediş'] === undefined)) {
                net = gross - commission - discount - penalty
            }

            // If Gross is still 0 but we have Net, back-fill Gross for consistency
            if (gross === 0 && net !== 0) {
                gross = net + commission + discount + penalty
            }

            // Auto-negate gross amount for specific transaction types if they are positive but should be deductions
            // This is purely for UI display logic matching the user's "negative representation" requirement
            if (gross > 0) {
                if (typeLower.includes('iptal') ||
                    typeLower.includes('iade') ||
                    typeLower.includes('indirim') ||
                    typeLower.includes('ceza') ||
                    typeLower.includes('kesinti')) {
                    gross = -gross
                }
            }

            // 2. Add to history (Every unique row from Excel)
            historyInserts.push({
                order_number: orderNumber,
                package_no: packageNo,
                paid_at: paidAt,
                amount: gross,
                commission: commission,
                discount: discount,
                penalty: penalty,
                transaction_type: rawType,
                raw_row_json: row,
                created_at: new Date().toISOString()
            })

            // 3. Aggregate for the summary update
            // KEY: OrderNumber + PackageNo
            const key = `${orderNumber}_${packageNo || 'HEAD'}`

            if (!aggregated.has(key)) {
                aggregated.set(key, {
                    orderNumber,
                    net,
                    commission,
                    discount,
                    penalty,
                    paidAt,
                    ref,
                    packageNo
                })
            } else {
                const prev = aggregated.get(key)!
                prev.net += net
                prev.commission += commission
                prev.discount += discount
                prev.penalty += penalty
                if (!prev.packageNo) prev.packageNo = packageNo
                if (!prev.ref) prev.ref = ref
            }
        }

        let processed = rows.length, matched = 0, unmatched = 0
        const items = Array.from(aggregated.entries())
        const orderNumbers = items.map(([, val]) => val.orderNumber)

        // Find targets
        const { data: potentialOrders } = await supabase
            .from('finance_orders')
            .select('id, order_number, package_no, payment_status, payment_reference')
            .in('order_number', orderNumbers)

        // Map by Order_Package
        const orderIdMap = new Map<string, any>()
        potentialOrders?.forEach(o => {
            // Apply normalization to DB data for consistent matching
            const nOrder = normalizeOrderId(o.order_number)
            const nPackage = normalizeOrderId(o.package_no)
            if (nOrder) {
                const k = `${nOrder}_${nPackage || 'HEAD'}`
                orderIdMap.set(k, o)
            }
        })

        const updateTasks: Promise<any>[] = []
        const unmatchedInserts: any[] = []

        for (const [key, item] of items) {
            let targetOrder = orderIdMap.get(key)

            console.log(`[PAYMENT DEBUG] Processing key: ${key}, orderNumber: ${item.orderNumber}, packageNo: ${item.packageNo}`)

            // PRIORITY: Fallback to Order Number only if strict key match fails
            if (!targetOrder) {
                // Try strictly by Order Number (normalized)
                targetOrder = potentialOrders?.find(o => normalizeOrderId(o.order_number) === item.orderNumber)
                if (targetOrder) {
                    console.log(`[PAYMENT DEBUG] ✓ Fallback match found for ${item.orderNumber} -> DB order: ${targetOrder.order_number}, DB package: ${targetOrder.package_no}`)
                } else {
                    console.log(`[PAYMENT DEBUG] ✗ No match found for ${item.orderNumber}`)
                }
            } else {
                console.log(`[PAYMENT DEBUG] ✓ Exact match found for ${key}`)
            }

            if (targetOrder) {
                const task = (async () => {
                    // Recalculate everything from DB history for this SPECIFIC order+package
                    let query = supabase
                        .from('finance_payment_rows')
                        .select('amount, commission, discount, penalty')
                        .eq('order_number', item.orderNumber)

                    if (item.packageNo) {
                        query = query.eq('package_no', item.packageNo)
                    } else {
                        // If no packageNo in aggregation, handle carefully. 
                        // Usually if aggregated item has no packageNo, targetOrder likely has no packageNo too (HEAD).
                        // Or matched by orderNumber alone if we weren't careful.
                        // But here we matched by exact key.
                        query = query.is('package_no', null)
                    }

                    const { data: rowsInDb } = await query

                    // Add current row inserts
                    const currentRowsForOrder = historyInserts.filter(h =>
                        h.order_number === item.orderNumber &&
                        (h.package_no === item.packageNo || (!h.package_no && !item.packageNo))
                    )
                    const allRelevantRows = [...(rowsInDb || []), ...currentRowsForOrder]

                    const totalNet = allRelevantRows.reduce((s, r) => s + (Number(r.amount) - (Number(r.commission) || 0) - (Number(r.discount) || 0) - (Number(r.penalty) || 0)), 0)
                    const totalGross = allRelevantRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)
                    const totalComm = allRelevantRows.reduce((s, r) => s + Math.abs(Number(r.commission) || 0), 0)
                    const totalDisc = allRelevantRows.reduce((s, r) => s + Math.abs(Number(r.discount) || 0), 0)
                    const totalPen = allRelevantRows.reduce((s, r) => s + Math.abs(Number(r.penalty) || 0), 0)

                    // User Rule Update: If it is in the payment file, it is PAID.
                    // Absolutely no conditions on amount or date.
                    const status = 'paid'

                    const updateData: any = {
                        payment_status: status,
                        paid_at: item.paidAt,
                        amount: totalGross,
                        paid_amount: totalNet,
                        commission_amount: totalComm,
                        discount_amount: totalDisc,
                        penalty_amount: totalPen,
                        payment_reference: item.ref || targetOrder.payment_reference,
                        updated_at: new Date().toISOString()
                    }


                    const { error: updateError } = await supabase.from('finance_orders').update(updateData).eq('id', targetOrder.id)

                    if (updateError) {
                        console.error(`[PAYMENT DEBUG] ✗ Update failed for order ${item.orderNumber}:`, updateError)
                    } else {
                        console.log(`[PAYMENT DEBUG] ✓ Successfully updated order ${item.orderNumber} to PAID status`)
                    }
                })()
                updateTasks.push(task)
                matched++
            } else {
                // For unmatched, we use the aggregated view for the summary table
                unmatchedInserts.push({
                    order_number: item.orderNumber,
                    package_no: item.packageNo || null,
                    paid_at: item.paidAt,
                    paid_amount: item.net,
                    commission_amount: Math.abs(item.commission),
                    discount_amount: Math.abs(item.discount),
                    penalty_amount: Math.abs(item.penalty),
                    raw_row_json: historyInserts.find(h => h.order_number === item.orderNumber && h.package_no === item.packageNo)?.raw_row_json // Use first matching row
                })
                unmatched++
            }
        }

        // Save history in chunks
        if (historyInserts.length > 0) {
            for (let i = 0; i < historyInserts.length; i += 100) {
                await supabase.from('finance_payment_rows').insert(historyInserts.slice(i, i + 100))
            }
        }

        // Execution in batches
        for (let i = 0; i < updateTasks.length; i += 50) {
            await Promise.all(updateTasks.slice(i, i + 50))
        }

        if (unmatchedInserts.length > 0) {
            for (let i = 0; i < unmatchedInserts.length; i += 100) {
                await supabase.from('unmatched_payment_rows').insert(unmatchedInserts.slice(i, i + 100))
            }
        }

        revalidatePath('/finans/odemeler')

        // Log success
        await supabase.from('finance_upload_logs').insert({
            filename: file.name,
            upload_type: 'payments',
            processed_count: processed,
            matched_count: matched,
            unmatched_count: unmatched,
            status: 'success'
        })

        return { success: true, processed, matched, unmatched }
    } catch (e: any) {
        console.error('importFinancePaymentsExcel error:', e)
        const file = formData.get('file') as File
        if (file) {
            await supabase.from('finance_upload_logs').insert({
                filename: file.name,
                upload_type: 'payments',
                status: 'error',
                error_message: e.message
            })
        }
        return { success: false, error: e.message }
    }
}

export async function getFinanceOrders() {
    try {
        const { data, error } = await supabase
            .from('finance_orders')
            .select('*')
            .order('order_date', { ascending: false })
            .limit(10000)

        if (error) {
            console.error('getFinanceOrders database error:', error)
            return []
        }
        return (data || []) as FinanceOrder[]
    } catch (e) {
        console.error('getFinanceOrders unexpected error:', e)
        return []
    }
}

export async function getFinanceStats() {
    try {
        const now = new Date().toISOString()

        // Initialize default results
        let paidCount = 0, unpaidCount = 0, overdueCount = 0
        let totalPaid = 0, totalUnpaid = 0

        // Execute queries with individual error handling to prevent total failure
        const [paidRes, unpaidRes, overdueRes, paidAmtRes, unpaidAmtRes] = await Promise.all([
            supabase.from('finance_orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
            supabase.from('finance_orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'unpaid'),
            supabase.from('finance_orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'unpaid').lt('expected_payout_at', now),
            supabase.from('finance_orders').select('paid_amount').eq('payment_status', 'paid'),
            supabase.from('finance_orders').select('sale_total').eq('payment_status', 'unpaid')
        ])

        if (!paidRes.error) paidCount = paidRes.count || 0
        if (!unpaidRes.error) unpaidCount = unpaidRes.count || 0
        if (!overdueRes.error) overdueCount = overdueRes.count || 0

        if (!paidAmtRes.error && paidAmtRes.data) {
            totalPaid = paidAmtRes.data.reduce((sum, row) => sum + (Number(row.paid_amount) || 0), 0)
        }
        if (!unpaidAmtRes.error && unpaidAmtRes.data) {
            totalUnpaid = unpaidAmtRes.data.reduce((sum, row) => sum + (Number(row.sale_total) || 0), 0)
        }

        return {
            paidCount,
            unpaidCount,
            overdueCount,
            paidAmount: totalPaid,
            unpaidAmount: totalUnpaid
        }
    } catch (e) {
        console.error('getFinanceStats unexpected error:', e)
        return {
            paidCount: 0,
            unpaidCount: 0,
            overdueCount: 0,
            paidAmount: 0,
            unpaidAmount: 0
        }
    }
}

export async function resetFinanceData() {
    try {
        const { error: error1 } = await supabase.from('finance_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        const { error: error2 } = await supabase.from('unmatched_payment_rows').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

        if (error1 || error2) throw new Error('Veriler temizlenirken hata oluştu.')

        // Also clear history
        await supabase.from('finance_payment_rows').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        revalidatePath('/finans/odemeler')
        return { success: true }
    } catch (e: any) {
        console.error('resetFinanceData error:', e)
        return { success: false, error: e.message }
    }
}

export async function getFinanceUploadLogs() {
    try {
        const { data, error } = await supabase
            .from('finance_upload_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('getFinanceUploadLogs database error:', error)
            return []
        }
        return (data || []) as FinanceUploadLog[]
    } catch (e) {
        console.error('getFinanceUploadLogs unexpected error:', e)
        return []
    }
}

export async function syncUnmatchedPayments() {
    try {
        const { data: unmatchedRows, error: fetchError } = await supabase
            .from('unmatched_payment_rows')
            .select('*')
            .limit(5000)

        if (fetchError) throw fetchError
        if (!unmatchedRows || unmatchedRows.length === 0) return { success: true, matched: 0 }

        const orderNumbers = Array.from(new Set(unmatchedRows.map(r => r.order_number).filter(Boolean)))
        const { data: matchedOrders, error: orderError } = await supabase
            .from('finance_orders')
            .select('id, order_number, payment_status, paid_amount, commission_amount, discount_amount, penalty_amount, paid_at, payment_reference')
            .in('order_number', orderNumbers)

        if (orderError) throw orderError
        if (!matchedOrders || matchedOrders.length === 0) return { success: true, matched: 0 }

        const aggregatedSync = new Map<string, {
            net: number,
            commission: number,
            discount: number,
            penalty: number,
            paidAt: string | null,
            ref: string | null,
            ids: string[]
        }>()

        for (const row of unmatchedRows) {
            if (!aggregatedSync.has(row.order_number)) {
                aggregatedSync.set(row.order_number, {
                    net: Number(row.paid_amount) || 0,
                    commission: Number(row.commission_amount) || 0,
                    discount: Number(row.discount_amount) || 0,
                    penalty: Number(row.penalty_amount) || 0,
                    paidAt: row.paid_at,
                    ref: row.raw_row_json?.['Ekstre Referans No'] || row.raw_row_json?.['Kayıt No'] || null,
                    ids: [row.id]
                })
            } else {
                const prev = aggregatedSync.get(row.order_number)!
                prev.net += Number(row.paid_amount) || 0
                prev.commission += Number(row.commission_amount) || 0
                prev.discount += Number(row.discount_amount) || 0
                prev.penalty += Number(row.penalty_amount) || 0
                if (!prev.ref) prev.ref = row.raw_row_json?.['Ekstre Referans No'] || row.raw_row_json?.['Kayıt No'] || null
                prev.ids.push(row.id)
            }
        }

        const orderDataMap = new Map(matchedOrders.map(o => [o.order_number, o]))
        let matchedCount = 0
        const tasks: Promise<any>[] = []

        for (const [orderNumber, item] of aggregatedSync.entries()) {
            const existingOrder = orderDataMap.get(orderNumber)
            if (existingOrder) {
                const task = (async () => {
                    const isAlreadyPaid = existingOrder.payment_status === 'paid'
                    const newPaidAmount = isAlreadyPaid ? (Number(existingOrder.paid_amount || 0) + item.net) : item.net
                    const newComm = isAlreadyPaid ? (Number(existingOrder.commission_amount || 0) + Math.abs(item.commission)) : Math.abs(item.commission)
                    const newDisc = isAlreadyPaid ? (Number(existingOrder.discount_amount || 0) + Math.abs(item.discount)) : Math.abs(item.discount)
                    const newPen = isAlreadyPaid ? (Number(existingOrder.penalty_amount || 0) + Math.abs(item.penalty)) : Math.abs(item.penalty)

                    await supabase.from('finance_orders').update({
                        payment_status: 'paid',
                        paid_at: item.paidAt || (isAlreadyPaid ? existingOrder.paid_at : null),
                        paid_amount: newPaidAmount,
                        commission_amount: newComm,
                        discount_amount: newDisc,
                        penalty_amount: newPen,
                        payment_reference: item.ref || (isAlreadyPaid ? existingOrder.payment_reference : null),
                        updated_at: new Date().toISOString()
                    }).eq('id', existingOrder.id)

                    await supabase.from('unmatched_payment_rows').delete().in('id', item.ids)
                })()
                tasks.push(task)
                matchedCount++
            }
        }

        for (let i = 0; i < tasks.length; i += 50) {
            await Promise.all(tasks.slice(i, i + 50))
        }

        revalidatePath('/finans/odemeler')
        return { success: true, matched: matchedCount }
    } catch (e: any) {
        console.error('syncUnmatchedPayments error:', e)
        return { success: false, error: e.message }
    }
}

export async function repairFinanceData() {
    try {
        const { data: allHistory, error: historyError } = await supabase
            .from('finance_payment_rows')
            .select('*')

        if (historyError) throw historyError
        if (!allHistory || allHistory.length === 0) {
            return { success: false, error: 'Hesaplama yapılamadı: Ödeme geçmişi boş. Lütfen ödeme dosyalarını tekrar yükleyin.' }
        }

        const aggregated = new Map<string, {
            net: number,
            commission: number,
            discount: number,
            penalty: number,
            paidAt: string | null,
            ref: string | null
        }>()

        for (const row of allHistory) {
            if (!aggregated.has(row.order_number)) {
                aggregated.set(row.order_number, {
                    net: Number(row.amount) || 0,
                    commission: Number(row.commission) || 0,
                    discount: Number(row.discount) || 0,
                    penalty: Number(row.penalty) || 0,
                    paidAt: row.paid_at,
                    ref: row.raw_row_json?.['Ekstre Referans No'] || row.raw_row_json?.['Kayıt No'] || null
                })
            } else {
                const prev = aggregated.get(row.order_number)!
                prev.net += Number(row.amount) || 0
                prev.commission += Number(row.commission) || 0
                prev.discount += Number(row.discount) || 0
                prev.penalty += Number(row.penalty) || 0
                if (!prev.ref) prev.ref = row.raw_row_json?.['Ekstre Referans No'] || row.raw_row_json?.['Kayıt No'] || null
            }
        }

        const orderNumbers = Array.from(aggregated.keys())
        const { data: existingOrders } = await supabase
            .from('finance_orders')
            .select('id, order_number')
            .in('order_number', orderNumbers)

        const orderIdMap = new Map(existingOrders?.map(o => [o.order_number, o.id]) || [])
        let repairedCount = 0
        const updateTasks: Promise<any>[] = []

        for (const [orderNumber, item] of aggregated.entries()) {
            const targetId = orderIdMap.get(orderNumber)
            if (targetId) {
                const task = (async () => {
                    await supabase.from('finance_orders').update({
                        payment_status: 'paid',
                        paid_at: item.paidAt,
                        paid_amount: item.net,
                        commission_amount: Math.abs(item.commission),
                        discount_amount: Math.abs(item.discount),
                        penalty_amount: Math.abs(item.penalty),
                        payment_reference: item.ref,
                        updated_at: new Date().toISOString()
                    }).eq('id', targetId)
                })()
                updateTasks.push(task)
                repairedCount++
            }
        }

        for (let i = 0; i < updateTasks.length; i += 50) {
            await Promise.all(updateTasks.slice(i, i + 50))
        }

        revalidatePath('/finans/odemeler')
        return { success: true, repaired: repairedCount }
    } catch (e: any) {
        console.error('repairFinanceData error:', e)
        return { success: false, error: e.message }
    }
}

export async function getFinanceOrderDetails(orderNumber: string, packageNo?: string | null) {
    let query = supabase
        .from('finance_payment_rows')
        .select('*')
        .eq('order_number', orderNumber)

    if (packageNo) {
        query = query.eq('package_no', packageNo)
    } else {
        // If specific null check is needed or if we just want all for order
        // The user requirement is distinct cards. So if the card represents a package, we filter by it.
        // If packageNo is explicitly null (meaning 'HEAD'), we filter where package_no is null.
        if (packageNo === null) {
            query = query.is('package_no', null)
        }
        // If undefined, we might return all? But for this specific UI flow, we usually pass what we have.
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
        console.error('getFinanceOrderDetails error:', error)
        return []
    }
    return data as FinancePaymentRow[]
}
