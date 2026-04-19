import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  console.log('Veri tabanı güncelleniyor...')
  
  // RPC kullanarak SQL çalıştırmayı deneyelim (Eğer RPC tanımlıysa)
  // Değilse, kullanıcıdan SQL Editor'a yapıştırmasını isteyeceğiz ama önce bu yolu deneyelim.
  const { error } = await supabase.rpc('exec_sql', {
    sql_string: `
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS islem_no TEXT UNIQUE;
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS aciklama TEXT;
    `
  })

  if (error) {
    console.log('Otomatik güncelleme yapılamadı (RPC yetkisi yok).')
    console.log('Lütfen aşağıdaki SQL komutunu Supabase Dashboard > SQL Editor kısmına yapıştırıp çalıştırın:')
    console.log('--------------------------------------------------')
    console.log('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS islem_no TEXT UNIQUE;')
    console.log('--------------------------------------------------')
  } else {
    console.log('Veri tabanı başarıyla güncellendi!')
  }
}

migrate()
