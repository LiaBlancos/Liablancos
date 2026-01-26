# LiaBlancos - Stok Yönetim Sistemi 💎

LiaBlancos, Trendyol satıcıları için özel olarak tasarlanmış, premium tasarımlı ve yüksek güvenlikli bir stok yönetim panelidir.

## 🚀 Özellikler

- **📦 Stok Takibi:** Ürünlerinizi, varyasyonlarını ve stok durumlarını anlık olarak takip edin.
- **🏷️ Raf Yönetimi:** Deponuzdaki rafları tanımlayın ve ürünleri konumlarına göre organize edin.
- **🔐 Güvenli Kimlik Doğrulama:** Supabase Auth entegrasyonu ile email tabanlı güvenli giriş.
- **📊 Kâr Hesaplayıcı:** Trendyol komisyonları, kargo ve Stopaj (%1) dahil gelişmiş kâr analiz aracı.
- **📱 Mobil Uyumlu:** Hareket halindeyken stoklarınızı kontrol edebileceğiniz tam uyumlu mobil arayüz.
- **🔗 Trendyol Entegrasyonu:** Ürünleri Trendyol mağazanızdan otomatik senkronize edin (Geliştirme aşamasında).

## 🛠️ Teknolojiler

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Backend/DB:** Supabase (PostgreSQL)
- **Güvenlik:** Supabase Auth (Email/Password)
- **Icons:** Lucide React

## 🏁 Başlangıç

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env.local` dosyasını oluşturun ve Supabase bilgilerinizi ekleyin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## 🔐 Güvenlik Notu

Bu proje, kimlik doğrulama için **Supabase Auth** kullanır. Kullanıcı yönetimi doğrudan Supabase Dashboard üzerinden yapılabilir. Asla `.env.local` dosyasını GitHub'a pushlamayın!

---
© 2025 LiaBlancos • Premium Edition
