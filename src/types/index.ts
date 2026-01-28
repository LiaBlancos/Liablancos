export type Shelf = {
    id: string
    code: string
    capacity: number
    created_at: string
}

export type Category = {
    id: string
    name: string
    created_at: string
}

export type Product = {
    id: string
    trendyol_product_id: string | null
    name: string
    barcode: string
    sku: string | null
    description: string | null
    quantity: number
    damaged_quantity: number
    min_stock: number
    shelf_id: string | null
    category_id: string | null
    image_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    shelves?: Shelf | null // Joined
    categories?: Category | null // Joined
}

export type Wholesaler = {
    id: string
    name: string
    phone: string | null
    address: string | null
    note: string | null
    is_active: boolean
    created_at: string
}

export type WholesalePrice = {
    id: string
    product_id: string
    wholesaler_id: string
    buy_price: number
    currency: string
    last_updated_at: string
    wholesalers?: { name: string }
}

export type InventoryLog = {
    id: string
    product_id: string
    transaction_type: 'STOCK_IN' | 'STOCK_OUT' | 'MOVE' | 'AUDIT' | 'ADJUST' | 'DAMAGED_IN' | 'DAMAGED_OUT'
    quantity_change: number
    old_shelf_id: string | null
    new_shelf_id: string | null
    note: string | null
    created_at: string
}
