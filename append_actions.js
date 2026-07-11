const fs = require('fs');

const data = `
// --- INCOMES (GELİRLER) ---

export async function getIncomes() {
    const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .order('tarih', { ascending: false });

    if (error) {
        console.error('Fetch incomes error:', error);
        throw new Error(error.message);
    }

    return data.map(d => ({
        id: d.id,
        kayitIsmi: d.kayit_ismi,
        musteri: d.musteri,
        tarih: d.tarih,
        toplamTutar: d.toplam_tutar,
        doviz: d.doviz,
        toplamKdv: d.toplam_kdv,
        kdvOrani: d.kdv_orani,
        tahsilatDurumu: d.tahsilat_durumu,
        gelirKategorisi: d.gelir_kategorisi,
        etiket: d.etiket,
        faturaNo: d.fatura_no,
        dosya: d.dosya,
        islemNo: d.islem_no,
        aciklama: d.aciklama,
        createdAt: d.created_at
    }));
}

export async function saveIncome(data: any) {
    const payload = {
        kayit_ismi: data.kayitIsmi,
        musteri: data.musteri || null,
        tarih: data.tarih,
        toplam_tutar: data.toplamTutar,
        doviz: data.doviz || 'TRY',
        toplam_kdv: data.toplamKdv || 0,
        kdv_orani: data.kdvOrani || 0,
        tahsilat_durumu: data.tahsilatDurumu || 'Tahsil Edildi',
        gelir_kategorisi: data.gelirKategorisi || 'Diğer',
        etiket: data.etiket || 'Genel',
        fatura_no: data.faturaNo || null,
        dosya: data.dosya || null,
        islem_no: data.islemNo || null,
        aciklama: data.aciklama || null
    };

    if (data.id) {
        const { error } = await supabase
            .from('incomes')
            .update(payload)
            .eq('id', data.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('incomes')
            .insert(payload);
        if (error) throw new Error(error.message);
    }

    revalidatePath('/muhasebe/gelir-kaydi');
    return { success: true };
}

export async function bulkSaveIncomes(dataList: any[]) {
    const payload = dataList.map(data => ({
        kayit_ismi: data.kayitIsmi,
        musteri: data.musteri || null,
        tarih: data.tarih,
        toplam_tutar: data.toplamTutar,
        doviz: data.doviz || 'TRY',
        toplam_kdv: data.toplamKdv || 0,
        kdv_orani: data.kdvOrani || 0,
        tahsilat_durumu: data.tahsilatDurumu || 'Tahsil Edildi',
        gelir_kategorisi: data.gelirKategorisi || 'Diğer',
        etiket: data.etiket || 'Genel',
        fatura_no: data.faturaNo || null,
        islem_no: data.islemNo || null,
        aciklama: data.aciklama || null
    }));
    const { error } = await supabase.from('incomes').insert(payload);
    if (error) throw new Error(error.message);
    revalidatePath('/muhasebe/gelir-kaydi');
    return { success: true };
}

export async function deleteIncome(id: string) {
    const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/muhasebe/gelir-kaydi');
    return { success: true };
}
`;

fs.appendFileSync('src/lib/actions.ts', '\\n' + data, 'utf8');
console.log('Appended safely with utf8 encoding.');
