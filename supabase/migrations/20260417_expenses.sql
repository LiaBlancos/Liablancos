-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kayit_ismi TEXT NOT NULL,
    tedarikci TEXT,
    tarih DATE,
    toplam_tutar DECIMAL(12,2) DEFAULT 0,
    doviz TEXT DEFAULT 'TL',
    toplam_kdv DECIMAL(12,2) DEFAULT 0,
    kdv_orani INTEGER DEFAULT 0,
    odeme_durumu TEXT,
    gider_kategorisi TEXT,
    etiket TEXT,
    fis_no TEXT,
    dosya TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    stok_takipli BOOLEAN DEFAULT FALSE,
    islem_no TEXT UNIQUE,
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster searching
CREATE INDEX IF NOT EXISTS idx_expenses_kayit_ismi ON expenses(kayit_ismi);
CREATE INDEX IF NOT EXISTS idx_expenses_tarih ON expenses(tarih);
