'use client'

import React, { useState, useEffect } from 'react'
import { FileBarChart, TrendingDown, DollarSign, PieChart, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Activity, Clock } from 'lucide-react'
import { getExpenses } from '@/lib/actions'
import { formatCurrency } from '@/lib/utils'
import { GIDER_KATEGORILERI } from '@/lib/constants'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePie, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#64748b'
]

export default function GiderlerRaporu() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    count: 0,
    avg: 0
  })
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (records.length > 0) {
      processStats(records)
    }
  }, [startDate, endDate])

  const fetchData = async () => {
    try {
      const data = await getExpenses()
      setRecords(data)
      processStats(data)
    } catch (error) {
      console.error('Veri çekme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const processStats = (data: any[]) => {
    // Filter data by date range
    const filtered = data.filter(r => {
      const d = r.tarih.split('T')[0]
      return d >= startDate && d <= endDate
    })

    // 1. Basic Stats
    let total = 0
    let paid = 0
    let pending = 0
    
    filtered.forEach(r => {
      const tutar = parseFloat(r.toplamTutar) || 0
      total += tutar
      if (r.odemeDurumu === 'odendi') paid += tutar
      else pending += tutar
    })

    setStats({
      total,
      paid,
      pending,
      count: data.length,
      avg: filtered.length > 0 ? total / filtered.length : 0
    })

    // 2. Category Distribution
    const catMap: any = {}
    filtered.forEach(r => {
      const cat = r.giderKategorisi || 'DİĞER GİDERLER'
      const tutar = parseFloat(r.toplamTutar) || 0
      catMap[cat] = (catMap[cat] || 0) + tutar
    })

    const cData = Object.keys(catMap).map(key => ({
      name: key,
      value: catMap[key]
    })).sort((a, b) => b.value - a.value)
    
    setCategoryData(cData)

    // 3. Monthly Distribution (Last 6 Months)
    const monthMap: any = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      monthMap[label] = 0
    }

    filtered.forEach(r => {
      const d = new Date(r.tarih)
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      if (monthMap[label] !== undefined) {
        monthMap[label] += parseFloat(r.toplamTutar) || 0
      }
    })

    const mData = Object.keys(monthMap).map(key => ({
      name: key,
      amount: monthMap[key]
    }))

    setMonthlyData(mData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Giderler Raporu</h1>
            <p className="text-slate-500 text-xs font-medium">Finansal durum analizi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="relative flex items-center">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <span className="text-xs font-bold text-slate-600 pointer-events-none">
                {startDate ? new Date(startDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Başlangıç'}
              </span>
            </div>
            <span className="text-slate-300">-</span>
            <div className="relative flex items-center">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <span className="text-xs font-bold text-slate-600 pointer-events-none">
                {endDate ? new Date(endDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Bitiş'}
              </span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl uppercase tracking-wider">
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Toplam Gider" 
          value={formatCurrency(stats.total)} 
          icon={<Wallet className="w-5 h-5" />} 
          color="indigo" 
          subtitle={`${stats.count} Kayıt`}
        />
        <StatCard 
          title="Ödenen" 
          value={formatCurrency(stats.paid)} 
          icon={<ArrowDownRight className="w-5 h-5" />} 
          color="emerald" 
          subtitle={`${((stats.paid/stats.total)*100).toFixed(1)}% Tamamlandı`}
        />
        <StatCard 
          title="Bekleyen Ödeme" 
          value={formatCurrency(stats.pending)} 
          icon={<Clock className="w-5 h-5" />} 
          color="amber" 
          subtitle="Gelecek Ödemeler"
        />
        <StatCard 
          title="Ortalama Gider" 
          value={formatCurrency(stats.avg)} 
          icon={<TrendingDown className="w-5 h-5" />} 
          color="slate" 
          subtitle="İşlem Başına"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-500" />
              Aylık Harcama Trendi
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [formatCurrency(value), 'Tutar']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-8">
            <PieChart className="w-5 h-5 text-indigo-500" />
            Kategori Dağılımı
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                   formatter={(value: any) => [formatCurrency(value), '']}
                />
              </RePie>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-slate-500 font-medium truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-700">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Expenses */}
      <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">En Yüksek Giderler</h3>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">TÜMÜNÜ GÖR</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">KAYIT / AÇIKLAMA</th>
                <th className="px-6 py-4">KATEGORİ</th>
                <th className="px-6 py-4">TARİH</th>
                <th className="px-6 py-4 text-right">TUTAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records
                .filter(r => {
                  const d = r.tarih.split('T')[0]
                  return d >= startDate && d <= endDate
                })
                .sort((a, b) => parseFloat(b.toplamTutar) - parseFloat(a.toplamTutar))
                .slice(0, 5)
                .map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700 text-sm">{r.kayitIsmi}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{r.aciklama}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {r.giderKategorisi}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(r.tarih).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                    {formatCurrency(r.toplamTutar)} {r.doviz === 'USD' ? '$' : r.doviz === 'EUR' ? '€' : '₺'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  const colorMap: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-wider">
          Canlı
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-xl font-black text-slate-900 leading-none mb-2">{value}</h4>
        <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
  )
}