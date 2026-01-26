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
    name: string
    barcode: string
    description: string | null
    quantity: number
    damaged_quantity: number
    min_stock: number
    shelf_id: string | null
    category_id: string | null
    image_url: string | null
    created_at: string
    updated_at: string
    shelves?: Shelf | null // Joined
    categories?: Category | null // Joined
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
