import pandas as pd
import numpy as np
import json

# --- CONFIGURATION (Melontik-Style Pricing) ---
VAT_RATES = {
    'SALE': 1.10,      # %10 KDV
    'COST': 1.10,      # %10 KDV
    'SHIPPING': 1.20,  # %20 KDV
    'COMMISSION': 1.20,# %20 KDV
    'SERVICE': 1.20    # %20 KDV
}
STOPAJ_RATE = 0.01     # %1 Stopaj
SERVICE_FEE = 15.0     # Sabit Hizmet Bedeli (Hizmet Bedeli)

def melontik_profit_calc(sale_price, cost, shipping, comm_rate):
    """
    Net Kar = (Satış/1.10) - (Maliyet/1.10) - (Kargo/1.20) - ((Satış*Comm)/1.20) - (Stopaj) - (Hizmet/1.20)
    """
    if sale_price <= 0: return 0, 0
    
    sale_net = sale_price / VAT_RATES['SALE']
    cost_net = cost / VAT_RATES['COST']
    shipping_net = shipping / VAT_RATES['SHIPPING']
    
    # Komisyon KDV ayrıştırması
    comm_amount = sale_price * (comm_rate / 100)
    comm_net = comm_amount / VAT_RATES['COMMISSION']
    
    # Hizmet Bedeli KDV ayrıştırması
    service_net = SERVICE_FEE / VAT_RATES['SERVICE']
    
    # Stopaj (KDV'siz satış üzerinden)
    stopaj = sale_net * STOPAJ_RATE
    
    net_profit = sale_net - cost_net - shipping_net - comm_net - service_net - stopaj
    profit_pct = (net_profit / sale_net) * 100 if sale_net > 0 else 0
    
    return round(net_profit, 2), round(profit_pct, 2)

def process_trendyol_data(comm_path, adv_path, plus_path):
    # 1. Load Excels
    try:
        df_comm = pd.read_excel(comm_path)
        df_adv = pd.read_excel(adv_path)
        df_plus = pd.read_excel(plus_path)
    except Exception as e:
        return f"Dosya Okuma Hatası: {str(e)}"

    # 2. Cross-Check Merging (Barkod is priority)
    # Merging logic: Comm is base, left join others
    df = df_comm.merge(df_adv, on='Barkod', how='left', suffixes=('', '_adv'))
    df = df.merge(df_plus, on='Barkod', how='left', suffixes=('', '_plus'))

    final_products = []

    for _, row in df.iterrows():
        barcode = str(row['Barkod'])
        name = row.get('Ürün Adı', 'Tanımsız Ürün')
        cost = row.get('Maliyet', 0)
        current_shipping = row.get('Kargo', 45.0) # Varsayılan kargo

        # 3. Barem Mantığı (Standart Excel'deki 4 Sütun)
        barems = []
        for i in range(1, 5):
            p_key = f'{i}. Fiyat Aralığı'
            c_key = f'{i}. Komisyon'
            if p_key in row and c_key in row:
                price = row[p_key]
                rate = row[c_key]
                if not pd.isna(price) and not pd.isna(rate):
                    profit, pct = melontik_profit_calc(price, cost, current_shipping, rate)
                    barems.append({
                        "price": price,
                        "rate": rate,
                        "profit": profit,
                        "pct": pct
                    })
        
        # 4. Advantageous Logic
        adv_data = "Veri Yok"
        if not pd.isna(row.get('Avantajlı Fiyat')):
            price = row['Avantajlı Fiyat']
            rate = row.get('Avantaj Oranı', 18.8) # Default for Advantageous
            profit, pct = melontik_profit_calc(price, cost, current_shipping, rate)
            adv_data = {"price": price, "rate": rate, "profit": profit, "pct": pct}

        # 5. Plus Logic
        plus_data = "Veri Yok"
        if not pd.isna(row.get('Plus Fiyat')):
            price = row['Plus Fiyat']
            rate = row.get('Plus Komisyon', 11.9) # Default for Plus
            profit, pct = melontik_profit_calc(price, cost, current_shipping, rate)
            plus_data = {"price": price, "rate": rate, "profit": profit, "pct": pct}

        product_entry = {
            "barcode": barcode,
            "name": name,
            "cost": cost,
            "barems": barems,
            "advantage": adv_data,
            "plus": plus_data
        }
        final_products.append(product_entry)

    return final_products

if __name__ == "__main__":
    print("Trendyol Data Processing Motor Ready.")
