'use client'

import { useState, useMemo } from 'react'
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Calculator,
    Package,
    Layers,
    Search,
    ChevronRight,
    ArrowRight,
    Info,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Product, RawMaterial, ProductMaterial, ManufacturingCatalogEntry } from '@/types'
import {
    createRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addProductMaterial,
    removeProductMaterial,
    updateProductMaterial,
    addToManufacturingCatalog,
    removeFromManufacturingCatalog,
    getUSDExchangeRate
} from '@/lib/actions'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface Props {
    initialProducts: Product[]
    initialRawMaterials: RawMaterial[]
    initialProductMaterials: ProductMaterial[]
    initialCatalog: ManufacturingCatalogEntry[]
}

type Tab = 'calculator' | 'recipes' | 'catalog'

export default function ManufacturingCalculator({
    initialProducts,
    initialRawMaterials,
    initialProductMaterials,
    initialCatalog
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('calculator')
    const [allProducts] = useState<Product[]>(initialProducts.filter(p => p.is_active))
    const [catalog, setCatalog] = useState<ManufacturingCatalogEntry[]>(initialCatalog)
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials)
    const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>(initialProductMaterials)

    // Selection States
    const [searchTerm, setSearchTerm] = useState('')
    const [showProductSearch, setShowProductSearch] = useState(false)
    const [productSearchTerm, setProductSearchTerm] = useState('')
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [manufacturingCount, setManufacturingCount] = useState<number>(1)
    const [usdRate, setUsdRate] = useState<number>(34.50)

    // Catalog Edit State
    const [isEditingMaterial, setIsEditingMaterial] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<RawMaterial>>({ currency: 'TRY' })
    const [showAddMaterial, setShowAddMaterial] = useState(false)

    // Recipe Edit State
    const [isAddingToRecipe, setIsAddingToRecipe] = useState(false)
    const [recipeForm, setRecipeForm] = useState({ material_id: '', quantity: 0, unit: '', unit_price: 0, currency: '' as any, price_unit: '' as any })

    const resetRecipeForm = () => setRecipeForm({ material_id: '', quantity: 0, unit: '', unit_price: 0, currency: '', price_unit: '' })

    // --- Derived State ---
    const filteredCatalog = catalog.filter(entry =>
        entry.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.product?.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const searchResults = allProducts.filter(p =>
        (p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            p.barcode.toLowerCase().includes(productSearchTerm.toLowerCase())) &&
        !catalog.some(entry => entry.product_id === p.id)
    ).slice(0, 5)

    const selectedProduct = allProducts.find(p => p.id === selectedProductId)
    const currentRecipe = productMaterials.filter(pm => pm.product_id === selectedProductId)

    useEffect(() => {
        getUSDExchangeRate().then(rate => setUsdRate(rate))
    }, [])

    const recipeWithCosts = useMemo(() => {
        return currentRecipe.map(pm => {
            const material = pm.material || rawMaterials.find(rm => rm.id === pm.material_id)
            const basePrice = pm.unit_price || material?.unit_price || 0
            const currency = pm.currency || material?.currency || 'TRY'

            let priceInTRY = basePrice
            if (currency === 'USD') priceInTRY = basePrice * usdRate

            const usageUnit = pm.unit || material?.unit || 'adet'
            const baseUnit = material?.unit || 'adet'
            // Determine the pricing unit: explicitly set on PM, or explicitly set on Material, or default to Material's base unit, or 'adet'
            const priceUnit = pm.price_unit || material?.price_unit || material?.unit || 'adet'

            // Conversion factors to Base Unit (Metre/Kg/Adet)
            // metre -> 1, cm -> 0.01
            // kg -> 1, gr -> 0.001
            const factors: Record<string, number> = {
                'metre': 1, 'cm': 0.01,
                'kg': 1, 'gr': 0.001,
                'adet': 1, 'top': 1, 'set': 1
            }

            const usageFactor = factors[usageUnit] || 1
            const priceUnitFactor = factors[priceUnit] || 1

            // Calculate price per usage unit
            // Formula: PricePerUsageUnit = PriceInTRY * (UsageFactor / PriceUnitFactor)
            // Example: Price=2TL/cm. Usage=cm. Factor=1/1=1. Result=2.
            // Example: Price=200TL/m. Usage=cm. Factor=0.01/1=0.01. Result=2.
            const finalPricePerUsageUnit = priceInTRY * (usageFactor / priceUnitFactor)

            const rowCost = pm.quantity_per_unit * finalPricePerUsageUnit
            return {
                ...pm,
                material,
                basePrice,
                currency,
                priceInTRY,
                usageUnit,
                baseUnit,
                finalPricePerUsageUnit,
                rowCost
            }
        })
    }, [currentRecipe, usdRate, rawMaterials])

    const totalCostPerUnit = useMemo(() => {
        return recipeWithCosts.reduce((sum, item) => sum + item.rowCost, 0)
    }, [recipeWithCosts])

    // --- Handlers ---

    // Catalog Handlers
    const handleSaveRawMaterial = async () => {
        if (!editForm.name || !editForm.unit) {
            toast.error('Lütfen zorunlu alanları doldurun.')
            return
        }

        try {
            if (isEditingMaterial) {
                const res = await updateRawMaterial(isEditingMaterial, editForm)
                if (res.error) throw new Error(res.error)
                setRawMaterials(prev => prev.map(m => m.id === isEditingMaterial ? { ...m, ...editForm } as RawMaterial : m))
                toast.success('Hammadde güncellendi.')
            } else {
                const res = await createRawMaterial(editForm)
                if (res.error) throw new Error(res.error)
                if (res.material) {
                    setRawMaterials(prev => [...prev, res.material as RawMaterial])
                }
                toast.success('Hammadde eklendi.')
                setShowAddMaterial(false)
            }
            setIsEditingMaterial(null)
            setEditForm({})
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleDeleteRawMaterial = async (id: string) => {
        if (!confirm('Bu hammaddeyi silmek istediğinize emin misiniz?')) return
        try {
            const res = await deleteRawMaterial(id)
            if (res.error) throw new Error(res.error)
            setRawMaterials(prev => prev.filter(m => m.id !== id))
            toast.success('Hammadde silindi.')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    // Recipe Handlers
    const handleAddMaterialToRecipe = async () => {
        if (!selectedProductId || !recipeForm.material_id || recipeForm.quantity <= 0) {
            toast.error('Lütfen malzeme ve miktar seçiniz.')
            return
        }
        try {
            const material = rawMaterials.find(m => m.id === recipeForm.material_id)
            const unitValue = recipeForm.unit || material?.unit || 'adet'
            const priceValue = recipeForm.unit_price > 0 ? recipeForm.unit_price : (material?.unit_price || 0)

            const res = await addProductMaterial({
                product_id: selectedProductId,
                material_id: recipeForm.material_id,
                quantity_per_unit: recipeForm.quantity,
                unit: (recipeForm.unit || material?.unit || 'adet') as any,
                unit_price: recipeForm.unit_price > 0 ? recipeForm.unit_price : undefined,
                currency: recipeForm.currency || undefined,
                price_unit: recipeForm.price_unit || undefined
            })
            if (res.error) throw new Error(res.error)

            const newEntry: ProductMaterial = {
                ...res.data,
                material
            }
            setProductMaterials(prev => {
                const filtered = prev.filter(pm => !(pm.product_id === selectedProductId && pm.material_id === recipeForm.material_id))
                return [...filtered, newEntry]
            })
            resetRecipeForm()
            toast.success('Malzeme reçeteye eklendi.')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleRemoveMaterialFromRecipe = async (id: string) => {
        try {
            const res = await removeProductMaterial(id)
            if (res.error) throw new Error(res.error)
            setProductMaterials(prev => prev.filter(pm => pm.id !== id))
            toast.success('Reçeteden kaldırıldı.')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleUpdateRecipeItem = async (id: string, updates: Partial<ProductMaterial>) => {
        try {
            const res = await updateProductMaterial(id, updates)
            if (res.error) throw new Error(res.error)
            setProductMaterials(prev => prev.map(pm => pm.id === id ? { ...pm, ...updates } : pm))
            toast.success('Güncellendi.')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    // Catalog Management Handlers
    const handleAddToCatalog = async (productId: string) => {
        try {
            const res = await addToManufacturingCatalog(productId)
            if (res.error) throw new Error(res.error)

            const product = allProducts.find(p => p.id === productId)
            const newEntry: ManufacturingCatalogEntry = {
                id: Math.random().toString(),
                product_id: productId,
                created_at: new Date().toISOString(),
                product
            }
            setCatalog(prev => [newEntry, ...prev])
            setShowProductSearch(false)
            setProductSearchTerm('')
            setSelectedProductId(productId)
            toast.success('Ürün imalat listesine eklendi.')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleRemoveFromCatalog = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('Bu ürünü imalat listesinden çıkarmak istediğinize emin misiniz?')) return
        try {
            const res = await removeFromManufacturingCatalog(id)
            if (res.error) throw new Error(res.error)
            setCatalog(prev => prev.filter(entry => entry.id !== id))
            if (catalog.find(entry => entry.id === id)?.product_id === selectedProductId) {
                setSelectedProductId('')
            }
            toast.success('Ürün listeden çıkarıldı.')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    // --- Components ---

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500 font-medium">{message}</p>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex p-1.5 bg-zinc-100 rounded-2xl w-fit">
                {(['calculator', 'recipes', 'catalog'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                            activeTab === tab
                                ? "bg-white text-zinc-900 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        {tab === 'calculator' && 'İmalat Hesapla'}
                        {tab === 'recipes' && 'Ürün Reçeteleri'}
                        {tab === 'catalog' && 'Hammadde Kataloğu'}
                    </button>
                ))}
            </div>

            {/* Catalog Tab */}
            {activeTab === 'catalog' && (
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Hammadde Kataloğu</h2>
                            <p className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                                İmalatta kullanılan tüm araç ve gereçler
                                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                <span className="text-indigo-600 font-bold">1 USD = {usdRate.toFixed(2)} ₺</span>
                            </p>
                        </div>
                        <button
                            onClick={() => { setShowAddMaterial(true); setIsEditingMaterial(null); setEditForm({ is_active: true }) }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
                        >
                            <Plus className="w-5 h-5" />
                            Yeni Hammadde
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50/50 text-zinc-500 text-[11px] font-black uppercase tracking-widest border-b border-zinc-100">
                                    <th className="px-6 py-4">Hammadde Adı</th>
                                    <th className="px-6 py-4">Birim</th>
                                    <th className="px-6 py-4">Fiyat</th>
                                    <th className="px-6 py-4">Döviz</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {showAddMaterial && (
                                    <tr className="bg-indigo-50/30 animate-in slide-in-from-top-2">
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                placeholder="Örn: Pamuk Kumaş"
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-indigo-500/20"
                                                value={editForm.name || ''}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-indigo-500/20"
                                                value={editForm.unit || ''}
                                                onChange={e => setEditForm({ ...editForm, unit: e.target.value as any })}
                                            >
                                                <option value="">Seçiniz</option>
                                                <option value="metre">Metre</option>
                                                <option value="adet">Adet</option>
                                                <option value="kg">Kg</option>
                                                <option value="top">Top</option>
                                                <option value="set">Set</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-indigo-500/20"
                                                value={editForm.unit_price || ''}
                                                onChange={e => setEditForm({ ...editForm, unit_price: parseFloat(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-indigo-500/20"
                                                value={editForm.currency || 'TRY'}
                                                onChange={e => setEditForm({ ...editForm, currency: e.target.value as any })}
                                            >
                                                <option value="TRY">TRY (₺)</option>
                                                <option value="USD">USD ($)</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Aktif</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleSaveRawMaterial} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                                                <button onClick={() => setShowAddMaterial(false)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {rawMaterials.map((m) => (
                                    <tr key={m.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {isEditingMaterial === m.id ? (
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                                                    value={editForm.name || ''}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                            ) : (
                                                <span className="font-bold text-zinc-900">{m.name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditingMaterial === m.id ? (
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                                                    value={editForm.unit || ''}
                                                    onChange={e => setEditForm({ ...editForm, unit: e.target.value as any })}
                                                />
                                            ) : (
                                                <span className="text-zinc-500 font-medium">{m.unit}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditingMaterial === m.id ? (
                                                <input
                                                    type="number"
                                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                                                    value={editForm.unit_price || ''}
                                                    onChange={e => setEditForm({ ...editForm, unit_price: parseFloat(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="font-black text-zinc-900">
                                                    {m.unit_price.toLocaleString('tr-TR')} {m.currency === 'USD' ? '$' : '₺'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditingMaterial === m.id ? (
                                                <select
                                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                                                    value={editForm.currency || 'TRY'}
                                                    onChange={e => setEditForm({ ...editForm, currency: e.target.value as any })}
                                                >
                                                    <option value="TRY">TRY</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded uppercase">{m.currency}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-xs font-bold px-2.5 py-1 rounded-full",
                                                m.is_active ? "text-emerald-600 bg-emerald-50" : "text-zinc-500 bg-zinc-100"
                                            )}>
                                                {m.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isEditingMaterial === m.id ? (
                                                    <>
                                                        <button onClick={handleSaveRawMaterial} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Save className="w-5 h-5" /></button>
                                                        <button onClick={() => setIsEditingMaterial(null)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><X className="w-5 h-5" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setIsEditingMaterial(m.id); setEditForm(m) }} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteRawMaterial(m.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rawMaterials.length === 0 && !showAddMaterial && (
                                    <tr><td colSpan={5}><EmptyState message="Henüz hammadde kataloğuna giriş yapılmamış." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recipes Tab */}
            {activeTab === 'recipes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Left: Product Selection */}
                    <div className="lg:col-span-1 bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col h-[650px]">
                        <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 rounded-t-3xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-zinc-900">İmalat Portföyü</h3>
                                <button
                                    onClick={() => setShowProductSearch(!showProductSearch)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {showProductSearch ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Tüm ürünlerde ara..."
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 ring-indigo-500/20"
                                            value={productSearchTerm}
                                            onChange={e => setProductSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1 bg-white rounded-xl border border-zinc-100 shadow-xl p-1 max-h-48 overflow-y-auto">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleAddToCatalog(p.id)}
                                                className="w-full flex items-center gap-2 p-2 hover:bg-indigo-50 rounded-lg text-left"
                                            >
                                                <div className="w-8 h-8 rounded border border-zinc-100 shrink-0 overflow-hidden">
                                                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-zinc-400 m-2" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold line-clamp-1">{p.name}</p>
                                                    <p className="text-[9px] text-zinc-400">{p.barcode}</p>
                                                </div>
                                                <Plus className="w-3 h-3 text-indigo-400 mr-1" />
                                            </button>
                                        ))}
                                        {productSearchTerm && searchResults.length === 0 && (
                                            <p className="text-[10px] text-zinc-400 p-3 italic text-center">Sonuç bulunamadı.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Portföyde ara..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredCatalog.map(entry => {
                                const p = entry.product
                                if (!p) return null
                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => setSelectedProductId(p.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border text-left group",
                                            selectedProductId === p.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                                                : "bg-white text-zinc-900 border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-zinc-100",
                                            selectedProductId === p.id ? "bg-white/20 border-white/20" : "bg-zinc-100"
                                        )}>
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className={cn("w-6 h-6", selectedProductId === p.id ? "text-white" : "text-zinc-500")} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm leading-tight line-clamp-2">{p.name}</p>
                                            <p className={cn("text-[10px] font-medium mt-1 opacity-70", selectedProductId === p.id ? "text-indigo-100" : "text-zinc-400")}>{p.barcode}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <Trash2
                                                onClick={(e) => handleRemoveFromCatalog(e, entry.id)}
                                                className={cn(
                                                    "w-3.5 h-3.5 transition-all",
                                                    selectedProductId === p.id ? "text-white/50 hover:text-white" : "text-zinc-300 hover:text-rose-500"
                                                )}
                                            />
                                            <ChevronRight className={cn("w-4 h-4 ml-auto opacity-50", selectedProductId === p.id && "rotate-90")} />
                                        </div>
                                    </button>
                                )
                            })}
                            {catalog.length === 0 && !showProductSearch && (
                                <div className="text-center py-10 px-4">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Plus className="w-5 h-5 text-zinc-300" />
                                    </div>
                                    <p className="text-[11px] font-bold text-zinc-900">Henüz ürün eklenmemiş</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">Üstteki + butonu ile imalat portföyünüze ürün ekleyebilirsiniz.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Recipe Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {selectedProduct ? (
                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col min-h-[650px]">
                                <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                            {selectedProduct.image_url ? (
                                                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Layers className="w-8 h-8 text-indigo-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-zinc-900 leading-tight">{selectedProduct.name}</h2>
                                            <p className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                                                {selectedProduct.barcode} • Reçete
                                                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                <span className="text-indigo-600 font-bold">1 USD = {usdRate.toFixed(2)} ₺</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddingToRecipe(true)}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Bileşen Ekle
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                                                <th className="pb-4">Bileşen</th>
                                                <th className="pb-4">Miktar / Birim</th>
                                                <th className="pb-4">Birim Fiyat</th>
                                                <th className="pb-4">Maliyet</th>
                                                <th className="pb-4 text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {isAddingToRecipe && (
                                                <tr className="bg-indigo-50/30 animate-in slide-in-from-top-2">
                                                    <td className="py-4">
                                                        <select
                                                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                                                            value={recipeForm.material_id}
                                                            onChange={e => {
                                                                const material = rawMaterials.find(m => m.id === e.target.value)
                                                                setRecipeForm({
                                                                    ...recipeForm,
                                                                    material_id: e.target.value,
                                                                    unit: material?.unit || 'adet',
                                                                    unit_price: 0, // Reset override
                                                                    currency: '' as any, // Reset override
                                                                    price_unit: material?.price_unit || material?.unit || 'adet'
                                                                })
                                                            }}
                                                        >
                                                            <option value="">Hammadde Seçin</option>
                                                            {rawMaterials.map(rm => (
                                                                <option key={rm.id} value={rm.id}>{rm.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-zinc-400 ml-1">MİKTAR</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Miktar"
                                                                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                                                                    value={recipeForm.quantity || ''}
                                                                    onChange={e => setRecipeForm({ ...recipeForm, quantity: Number(e.target.value) })}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-zinc-400 ml-1">BİRİM</label>
                                                                <select
                                                                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                                                                    value={recipeForm.unit || rawMaterials.find(m => m.id === recipeForm.material_id)?.unit || ''}
                                                                    onChange={e => setRecipeForm({ ...recipeForm, unit: e.target.value })}
                                                                >
                                                                    <option value="">Seçiniz</option>
                                                                    <option value="metre">Metre</option>
                                                                    <option value="cm">Santim (cm)</option>
                                                                    <option value="kg">Kilogram</option>
                                                                    <option value="gr">Gram</option>
                                                                    <option value="adet">Adet</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-zinc-400 ml-1 flex justify-between">
                                                                ÖZEL BİRİM FİYAT ({rawMaterials.find(m => m.id === recipeForm.material_id)?.unit?.toUpperCase() || 'BİRİM'} BAZINDA)
                                                                <span className="text-[9px] text-zinc-300 font-normal">Boş bırakılırsa katalog fiyatı kullanılır</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="flex gap-2">
                                                                    <div className="relative flex-1">
                                                                        <input
                                                                            type="number"
                                                                            placeholder={rawMaterials.find(m => m.id === recipeForm.material_id)?.unit_price?.toString() || 'Fiyat'}
                                                                            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                                                                            value={recipeForm.unit_price || ''}
                                                                            onChange={e => setRecipeForm({ ...recipeForm, unit_price: Number(e.target.value) })}
                                                                        />
                                                                    </div>
                                                                    <select
                                                                        className="w-24 px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold"
                                                                        value={recipeForm.currency || rawMaterials.find(m => m.id === recipeForm.material_id)?.currency || ''}
                                                                        onChange={e => setRecipeForm({ ...recipeForm, currency: e.target.value as any })}
                                                                    >
                                                                        <option value="">Katalog</option>
                                                                        <option value="TRY">TRY</option>
                                                                        <option value="USD">USD</option>
                                                                    </select>
                                                                </div>
                                                                <div className="mt-1 flex justify-end">
                                                                    <select
                                                                        className="px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-[9px] text-zinc-500 font-medium cursor-pointer hover:bg-zinc-100"
                                                                        value={recipeForm.price_unit || rawMaterials.find(m => m.id === recipeForm.material_id)?.unit || ''}
                                                                        onChange={e => setRecipeForm({ ...recipeForm, price_unit: e.target.value as any })}
                                                                    >
                                                                        <option value="metre">/ Metre</option>
                                                                        <option value="cm">/ cm</option>
                                                                        <option value="kg">/ kg</option>
                                                                        <option value="gr">/ gr</option>
                                                                        <option value="adet">/ adet</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4"></td>
                                                    <td className="py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={handleAddMaterialToRecipe} className="p-2 text-emerald-600 bg-white border border-emerald-100 rounded-lg shadow-sm"><CheckCircle2 className="w-5 h-5" /></button>
                                                            <button onClick={() => setIsAddingToRecipe(false)} className="p-2 text-rose-600 bg-white border border-rose-100 rounded-lg shadow-sm"><X className="w-5 h-5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {recipeWithCosts.map(item => {
                                                return (
                                                    <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 group">
                                                        <td className="py-4 px-4 font-bold text-zinc-900">{item.material?.name}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    className="w-16 px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
                                                                    value={item.quantity_per_unit}
                                                                    onChange={e => handleUpdateRecipeItem(item.id, { quantity_per_unit: Number(e.target.value) })}
                                                                />
                                                                <select
                                                                    className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] text-zinc-500"
                                                                    value={item.unit}
                                                                    onChange={e => handleUpdateRecipeItem(item.id, { unit: e.target.value as any })}
                                                                >
                                                                    <option value="metre">Metre</option>
                                                                    <option value="cm">cm</option>
                                                                    <option value="kg">kg</option>
                                                                    <option value="gr">gr</option>
                                                                    <option value="adet">Adet</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="relative flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        className="w-16 pl-4 pr-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
                                                                        placeholder={item.basePrice.toString()}
                                                                        value={item.unit_price || ''}
                                                                        onChange={e => handleUpdateRecipeItem(item.id, { unit_price: Number(e.target.value) || 0 })}
                                                                    />
                                                                    <select
                                                                        className="px-1 py-1 bg-white border border-zinc-200 rounded-lg text-[9px] font-bold text-zinc-500"
                                                                        value={item.currency || ''}
                                                                        onChange={e => handleUpdateRecipeItem(item.id, { currency: (e.target.value || null) as any })}
                                                                    >
                                                                        <option value="">🏠</option>
                                                                        <option value="TRY">₺</option>
                                                                        <option value="USD">$</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex justify-end mt-0.5">
                                                                    <select
                                                                        className="px-1 py-0 bg-transparent border-0 text-[9px] text-zinc-400 font-bold hover:text-indigo-600 cursor-pointer text-right pr-0"
                                                                        value={item.price_unit || item.material?.unit || ''}
                                                                        onChange={e => handleUpdateRecipeItem(item.id, { price_unit: (e.target.value || null) as any })}
                                                                    >
                                                                        <option value="metre">/ Metre</option>
                                                                        <option value="cm">/ cm</option>
                                                                        <option value="kg">/ kg</option>
                                                                        <option value="gr">/ gr</option>
                                                                        <option value="adet">/ adet</option>
                                                                    </select>
                                                                </div>
                                                                {item.currency === 'USD' || (!item.currency && item.material?.currency === 'USD') ? (
                                                                    <span className="text-[9px] text-zinc-400 ml-1">
                                                                        ≈ {(item.basePrice * usdRate).toFixed(2)} ₺
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 font-bold text-indigo-600">
                                                            {item.rowCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <button
                                                                onClick={() => handleRemoveMaterialFromRecipe(item.id)}
                                                                className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {currentRecipe.length === 0 && !isAddingToRecipe && (
                                                <tr><td colSpan={5}><EmptyState message="Bu ürün için henüz bir reçete oluşturulmamış." /></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-8 bg-zinc-50 border-t border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Birim Üretim Maliyeti</p>
                                            <p className="text-4xl font-black text-zinc-900 mt-1">
                                                {totalCostPerUnit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-2xl text-zinc-400">₺</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Maliyet Optimize Edildi
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-zinc-200 border-dashed h-[650px] flex items-center justify-center">
                                <EmptyState message="Reçeteyi görmek için soldan bir ürün seçin." />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Calculator Tab */}
            {activeTab === 'calculator' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Summary Inputs */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Hedef Ürün</label>
                                    <select
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 font-bold text-zinc-900 focus:ring-2 ring-indigo-500/20"
                                        value={selectedProductId}
                                        onChange={e => setSelectedProductId(e.target.value)}
                                    >
                                        <option value="">Ürün Seçiniz</option>
                                        {catalog.map(entry => (
                                            <option key={entry.id} value={entry.product_id}>{entry.product?.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Üretim Adedi</label>
                                    <div className="relative">
                                        <Calculator className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="number"
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 font-black text-2xl text-zinc-900"
                                            value={manufacturingCount}
                                            onChange={e => setManufacturingCount(Math.max(1, parseInt(e.target.value) || 0))}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-medium mt-2 px-1">Hesaplama bu adet üzerinden yapılacaktır.</p>
                                </div>
                            </div>

                            {selectedProduct && totalCostPerUnit > 0 && (
                                <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50 overflow-hidden relative">
                                    <div className="absolute -right-6 -bottom-6 opacity-10">
                                        <Calculator className="w-32 h-32" />
                                    </div>
                                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Tahmini Toplam Maliyet</p>
                                    <p className="text-4xl font-black mt-2">
                                        {(totalCostPerUnit * manufacturingCount).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} <span className="text-xl opacity-70">₺</span>
                                    </p>
                                    <div className="mt-6 flex items-center gap-2 text-indigo-100 text-xs font-bold">
                                        <ArrowRight className="w-4 h-4" />
                                        {manufacturingCount} adet üretim için
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cost Breakdown Table */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                        Maliyet Kalemleri
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-zinc-50/30 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                                                <th className="px-8 py-5">Hammadde</th>
                                                <th className="px-8 py-5">Miktar / Birim</th>
                                                <th className="px-8 py-5">Birim Fiyat</th>
                                                <th className="px-8 py-5 text-right">Toplam İhtiyaç</th>
                                                <th className="px-8 py-5 text-right">Satır Maliyeti</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {recipeWithCosts.length > 0 ? (
                                                recipeWithCosts.map((item) => {
                                                    const itemTotalMaliyet = item.rowCost * manufacturingCount
                                                    return (
                                                        <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <span className="font-bold text-zinc-900">{item.material?.name}</span>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className="text-zinc-500 font-medium">{item.unit || item.material?.unit}</span>
                                                            </td>
                                                            <td className="px-8 py-5 text-right font-bold text-zinc-900">
                                                                {item.quantity_per_unit}
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <span className="bg-zinc-100 px-3 py-1 rounded-lg font-black text-zinc-700 text-sm">
                                                                    {(item.quantity_per_unit * manufacturingCount).toLocaleString('tr-TR')}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-bold text-zinc-600">
                                                                        {item.basePrice.toLocaleString('tr-TR')} {item.currency === 'USD' ? '$' : '₺'}
                                                                    </span>
                                                                    {item.currency === 'USD' && (
                                                                        <span className="text-[9px] text-zinc-400 italic">
                                                                            ≈ {(item.basePrice * usdRate).toFixed(2)} ₺
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <span className="font-black text-indigo-600">
                                                                    {itemTotalMaliyet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="py-20">
                                                        {selectedProductId ? (
                                                            <div className="flex flex-col items-center justify-center text-center px-10">
                                                                <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                                                                <p className="font-bold text-zinc-800">Ürün Reçetesi Eksik</p>
                                                                <p className="text-sm text-zinc-500 max-w-xs mt-2">Bu ürünün maliyetini hesaplamak için önce "Ürün Reçeteleri" sekmesinden malzeme ataması yapmalısınız.</p>
                                                                <button onClick={() => setActiveTab('recipes')} className="mt-6 text-indigo-600 font-black text-sm hover:underline">Reçete Hazırla →</button>
                                                            </div>
                                                        ) : (
                                                            <EmptyState message="Hesaplama için soldan bi ürün seçin." />
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
