'use client';
import React, { useState, useEffect } from 'react';
import { Coins, Calendar, PieChart, TrendingUp, Filter, ArrowRight, Receipt, Activity, AlertCircle, X, Search, ChevronRight, Calculator, Bell, Wallet } from 'lucide-react';
import { getExpenses } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePie, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function KdvRaporu() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Start of month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // End of month
    return d.toISOString().split('T')[0];
  });

  const [stats, setStats] = useState({
    toplamKdv: 0,
    kdvHaric: 0,
    genelToplam: 0,
  });

  const [kdvRatesData, setKdvRatesData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('ozet');

  // Drill-down State
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  // Tax Simulation State
  const [satisCiro, setSatisCiro] = useState<number>(100000); // KDV Özeti için varsayılan ciro
  const [simCiro, setSimCiro] = useState<number>(100000);
  const [simGider, setSimGider] = useState<number>(40000);
  const [vergiTuru, setVergiTuru] = useState<string>('sahis'); // 'sahis' veya 'kurum'
  
  // Tax Calendar State
  const [upcomingTaxes, setUpcomingTaxes] = useState<any[]>([]);

  // Gelir Vergisi Dilimleri (2026)
  const gelirVergisiDilimleri = [
    { limit: 190000, oran: 0.15 },
    { limit: 400000, oran: 0.20 },
    { limit: 1000000, oran: 0.27 },
    { limit: 5300000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 }
  ];

  const calculateGelirVergisi = (matrah: number) => {
    if (matrah <= 0) return 0;
    let kalan = matrah;
    let vergi = 0;
    let oncekiLimit = 0;

    for (let i = 0; i < gelirVergisiDilimleri.length; i++) {
      const dilim = gelirVergisiDilimleri[i];
      const dilimFarki = dilim.limit - oncekiLimit;

      if (kalan > dilimFarki) {
        vergi += dilimFarki * dilim.oran;
        kalan -= dilimFarki;
        oncekiLimit = dilim.limit;
      } else {
        vergi += kalan * dilim.oran;
        break;
      }
    }
    return vergi;
  };

  const getQuarterlyReport = () => {
    const quarters = [];
    let cumulativeMatrah = 0;
    let cumulativeVergi = 0;
    const ceyrekMatrah = (simCiro - simGider) * 3;

    for (let i = 1; i <= 4; i++) {
      cumulativeMatrah += Math.max(0, ceyrekMatrah);
      let toplamGerekenVergi = 0;

      if (vergiTuru === 'sahis') {
        toplamGerekenVergi = calculateGelirVergisi(cumulativeMatrah);
      } else {
        toplamGerekenVergi = cumulativeMatrah * 0.25;
      }

      let buDonemVergi = Math.max(0, toplamGerekenVergi - cumulativeVergi);
      cumulativeVergi = toplamGerekenVergi;

      quarters.push({
        donem: `${i}. Dönem`,
        aylar: i === 1 ? 'Oca-Şub-Mar' : i === 2 ? 'Nis-May-Haz' : i === 3 ? 'Tem-Ağu-Eyl' : 'Eki-Kas-Ara',
        ceyrekMatrah,
        cumulativeMatrah,
        buDonemVergi,
        cumulativeVergi
      });
    }
    return quarters;
  };

  const quarterlyData = getQuarterlyReport();
  
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      processData(records);
    }
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      const data = await getExpenses();
      setRecords(data);
      processData(data);
      calculateTaxCalendar();
    } catch (error) {
      console.error('KDV verisi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxCalendar = () => {
    const today = new Date();
    const taxes = [];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // KDV Beyannamesi (Next month's 28th)
    let nextKdvMonth = currentMonth + 1;
    let nextKdvYear = currentYear;
    if (nextKdvMonth > 12) {
      nextKdvMonth = 1;
      nextKdvYear += 1;
    }
    const nextKdvDate = new Date(nextKdvYear, nextKdvMonth - 1, 28);
    const kdvDiff = Math.ceil((nextKdvDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    taxes.push({
      title: 'KDV Beyannamesi ve Ödemesi',
      date: nextKdvDate,
      daysLeft: kdvDiff,
      type: 'kdv'
    });

    // Geçici Vergi (Quarterly: May 17, Aug 17, Nov 17, Feb 17)
    const geciciDates = [
      new Date(currentYear, 1, 17), // Feb 17 (Q4 of previous year)
      new Date(currentYear, 4, 17), // May 17 (Q1)
      new Date(currentYear, 7, 17), // Aug 17 (Q2)
      new Date(currentYear, 10, 17), // Nov 17 (Q3)
      new Date(currentYear + 1, 1, 17) // Feb 17 next year
    ];

    const nextGecici = geciciDates.find(d => d.getTime() >= today.getTime());
    if (nextGecici) {
      const geciciDiff = Math.ceil((nextGecici.getTime() - today.getTime()) / (1000 * 3600 * 24));
      taxes.push({
        title: 'Geçici Vergi Beyannamesi (3 Aylık)',
        date: nextGecici,
        daysLeft: geciciDiff,
        type: 'gecici'
      });
    }

    // Yıllık Kurumlar / Gelir Vergisi (April 30)
    const yillikDate = new Date(currentYear, 3, 30);
    if (yillikDate.getTime() < today.getTime()) {
      yillikDate.setFullYear(currentYear + 1);
    }
    const yillikDiff = Math.ceil((yillikDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    taxes.push({
      title: 'Yıllık Gelir/Kurumlar Vergisi',
      date: yillikDate,
      daysLeft: yillikDiff,
      type: 'yillik'
    });

    setUpcomingTaxes(taxes.sort((a, b) => a.daysLeft - b.daysLeft));
  };

  const openDrillDown = (type: string, param?: number) => {
    let filtered = [...filteredRecords];
    let title = '';

    if (type === 'all') {
      title = 'Tüm Gider Belgeleri';
    } else if (type === 'rate' && param !== undefined) {
      filtered = filtered.filter(r => (r.kdvOrani || 0) === param);
      title = `%${param} KDV Oranlı İşlemler`;
    }

    setDrillDownData(filtered);
    setDrillDownTitle(title);
    setDrillDownOpen(true);
  };

  const processData = (data: any[]) => {
    // Filter by Date
    const filtered = data.filter(r => {
      const d = r.tarih ? r.tarih.split('T')[0] : '';
      return d >= startDate && d <= endDate;
    });

    setFilteredRecords(filtered);

    let tKdv = 0;
    let tTotal = 0;

    const ratesMap: Record<number, { kdv: number, matrah: number }> = {
      0: { kdv: 0, matrah: 0 },
      1: { kdv: 0, matrah: 0 },
      10: { kdv: 0, matrah: 0 },
      20: { kdv: 0, matrah: 0 },
    };

    const monthMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      monthMap[label] = 0;
    }

    filtered.forEach(r => {
      let tutar = 0;
      if (typeof r.toplamTutar === 'number') {
        tutar = r.toplamTutar;
      } else if (typeof r.toplamTutar === 'string') {
        if (r.toplamTutar.includes(',')) {
          tutar = parseFloat(r.toplamTutar.replace(/\./g, '').replace(',', '.'));
        } else {
          tutar = parseFloat(r.toplamTutar);
        }
      }

      const orani = r.kdvOrani || 0;
      const kdvTutari = orani > 0 ? (tutar * orani) / (100 + orani) : 0;
      const kdvHaricTutari = tutar - kdvTutari;

      tTotal += tutar;
      tKdv += kdvTutari;

      if (!ratesMap[orani]) ratesMap[orani] = { kdv: 0, matrah: 0 };
      ratesMap[orani].kdv += kdvTutari;
      ratesMap[orani].matrah += kdvHaricTutari;

      const d = new Date(r.tarih);
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      if (monthMap[label] !== undefined) {
        monthMap[label] += kdvTutari;
      }
    });

    setStats({
      toplamKdv: tKdv,
      kdvHaric: tTotal - tKdv,
      genelToplam: tTotal
    });

    const ratesArray = Object.keys(ratesMap)
      .map(Number)
      .map(key => ({
        name: `%${key} KDV`,
        rate: key,
        kdv: ratesMap[key].kdv,
        matrah: ratesMap[key].matrah
      }))
      .filter(item => item.matrah > 0)
      .sort((a, b) => b.kdv - a.kdv);

    setKdvRatesData(ratesArray);

    const mData = Object.keys(monthMap).map(key => ({
      name: key,
      KDV: monthMap[key]
    }));
    setMonthlyTrend(mData);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Coins className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Gelişmiş Vergi & KDV Raporu</h1>
            <p className="text-slate-500 text-xs font-medium">KDV takibi, Gelir/Geçici vergi planlaması ve net durum analizi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="relative flex items-center min-w-[85px]">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => (e.currentTarget as any).showPicker?.()}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                {startDate ? new Date(startDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Başlangıç'}
              </span>
            </div>
            <span className="text-slate-300">-</span>
            <div className="relative flex items-center min-w-[85px]">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => (e.currentTarget as any).showPicker?.()}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                {endDate ? new Date(endDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Bitiş'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        <button 
          onClick={() => setActiveTab('ozet')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'ozet' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          KDV Özeti (Net Durum)
        </button>
        <button 
          onClick={() => setActiveTab('indirilecek')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'indirilecek' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          İndirilecek KDV (Giderler)
        </button>
        <button 
          onClick={() => setActiveTab('hesaplanan')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'hesaplanan' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Hesaplanan KDV (Satışlar)
        </button>
        <button 
          onClick={() => setActiveTab('gelir_vergisi')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'gelir_vergisi' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Geçici & Gelir Vergisi
        </button>
      </div>

      {/* TAB CONTENT: İNDİRİLECEK KDV (Giderler) */}
      {activeTab === 'indirilecek' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => openDrillDown('all')}
              className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <div className="relative">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500" /> TOPLAM İNDİRİLECEK KDV
                </p>
                <h4 className="text-3xl font-black text-slate-900 mb-1">{formatCurrency(stats.toplamKdv)} ₺</h4>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  Kayıtları Gör <ArrowRight className="w-3 h-3" />
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <div className="relative">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> KDV HARİÇ TOPLAM (MATRAH)
                </p>
                <h4 className="text-3xl font-black text-slate-900 mb-1">{formatCurrency(stats.kdvHaric)} ₺</h4>
                <p className="text-xs text-indigo-600 font-medium">Vergisiz net gider tutarı</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
              <div className="relative">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" /> GENEL TOPLAM GİDER
                </p>
                <h4 className="text-3xl font-black text-slate-900 mb-1">{formatCurrency(stats.genelToplam)} ₺</h4>
                <p className="text-xs text-slate-500 font-medium">KDV Dahil toplam tutar</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KDV Rates Pie Chart */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-indigo-500" />
                Oranlara Göre KDV Dağılımı
              </h3>
              
              <div className="h-[240px] w-full mb-6 relative">
                {kdvRatesData.filter(d => d.kdv > 0).length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-medium">
                    Veri Bulunamadı
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePie>
                      <Pie
                        data={kdvRatesData.filter(d => d.kdv > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="kdv"
                      >
                        {kdvRatesData.filter(d => d.kdv > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value: any, name: any) => [`${formatCurrency(value)} ₺`, name]}
                      />
                    </RePie>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-3 mt-auto">
                {kdvRatesData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.kdv > 0 ? COLORS[index % COLORS.length] : '#cbd5e1'}}></div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{item.name}</p>
                        <p className="text-[10px] font-medium text-slate-400">Matrah: {formatCurrency(item.matrah)} ₺</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(item.kdv)} ₺</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Aylık İndirilecek KDV Trendi
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Son 6 Ay</span>
              </div>
              
              <div className="h-full min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`${formatCurrency(value)} ₺`, 'KDV Tutarı']}
                    />
                    <Bar dataKey="KDV" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Detailed Table */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Oran Bazlı İndirilecek KDV Detayları</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">KDV ORANI</th>
                    <th className="px-6 py-4 text-right">MATRAH (KDV HARİÇ)</th>
                    <th className="px-6 py-4 text-right">İNDİRİLECEK KDV</th>
                    <th className="px-6 py-4 text-right">GENEL TOPLAM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {kdvRatesData.map((row, i) => (
                    <tr 
                      key={i} 
                      onClick={() => openDrillDown('rate', row.rate)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-700 text-xs font-bold group-hover:bg-emerald-100 transition-colors">
                          {row.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">
                        {formatCurrency(row.matrah)} ₺
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">
                        {formatCurrency(row.kdv)} ₺
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm flex items-center justify-end gap-2">
                        {formatCurrency(row.matrah + row.kdv)} ₺
                        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </td>
                    </tr>
                  ))}
                  {kdvRatesData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                        Seçili tarih aralığında veri bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
                {kdvRatesData.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-100">
                    <tr>
                      <td className="px-6 py-4 font-black text-slate-700 text-sm uppercase">Genel Toplam</td>
                      <td className="px-6 py-4 text-right font-black text-slate-700 text-sm">
                        {formatCurrency(stats.kdvHaric)} ₺
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">
                        {formatCurrency(stats.toplamKdv)} ₺
                      </td>
                      <td className="px-6 py-4 text-right font-black text-indigo-600 text-sm">
                        {formatCurrency(stats.genelToplam)} ₺
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ÖZET */}
      {activeTab === 'ozet' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Net KDV Diferansiyel Pozisyonu</h2>
                  <p className="text-slate-400 text-sm">Satış cironuzu girerek güncel KDV dengenizi hesaplayın.</p>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50 flex flex-col gap-1 min-w-[200px]">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aylık Tahmini Satış (KDV Hariç) ₺</label>
                  <input 
                    type="number"
                    value={satisCiro}
                    onChange={(e) => setSatisCiro(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-bold text-white outline-none border-b border-slate-600 focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Hesaplanan KDV (Satışlar)</p>
                  <p className="text-3xl font-black text-blue-400">{formatCurrency(satisCiro * 0.10)} ₺</p>
                  <p className="text-xs text-slate-400 mt-2">%10 varsayılan satış KDV'si</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">İndirilecek KDV (Giderler)</p>
                  <p className="text-3xl font-black text-emerald-400">{formatCurrency(stats.toplamKdv)} ₺</p>
                  <p className="text-xs text-slate-400 mt-2">Gider modülünden alınan güncel veri.</p>
                </div>
                <div className={`bg-white/10 backdrop-blur-md border ${satisCiro * 0.10 - stats.toplamKdv > 0 ? 'border-rose-500/30' : 'border-emerald-500/30'} rounded-2xl p-6 relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${satisCiro * 0.10 - stats.toplamKdv > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}></div>
                  <div className="relative z-10">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${satisCiro * 0.10 - stats.toplamKdv > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {satisCiro * 0.10 - stats.toplamKdv > 0 ? 'ÖDENECEK KDV' : 'DEVREDEN KDV'}
                    </p>
                    <p className={`text-3xl font-black ${satisCiro * 0.10 - stats.toplamKdv > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(Math.abs(satisCiro * 0.10 - stats.toplamKdv))} ₺
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Hesaplanan - İndirilecek</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vergi Takvimi */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-rose-500" />
                Vergi Takvimi & Uyarılar
              </h3>
              <div className="space-y-4">
                {upcomingTaxes.map((tax, i) => (
                  <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                    tax.daysLeft <= 5 ? 'bg-rose-50 border-rose-100' : 
                    tax.daysLeft <= 15 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        tax.daysLeft <= 5 ? 'bg-rose-100 text-rose-700' : 
                        tax.daysLeft <= 15 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tax.daysLeft} GÜN KALDI
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {tax.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm mt-1">{tax.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HESAPLANAN KDV (Satışlar) */}
      {activeTab === 'hesaplanan' && (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-sm animate-fade-in">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Satışlardan Doğan (Hesaplanan) KDV</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Müşterilerinize kestiğiniz satış faturaları (Trendyol, Hepsiburada, kendi e-ticaret siteniz vb.) sisteme entegre edildiğinde, devlet adına tahsil ettiğiniz KDV tutarları burada detaylı olarak analiz edilecektir.
          </p>
        </div>
      )}

      {/* TAB CONTENT: GELİR VERGİSİ */}
      {activeTab === 'gelir_vergisi' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-2">Kurumlar ve Geçici Vergi Planlaması</h2>
            <p className="text-purple-200 text-sm mb-8">Tekstil kategorisinde yıl içi (3'er aylık) ve yıl sonu (yıllık) vergi projeksiyonları.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-purple-300 text-xs font-bold uppercase tracking-wider">3 Aylık Geçici Vergi</p>
                  <span className="bg-purple-500/20 text-purple-200 text-[10px] px-2 py-1 rounded-lg border border-purple-500/30">Tahmini</span>
                </div>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  (Satış Karı - İndirilebilir Giderler) üzerinden üçer aylık dönemlerde ödenmesi öngörülen gelir vergisi. Satış modülü aktifleştiğinde net matrah üzerinden otomatik hesaplanacaktır.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider">Yıllık Kurumlar / Gelir Vergisi</p>
                  <span className="bg-indigo-500/20 text-indigo-200 text-[10px] px-2 py-1 rounded-lg border border-indigo-500/30">1 Sene</span>
                </div>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  Yıl sonunda toplam net ticari kazanç üzerinden hesaplanıp, yıl içinde ödenmiş olan Geçici Vergiler mahsup edildikten sonra kalan nihai ödenecek/iade alınacak vergi tutarı.
                </p>
              </div>
            </div>
          </div>

          {/* Finansal Projeksiyon Motoru */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm mt-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800">Finansal Projeksiyon Motoru</h3>
                <p className="text-sm text-slate-500">Aylık hedeflerinize göre yıllık tahmini vergi yükünüzü simüle edin.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Aylık Tahmini Ciro (Gelir) ₺</label>
                  <input 
                    type="number" 
                    value={simCiro}
                    onChange={(e) => setSimCiro(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Aylık Tahmini Gider ₺</label>
                  <input 
                    type="number" 
                    value={simGider}
                    onChange={(e) => setSimGider(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Vergi Türü / Şirket Tipi</label>
                  <select 
                    value={vergiTuru}
                    onChange={(e) => setVergiTuru(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-semibold"
                  >
                    <option value="sahis">Şahıs Şirketi (Artan Oranlı Gelir Vergisi)</option>
                    <option value="kurum">Limited/A.Ş. (Kurumlar Vergisi %25)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 opacity-50"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <span className="text-sm font-medium text-slate-500">Yıllık Tahmini Kâr (Matrah)</span>
                    <span className="font-bold text-slate-800 text-lg">{formatCurrency(Math.max(0, (simCiro - simGider) * 12))} ₺</span>
                  </div>
                  {vergiTuru === 'sahis' ? (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                      <span className="text-sm font-medium text-slate-500">Ortalama Vergi Yükü (Efektif Oran)</span>
                      <span className="font-bold text-purple-600 text-lg">
                        % {Math.max(0, (simCiro - simGider)) > 0 ? ((calculateGelirVergisi(Math.max(0, (simCiro - simGider) * 12)) / Math.max(0, (simCiro - simGider) * 12)) * 100).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                      <span className="text-sm font-medium text-slate-500">Sabit Kurumlar Vergisi Oranı</span>
                      <span className="font-bold text-purple-600 text-lg">% 25</span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <span className="block text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Yıllık Tahmini Vergi Borcu</span>
                    <span className="block text-4xl font-black text-slate-900">
                      {formatCurrency(vergiTuru === 'sahis' ? calculateGelirVergisi(Math.max(0, (simCiro - simGider) * 12)) : Math.max(0, (simCiro - simGider) * 12) * 0.25)} ₺
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Aylık Geçici Vergi Raporu Tablosu */}
            <div className="mt-12">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> 3 Aylık Geçici Vergi ve Kümülatif Rapor
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">DÖNEM</th>
                      <th className="px-6 py-4 text-right">DÖNEM KÂRI</th>
                      <th className="px-6 py-4 text-right text-indigo-600">KÜMÜLATİF KÂR</th>
                      <th className="px-6 py-4 text-right">ÖNCEKİ ÖDENEN</th>
                      <th className="px-6 py-4 text-right text-rose-600">BU DÖNEM ÖDENECEK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quarterlyData.map((q, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">{q.donem}</p>
                          <p className="text-xs text-slate-400">{q.aylar}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-600 text-sm">
                          {formatCurrency(q.ceyrekMatrah)} ₺
                        </td>
                        <td className="px-6 py-4 text-right font-black text-indigo-600 text-sm bg-indigo-50/30">
                          {formatCurrency(q.cumulativeMatrah)} ₺
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-500 text-sm">
                          {formatCurrency(q.cumulativeVergi - q.buDonemVergi)} ₺
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-600 text-sm bg-rose-50/30">
                          {formatCurrency(q.buDonemVergi)} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRILL-DOWN MODAL */}
      {drillDownOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrillDownOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Search className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{drillDownTitle}</h2>
                  <p className="text-xs font-medium text-slate-500">{drillDownData.length} kayıt bulundu</p>
                </div>
              </div>
              <button 
                onClick={() => setDrillDownOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="space-y-3">
                {drillDownData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-medium">Seçilen kritere uygun fiş/fatura bulunamadı.</div>
                ) : (
                  drillDownData.map((record, idx) => {
                    let tutar = typeof record.toplamTutar === 'string' && record.toplamTutar.includes(',')
                      ? parseFloat(record.toplamTutar.replace(/\./g, '').replace(',', '.'))
                      : typeof record.toplamTutar === 'number' ? record.toplamTutar : parseFloat(record.toplamTutar || 0);
                    
                    let kdvOrani = record.kdvOrani || 0;
                    let kdvTutari = kdvOrani > 0 ? (tutar * kdvOrani) / (100 + kdvOrani) : 0;

                    return (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{record.kayitIsmi || 'İsimsiz Fiş'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(record.tarih).toLocaleDateString('tr-TR')} • {record.giderKategorisi || 'Diğer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-slate-900">{formatCurrency(tutar)} ₺</p>
                          {kdvOrani > 0 && (
                            <p className="text-[10px] font-bold text-emerald-600 mt-0.5 tracking-wide">
                              KDV: {formatCurrency(kdvTutari)} ₺ (%{kdvOrani})
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}