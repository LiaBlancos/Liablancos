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
    is_active: boolean
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

export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'unknown'

export type ShipmentPackage = {
    id: string
    order_number: string
    shipment_package_id: string | null
    customer_name: string | null
    total_price: number
    order_date: string | null
    delivery_date: string | null
    status: string | null
    payment_status: PaymentStatus
    paid_at: string | null
    paid_amount: number | null
    payment_reference: string | null
    payment_last_checked_at: string | null
    created_at: string
    updated_at: string
    items?: ShipmentPackageItem[]
}

export type ShipmentPackageItem = {
    id: string
    package_id: string
    barcode: string | null
    product_name: string | null
    quantity: number
    price: number
    created_at: string
}

export type PaymentSyncLog = {
    id: string
    run_at: string
    pulled_count: number
    matched_count: number
    paid_count: number
    unpaid_count: number
    unmatched_count: number
    error: string | null
    created_at: string
}

export type UnmatchedPayment = {
    id: string
    shipment_package_id: string | null
    order_number: string | null
    transaction_date: string | null
    amount: number
    payment_reference: string | null
    raw_data: any
    created_at: string
}

export type FinanceOrder = {
    id: string
    order_number: string
    package_no: string | null
    barcode: string | null
    product_name: string | null
    quantity: number
    sale_total: number
    order_date: string | null
    order_status: string | null
    delivered_at: string | null
    due_at: string | null
    expected_payout_at: string | null
    payment_status: 'unpaid' | 'paid'
    paid_at: string | null
    paid_amount: number | null
    commission_amount: number | null
    discount_amount: number | null
    penalty_amount: number | null
    payment_reference: string | null
    created_at: string
    updated_at: string
}

export type FinancePaymentRow = {
    id: string
    order_number: string
    package_no: string | null
    paid_at: string | null
    amount: number
    commission: number
    discount: number
    penalty: number
    net_amount?: number
    transaction_type: string | null
    raw_row_json: any
    created_at: string
}

export interface ImportResult {
    success: boolean
    error?: string
    processed?: number
    matched?: number
    updated?: number
    inserted?: number
    unmatched?: number
}

export interface FinanceUploadLog {
    id: string
    filename: string
    upload_type: 'orders' | 'payments'
    processed_count: number
    updated_count: number
    inserted_count: number
    matched_count: number
    unmatched_count: number
    status: 'success' | 'error'
    error_message: string | null
    created_at: string
}
