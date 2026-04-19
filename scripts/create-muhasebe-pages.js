const fs = require('fs');
const path = require('path');

const pages = [
  { dir: 'gider-kaydi', title: 'Gider Kaydı', icon: 'PlusSquare', desc: 'Yeni bir harcama veya gider ekleyin.' },
  { dir: 'gider-listesi', title: 'Gider Listesi', icon: 'Receipt', desc: 'Tüm giderlerinizi listeleyin ve yönetin.' },
  { dir: 'giderler-raporu', title: 'Giderler Raporu', icon: 'FileBarChart', desc: 'Giderlerinizin detaylı analizini görüntüleyin.' },
  { dir: 'odemeler-raporu', title: 'Ödemeler Raporu', icon: 'CreditCard', desc: 'Yapılan tüm ödemelerin raporunu inceleyin.' },
  { dir: 'kdv-raporu', title: 'KDV Raporu', icon: 'Coins', desc: 'KDV tutarlarınızı ve vergi durumunuzu takip edin.' }
];

const constructContent = (title, icon, desc) => `
'use client';
import { ${icon} } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <${icon} className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">${title}</h1>
          <p className="text-slate-500 text-sm">${desc}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <${icon} className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">${title} Modülü</h2>
          <p className="text-slate-500 max-w-sm">
            Bu bölüm şu anda geliştirme aşamasındadır. Çok yakında kullanıma sunulacaktır.
          </p>
        </div>
      </div>
    </div>
  );
}
`;

pages.forEach(p => {
  const dirPath = path.join(process.cwd(), 'src/app/muhasebe', p.dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = path.join(dirPath, 'page.tsx');
  fs.writeFileSync(filePath, constructContent(p.title, p.icon, p.desc));
});

console.log('Pages generated successfully.');
