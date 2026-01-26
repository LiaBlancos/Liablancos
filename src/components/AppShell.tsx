'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    PackagePlus,
    PackageMinus,
    Settings,
    Menu,
    X,
    Package,
    ScanLine,
    PlusCircle,
    AlertTriangle,
    LibrarySquare,
    Warehouse,
    ShoppingBag,
    ArrowDownLeft,
    ArrowUpRight,
    ChevronDown,
    ChevronRight as ChevronRightIcon,
    ShieldX,
    Trash2,
    Truck,
    Timer,
    RotateCcw,
    Calculator,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'

interface AppShellProps {
    children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isStockOpen, setIsStockOpen] = useState(false)
    const pathname = usePathname()
    const { user, logout } = useAuth()

    // Auto-open menu if we are on a relevant page
    const stockHrefs = ['/stock-in', '/stock-out', '/inventory', '/low-stock', '/products/new', '/trendyol/limits', '/damaged-in', '/damaged-out', '/damaged-stock']
    const shippingHrefs = ['/shipping/orders', '/shipping/delivered', '/shipping/in-transit', '/shipping/delayed', '/shipping/returns']
    const isCurrentlyOnStockPage = stockHrefs.includes(pathname)
    const isCurrentlyOnShippingPage = shippingHrefs.includes(pathname)

    const [isShippingOpen, setIsShippingOpen] = useState(false)
    const [isCalcOpen, setIsCalcOpen] = useState(false)

    useEffect(() => {
        if (isCurrentlyOnStockPage) {
            setIsStockOpen(true)
        }
        if (isCurrentlyOnShippingPage) {
            setIsShippingOpen(true)
        }
        if (pathname.startsWith('/calculator')) {
            setIsCalcOpen(true)
        }
    }, [pathname, isCurrentlyOnStockPage, isCurrentlyOnShippingPage])

    const mainNavigation = [
        { name: 'Genel Bakış', href: '/', icon: LayoutDashboard },
    ]

    const stockNavigation = [
        { name: 'Depo Stoğu', href: '/inventory', icon: Package },
        { name: 'Stok Giriş', href: '/stock-in', icon: ArrowDownLeft },
        { name: 'Stok Çıkış', href: '/stock-out', icon: ArrowUpRight },
        { name: 'Kritik Stoklar', href: '/low-stock', icon: AlertTriangle },
        { name: 'Hasarlı Ürünler', href: '/damaged-stock', icon: Trash2 },
        { name: 'Hasarlı Giriş', href: '/damaged-in', icon: ShieldX },
        { name: 'Hasarlı Çıkış', href: '/damaged-out', icon: Trash2 },
        { name: 'Trendyol Limitler', href: '/trendyol/limits', icon: ShoppingBag },
        { name: 'Yeni Ürün', href: '/products/new', icon: PlusCircle },
    ]

    const shippingNavigation = [
        { name: 'Gelen Siparişler', href: '/shipping/orders', icon: ShoppingBag },
        { name: 'Yolda Olanlar', href: '/shipping/in-transit', icon: Truck },
        { name: 'Gecikenler', href: '/shipping/delayed', icon: Timer },
        { name: 'Teslim Edilenler', href: '/shipping/delivered', icon: Package },
        { name: 'İadeler', href: '/shipping/returns', icon: RotateCcw },
    ]

    const calculationNavigation = [
        { name: 'Kâr Hesaplayıcı', href: '/calculator/profit', icon: Calculator },
    ]

    const otherNavigation = [
        { name: 'Raflar', href: '/shelves', icon: LibrarySquare },
        { name: 'Trendyol', href: '/trendyol', icon: ShoppingBag },
        { name: 'Hızlı Kontrol', href: '/audit', icon: ScanLine },
        { name: 'Ayarlar', href: '/settings', icon: Settings },
    ]

    const NavLink = ({ item, isSubItem = false }: { item: any, isSubItem?: boolean }) => {
        const isActive = pathname === item.href
        return (
            <Link
                href={item.href}
                className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5",
                    isSubItem && "pl-11 py-2.5 text-sm"
                )}
            >
                <item.icon className={cn(
                    isSubItem ? "w-4 h-4" : "w-5 h-5",
                    "transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                )} />
                <span className="font-medium">{item.name}</span>
                {isActive && !isSubItem && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
            </Link>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar - Premium Glass Effect */}
            <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white h-screen fixed left-0 top-0 z-30">
                {/* Logo Area */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <Warehouse className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-xl tracking-tight">LiaBlancos</span>
                            <p className="text-xs text-slate-400 -mt-0.5">Stok Yönetim Sistemi</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {mainNavigation.map((item) => <NavLink key={item.name} item={item} />)}

                    {/* Collapsible Stock Menu */}
                    <div className="pt-2">
                        <button
                            onClick={() => setIsStockOpen(!isStockOpen)}
                            className={cn(
                                "group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200",
                                isCurrentlyOnStockPage ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-wider text-[11px]">Stok İşlemleri</span>
                            </div>
                            <ChevronDown className={cn(
                                "w-4 h-4 transition-transform duration-300 opacity-50",
                                isStockOpen ? "rotate-0" : "-rotate-90"
                            )} />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isStockOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                        )}>
                            <div className="overflow-hidden space-y-1">
                                {stockNavigation.map((item) => <NavLink key={item.name} item={item} isSubItem />)}
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Shipping Menu */}
                    <div className="pt-2">
                        <button
                            onClick={() => setIsShippingOpen(!isShippingOpen)}
                            className={cn(
                                "group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200",
                                isCurrentlyOnShippingPage ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-wider text-[11px]">Kargo İşlemleri</span>
                            </div>
                            <ChevronDown className={cn(
                                "w-4 h-4 transition-transform duration-300 opacity-50",
                                isShippingOpen ? "rotate-0" : "-rotate-90"
                            )} />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isShippingOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                        )}>
                            <div className="overflow-hidden space-y-1">
                                {shippingNavigation.map((item) => <NavLink key={item.name} item={item} isSubItem />)}
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Calculation Menu */}
                    <div className="pt-2">
                        <button
                            onClick={() => setIsCalcOpen(!isCalcOpen)}
                            className={cn(
                                "group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200",
                                pathname.startsWith('/calculator') ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Calculator className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-wider text-[11px]">Hesaplama</span>
                            </div>
                            <ChevronDown className={cn(
                                "w-4 h-4 transition-transform duration-300 opacity-50",
                                isCalcOpen ? "rotate-0" : "-rotate-90"
                            )} />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isCalcOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                        )}>
                            <div className="overflow-hidden space-y-1">
                                {calculationNavigation.map((item) => <NavLink key={item.name} item={item} isSubItem />)}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 pb-2">
                        <div className="px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sistem</span>
                        </div>
                        {otherNavigation.map((item) => <NavLink key={item.name} item={item} />)}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 space-y-3">
                    {user && (
                        <div className="px-4 py-3 rounded-xl bg-white/5">
                            <p className="text-xs text-slate-400">Giriş yapan:</p>
                            <p className="text-sm font-semibold text-white mt-0.5 truncate">{user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                    <div className="px-4 py-2 rounded-xl bg-white/5 text-center">
                        <p className="text-xs text-slate-500">Versiyon 2.0</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Premium Edition</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Header - Premium */}
            <div className="md:hidden bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 p-4 sticky top-0 z-40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                        <Warehouse className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg text-zinc-900">LiaBlancos</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                    {isMobileMenuOpen ? <X className="text-zinc-700" /> : <Menu className="text-zinc-700" />}
                </button>
            </div>

            {/* Mobile Drawer - Premium */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-slate-900 animate-fade-in flex flex-col">
                    {/* Drawer Header with Close Button */}
                    <div className="bg-slate-900 border-b border-white/5 p-4 sticky top-0 z-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <Warehouse className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg text-white">LiaBlancos</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <X className="text-slate-400 w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 p-4 pb-20 overflow-y-auto custom-scrollbar">
                        {mainNavigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-6 py-4 rounded-2xl text-lg transition-all",
                                    pathname === item.href
                                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg"
                                        : "text-slate-300 hover:bg-white/5"
                                )}
                            >
                                <item.icon className="w-6 h-6" />
                                <span className="font-medium text-lg">{item.name}</span>
                            </Link>
                        ))}

                        {/* Mobile Stock Group */}
                        <div className="pt-4">
                            <button
                                onClick={() => setIsStockOpen(!isStockOpen)}
                                className={cn(
                                    "flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all",
                                    isCurrentlyOnStockPage ? "text-white" : "text-slate-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <Package className="w-6 h-6" />
                                    <span className="font-black uppercase tracking-widest text-sm">Stok İşlemleri</span>
                                </div>
                                <ChevronDown className={cn(
                                    "w-5 h-5 transition-transform duration-300",
                                    isStockOpen ? "rotate-0" : "-rotate-90"
                                )} />
                            </button>

                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isStockOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                            )}>
                                <div className="overflow-hidden space-y-2">
                                    {stockNavigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 ml-8 px-6 py-4 rounded-2xl transition-all",
                                                pathname === item.href
                                                    ? "bg-white/10 text-white"
                                                    : "text-slate-400 hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Shipping Group */}
                        <div className="pt-2">
                            <button
                                onClick={() => setIsShippingOpen(!isShippingOpen)}
                                className={cn(
                                    "flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all",
                                    isCurrentlyOnShippingPage ? "text-white" : "text-slate-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <ShoppingBag className="w-6 h-6" />
                                    <span className="font-black uppercase tracking-widest text-sm">Kargo İşlemleri</span>
                                </div>
                                <ChevronDown className={cn(
                                    "w-5 h-5 transition-transform duration-300",
                                    isShippingOpen ? "rotate-0" : "-rotate-90"
                                )} />
                            </button>

                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isShippingOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                            )}>
                                <div className="overflow-hidden space-y-2">
                                    {shippingNavigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 ml-8 px-6 py-4 rounded-2xl transition-all",
                                                pathname === item.href
                                                    ? "bg-white/10 text-white"
                                                    : "text-slate-400 hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Calculation Group */}
                        <div className="pt-2">
                            <button
                                onClick={() => setIsCalcOpen(!isCalcOpen)}
                                className={cn(
                                    "flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all",
                                    pathname.startsWith('/calculator') ? "text-white" : "text-slate-400"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <Calculator className="w-6 h-6" />
                                    <span className="font-black uppercase tracking-widest text-sm">Hesaplama</span>
                                </div>
                                <ChevronDown className={cn(
                                    "w-5 h-5 transition-transform duration-300",
                                    isCalcOpen ? "rotate-0" : "-rotate-90"
                                )} />
                            </button>

                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isCalcOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                            )}>
                                <div className="overflow-hidden space-y-2">
                                    {calculationNavigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-4 ml-8 px-6 py-4 rounded-2xl transition-all",
                                                pathname === item.href
                                                    ? "bg-white/10 text-white"
                                                    : "text-slate-400 hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            {otherNavigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-4 rounded-2xl text-lg transition-all",
                                        pathname === item.href
                                            ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg"
                                            : "text-slate-300 hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="font-medium text-lg">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Mobile Footer with User & Logout */}
                    <div className="p-4 border-t border-white/5 space-y-3 mt-auto">
                        {user && (
                            <div className="px-6 py-4 rounded-2xl bg-white/5">
                                <p className="text-xs text-slate-400">Giriş yapan:</p>
                                <p className="text-sm font-semibold text-white mt-0.5 truncate">{user.email}</p>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false)
                                logout()
                            }}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-base font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            )}


            <main className="flex-1 md:ml-72 min-h-screen">
                <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade">
                    {children}
                </div>
            </main>
        </div>
    )
}
