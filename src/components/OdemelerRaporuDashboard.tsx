'use client';

import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, AlertCircle, ShoppingBag,
  Package, Truck, CheckCircle2, XCircle, Clock, Plus, Download, BarChart2,
  Wallet, Receipt, ArrowUpRight, ArrowDownRight, RefreshCw, FileText
} from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

export default function OdemelerRaporuDashboard({ 
  incomes = [], 
  expenses = [], 
  trendyolOrders = [], 
  lowStockProducts = [] 
}: { 
  incomes: any[]; 
  expenses: any[]; 
  trendyolOrders: any[]; 
  lowStockProducts: any[]; 
}) {

  const data = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

    // Satışlar (Gelirler)
    const todayIncomes = incomes.filter(i => new Date(i.tarih).getTime() >= todayStart);
    const thisMonthIncomes = incomes.filter(i => new Date(i.tarih).getTime() >= thisMonthStart);
    const lastMonthIncomes = incomes.filter(i => {
      const t = new Date(i.tarih).getTime();
      return t >= lastMonthStart && t <= lastMonthEnd;
    });

    const todaySales = todayIncomes.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const thisMonthSales = thisMonthIncomes.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const lastMonthSales = lastMonthIncomes.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const salesChange = lastMonthSales === 0 ? 100 : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;

    // Giderler
    const todayExpenses = expenses.filter(e => new Date(e.tarih).getTime() >= todayStart);
    const thisMonthExpensesList = expenses.filter(e => new Date(e.tarih).getTime() >= thisMonthStart);
    const lastMonthExpensesList = expenses.filter(e => {
      const t = new Date(e.tarih).getTime();
      return t >= lastMonthStart && t <= lastMonthEnd;
    });

    const todayExp = todayExpenses.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const thisMonthExp = thisMonthExpensesList.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const lastMonthExp = lastMonthExpensesList.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const expChange = lastMonthExp === 0 ? 100 : ((thisMonthExp - lastMonthExp) / lastMonthExp) * 100;

    // Kâr
    const todayProfit = todaySales - todayExp;
    const thisMonthProfit = thisMonthSales - thisMonthExp;
    const profitMargin = thisMonthSales === 0 ? 0 : (thisMonthProfit / thisMonthSales) * 100;

    // Kategori bazlı gider (Bu ay)
    const expByCategory = thisMonthExpensesList.reduce((acc: any, curr) => {
      const cat = curr.giderKategorisi || 'Diğer';
      acc[cat] = (acc[cat] || 0) + (Number(curr.toplamTutar) || 0);
      return acc;
    }, {});
    
    const expCategoryData = Object.keys(expByCategory).map(key => ({
      name: key,
      value: expByCategory[key]
    })).sort((a, b) => b.value - a.value);

    const biggestExpCategory = expCategoryData.length > 0 ? expCategoryData[0].name : '-';

    // Bekleyen Tahsilat
    const pendingIncomes = incomes.filter(i => i.tahsilatDurumu !== 'Tahsil Edildi' && i.tahsilatDurumu !== 'Ödendi');
    const trendyolPending = pendingIncomes.filter(i => i.musteri?.toLowerCase().includes('trendyol') || i.kayitIsmi?.toLowerCase().includes('trendyol'));
    const otherPending = pendingIncomes.filter(i => !i.musteri?.toLowerCase().includes('trendyol') && !i.kayitIsmi?.toLowerCase().includes('trendyol'));
    
    const trendyolPendingTotal = trendyolPending.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const otherPendingTotal = otherPending.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);

    // Bekleyen Ödeme
    const pendingExpenses = expenses.filter(e => e.odemeDurumu === 'Ödenmedi' || e.odemeDurumu === 'Bekliyor');
    const supplierPending = pendingExpenses.filter(e => e.giderKategorisi?.toLowerCase().includes('tedarik') || e.giderKategorisi?.toLowerCase().includes('mal')).reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const adsPending = pendingExpenses.filter(e => e.giderKategorisi?.toLowerCase().includes('reklam')).reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const shippingPending = pendingExpenses.filter(e => e.giderKategorisi?.toLowerCase().includes('kargo')).reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0);
    const otherExpPending = pendingExpenses.reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0) - supplierPending - adsPending - shippingPending;

    // Tahmini KDV (Bu ay)
    const hesaplananKdv = thisMonthIncomes.reduce((acc, curr) => acc + (Number(curr.toplamKdv) || 0), 0);
    const indirilecekKdv = thisMonthExpensesList.reduce((acc, curr) => acc + (Number(curr.toplamKdv) || 0), 0);
    const odenecekKdv = Math.max(0, hesaplananKdv - indirilecekKdv);

    // Son 30 gün grafikleri verisi
    const last30DaysMap = new Map();
    for(let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      last30DaysMap.set(dateStr, { date: dateStr, sales: 0, expenses: 0, profit: 0 });
    }

    incomes.filter(i => new Date(i.tarih).getTime() >= thirtyDaysAgo).forEach(i => {
      const d = new Date(i.tarih);
      const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      if(last30DaysMap.has(dateStr)) {
        const item = last30DaysMap.get(dateStr);
        item.sales += (Number(i.toplamTutar) || 0);
        item.profit = item.sales - item.expenses;
      }
    });

    expenses.filter(e => new Date(e.tarih).getTime() >= thirtyDaysAgo).forEach(e => {
      const d = new Date(e.tarih);
      const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      if(last30DaysMap.has(dateStr)) {
        const item = last30DaysMap.get(dateStr);
        item.expenses += (Number(e.toplamTutar) || 0);
        item.profit = item.sales - item.expenses;
      }
    });

    const chartData = Array.from(last30DaysMap.values());

    // Sipariş Özeti (Trendyol)
    const orderStats = {
      preparing: trendyolOrders.filter(o => o.status === 'Hazırlanıyor' || o.status === 'Awaiting' || o.status === 'Created').length,
      shipped: trendyolOrders.filter(o => o.status === 'Kargoda' || o.status === 'Shipped').length,
      delivered: trendyolOrders.filter(o => o.status === 'Teslim Edildi' || o.status === 'Delivered').length,
      returned: trendyolOrders.filter(o => o.status === 'İade' || o.status === 'Returned' || o.status === 'UnDelivered').length,
      cancelled: trendyolOrders.filter(o => o.status === 'İptal' || o.status === 'Cancelled').length,
      total: trendyolOrders.length
    };

    // Son İşlemler
    const allTransactions = [
      ...incomes.map(i => ({ type: 'income', date: new Date(i.tarih), title: i.kayitIsmi, amount: i.toplamTutar })),
      ...expenses.map(e => ({ type: 'expense', date: new Date(e.tarih), title: e.kayitIsmi, amount: e.toplamTutar }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    // Uyarılar
    const alerts = [];
    if(lowStockProducts.length > 0) alerts.push({ type: 'warning', text: `${lowStockProducts.length} adet kritik seviyede stok var.` });
    if(trendyolPendingTotal > 0) alerts.push({ type: 'info', text: `Trendyol'dan bekleyen ${trendyolPendingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ödeme var.` });
    if(supplierPending > 0) alerts.push({ type: 'error', text: `Tedarikçilere ${supplierPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ bekleyen ödeme var.` });
    if(odenecekKdv > 0) alerts.push({ type: 'warning', text: `Bu ayki tahmini KDV ödemeniz ${odenecekKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺.` });

    // Performans
    const avgOrderValue = orderStats.total > 0 ? incomes.filter(i => i.kayitIsmi?.toLowerCase().includes('trendyol') || i.kayitIsmi?.toLowerCase().includes('sipariş')).reduce((acc, curr) => acc + (Number(curr.toplamTutar) || 0), 0) / orderStats.total : 0;
    const dailyAvgSales = thisMonthSales / new Date().getDate();

    return {
      todaySales, thisMonthSales, salesChange,
      todayExp, thisMonthExp, expChange, biggestExpCategory,
      todayProfit, thisMonthProfit, profitMargin,
      trendyolPendingTotal, otherPendingTotal,
      supplierPending, adsPending, shippingPending, otherExpPending,
      hesaplananKdv, indirilecekKdv, odenecekKdv,
      chartData, expCategoryData,
      orderStats, allTransactions, alerts,
      avgOrderValue, dailyAvgSales,
      lastUpdate: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })
    };
  }, [incomes, expenses, trendyolOrders, lowStockProducts]);

  const formatMoney = (val: number) => {
    return val?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Üst Bilgi Alanı */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Hoş Geldiniz</h1>
          <p className="text-zinc-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Son Güncelleme: {data.lastUpdate}
          </p>
          <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Veriler API üzerinden senkronize edildi.
          </p>
        </div>
        
        {/* 7. Hızlı İşlemler (Üst Kısım) */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/muhasebe/gelir-kaydi" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20">
            <Plus className="w-4 h-4" /> Yeni Gelir Kaydı
          </Link>
          <Link href="/muhasebe/gider-kaydi" className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-rose-600/20">
            <Plus className="w-4 h-4" /> Yeni Gider Kaydı
          </Link>
          <button className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <RefreshCw className="w-4 h-4" /> Senkronizasyon
          </button>
        </div>
      </div>

      {/* 6. Uyarılar */}
      {data.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.alerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-2xl flex items-start gap-3 border ${
              alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{alert.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* 2. Finansal Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Toplam Satış */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${data.salesChange >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} flex items-center gap-1`}>
              {data.salesChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(data.salesChange).toFixed(1)}%
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-zinc-500 font-medium mb-1">Bu Ayki Satış</h3>
            <p className="text-3xl font-black text-zinc-900 tracking-tight">{formatMoney(data.thisMonthSales)}</p>
            <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center gap-1">
              Bugün: {formatMoney(data.todaySales)}
            </p>
          </div>
        </div>

        {/* Toplam Gider */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${data.expChange <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} flex items-center gap-1`}>
              {data.expChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(data.expChange).toFixed(1)}%
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-zinc-500 font-medium mb-1">Bu Ayki Gider</h3>
            <p className="text-3xl font-black text-zinc-900 tracking-tight">{formatMoney(data.thisMonthExp)}</p>
            <p className="text-sm font-medium text-rose-600 mt-2 flex items-center justify-between">
              <span>Bugün: {formatMoney(data.todayExp)}</span>
              <span className="text-zinc-500 text-xs bg-zinc-100 px-2 py-1 rounded-md" title="En büyük gider kategorisi">{data.biggestExpCategory}</span>
            </p>
          </div>
        </div>

        {/* Net Kâr */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1 backdrop-blur-md">
              Kâr Oranı: %{data.profitMargin.toFixed(1)}
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-300 font-medium mb-1">Bu Ay Net Kâr</h3>
            <p className="text-3xl font-black text-white tracking-tight">{formatMoney(data.thisMonthProfit)}</p>
            <p className="text-sm font-medium text-slate-300 mt-2 flex items-center gap-1">
              Bugün: <span className={data.todayProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatMoney(data.todayProfit)}</span>
            </p>
          </div>
        </div>

        {/* Bekleyen Tahsilat */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-800">Bekleyen Tahsilat</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <span className="text-zinc-500 text-sm">Trendyol Ödemeleri</span>
              <span className="font-bold text-zinc-900">{formatMoney(data.trendyolPendingTotal)}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-zinc-500 text-sm">Diğer Tahsilatlar</span>
              <span className="font-bold text-zinc-900">{formatMoney(data.otherPendingTotal)}</span>
            </div>
          </div>
        </div>

        {/* Bekleyen Ödeme */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-800">Bekleyen Ödeme</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 text-sm flex items-center gap-2"><Package className="w-3 h-3"/> Tedarikçi</span>
              <span className="font-bold text-zinc-900">{formatMoney(data.supplierPending)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 text-sm flex items-center gap-2"><BarChart2 className="w-3 h-3"/> Reklam</span>
              <span className="font-bold text-zinc-900">{formatMoney(data.adsPending)}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-zinc-500 text-sm flex items-center gap-2"><Truck className="w-3 h-3"/> Kargo</span>
              <span className="font-bold text-zinc-900">{formatMoney(data.shippingPending)}</span>
            </div>
          </div>
        </div>

        {/* Tahmini KDV */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-800">Tahmini KDV (Bu Ay)</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 text-sm">Hesaplanan (Satış)</span>
              <span className="font-bold text-emerald-600">+{formatMoney(data.hesaplananKdv)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <span className="text-zinc-500 text-sm">İndirilecek (Gider)</span>
              <span className="font-bold text-rose-600">-{formatMoney(data.indirilecekKdv)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-zinc-800">Ödenecek KDV</span>
              <span className="font-black text-indigo-600 text-lg">{formatMoney(data.odenecekKdv)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grafik Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Satış ve Kâr Grafik Kombinasyonu */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-zinc-800">Günlük Satış ve Kâr (Son 30 Gün)</h3>
            <div className="flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"/>Satış</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"/>Kâr</div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString('tr-TR')} ₺`, '']}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="sales" name="Satış" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" name="Kâr" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gider Dağılımı */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm flex flex-col">
          <h3 className="font-bold text-xl text-zinc-800 mb-2">Gider Dağılımı (Bu Ay)</h3>
          {data.expCategoryData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.expCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `${value.toLocaleString('tr-TR')} ₺`}
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {data.expCategoryData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-600 truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                    </div>
                    <span className="font-bold text-zinc-800">{formatMoney(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              Bu ay için gider verisi yok
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4. Sipariş Özeti */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm">
          <h3 className="font-bold text-xl text-zinc-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-400" /> Sipariş Özeti
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
              <span className="font-semibold text-zinc-600">Toplam Sipariş</span>
              <span className="font-black text-xl text-zinc-900">{data.orderStats.total}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="block text-xs font-semibold text-amber-700 mb-1">Hazırlanıyor</span>
                <span className="font-black text-lg text-amber-900">{data.orderStats.preparing}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="block text-xs font-semibold text-blue-700 mb-1">Kargoda</span>
                <span className="font-black text-lg text-blue-900">{data.orderStats.shipped}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="block text-xs font-semibold text-emerald-700 mb-1">Teslim Edildi</span>
                <span className="font-black text-lg text-emerald-900">{data.orderStats.delivered}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <span className="block text-xs font-semibold text-rose-700 mb-1">İade/İptal</span>
                <span className="font-black text-lg text-rose-900">{data.orderStats.returned + data.orderStats.cancelled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Son İşlemler */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl text-zinc-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-400" /> Son İşlemler
            </h3>
            <Link href="/muhasebe/gider-listesi" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Tümünü Gör &rarr;</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500 font-medium border-b border-zinc-100">
                <tr>
                  <th className="pb-3 px-2 font-medium">Tarih</th>
                  <th className="pb-3 px-2 font-medium">İşlem</th>
                  <th className="pb-3 px-2 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {data.allTransactions.length > 0 ? data.allTransactions.map((trx, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-2 text-zinc-500">{trx.date.toLocaleDateString('tr-TR')}</td>
                    <td className="py-3 px-2 font-medium text-zinc-800 truncate max-w-[200px]" title={trx.title}>{trx.title}</td>
                    <td className={`py-3 px-2 font-bold text-right ${trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {trx.type === 'income' ? '+' : '-'}{formatMoney(trx.amount)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-400">Henüz finansal işlem bulunmuyor.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 8. Performans Kartları */}
      <h3 className="font-bold text-xl text-zinc-800 pt-4">Performans Analizi</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Ortalama Sipariş Tutarı</p>
            <p className="text-2xl font-black text-zinc-900">{formatMoney(data.avgOrderValue)}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Günlük Ortalama Satış</p>
            <p className="text-2xl font-black text-zinc-900">{formatMoney(data.dailyAvgSales)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-500">En Çok Gider Oluşturan</p>
            <p className="text-xl font-black text-zinc-900 truncate" title={data.biggestExpCategory}>{data.biggestExpCategory}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
