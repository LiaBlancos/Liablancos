export const TEX_VAT_INCLUSIVE_RATES: Record<number, number> = {
    0: 93.05, 1: 93.05, 2: 93.05, 3: 112.36, 4: 121.75, 5: 129.58, 6: 141.96, 7: 150.79, 8: 161.05, 9: 170.90,
    10: 184.16, 11: 194.56, 12: 204.40, 13: 213.65, 14: 222.20, 15: 231.37, 16: 240.98, 17: 251.64, 18: 262.32, 19: 272.95,
    20: 283.45, 21: 293.98, 22: 305.78, 23: 317.96, 24: 329.23, 25: 340.43, 26: 351.28, 27: 362.12, 28: 373.01, 29: 383.87,
    30: 394.66, 31: 473.27, 32: 485.75, 33: 498.25, 34: 510.73, 35: 523.25, 36: 535.72, 37: 548.23, 38: 560.75, 39: 573.23,
    40: 587.24, 41: 599.76, 42: 612.31, 43: 624.82, 44: 637.36, 45: 649.91, 46: 662.42, 47: 674.96, 48: 687.47, 49: 700.02,
    50: 712.56, 51: 725.08, 52: 737.62, 53: 750.13, 54: 762.67, 55: 775.21, 56: 787.74, 57: 800.28, 58: 812.78, 59: 825.32,
    60: 837.88
}

export function getShippingRate(desi: number) {
    const roundedDesi = Math.round(desi)
    return TEX_VAT_INCLUSIVE_RATES[roundedDesi] || (roundedDesi > 60 ? TEX_VAT_INCLUSIVE_RATES[60] : TEX_VAT_INCLUSIVE_RATES[0])
}

export interface CalculationResult {
    salePrice: number
    netProfit: number
    roi: number
    margin: number
    commissionAmount: number
    shippingAmount: number
    netVat: number
    breakdown: {
        saleExcl: number
        costExcl: number
        shippingExcl: number
        commExcl: number
        feesExcl: number
        stopajAmount: number
        saleVat: number
        costVat: number
        shippingVat: number
        commVat: number
        netVat: number
    }
}

export function calculateTrendyolProfit(
    salePrice: number,
    cost: number,
    shipping: number,
    commissionRate: number,
    costVatRate: number = 10,
    saleVatRate: number = 10,
    isMicroExport: boolean = false
): CalculationResult {
    const commRatio = commissionRate / 100

    // VAT Factors (used for Stopaj & Reporting only)
    const saleVatFactor = 1 + (saleVatRate / 100)
    const costVatFactor = 1 + (costVatRate / 100)
    const shippingVatFactor = 1.20
    const commVatFactor = 1.20
    const feeVatFactor = 1.20

    // Fixed Fees (VAT Inclusive) (Hizmet Bedeli)
    // Updated to match screenshot reference (13.19 TL)
    const platformServiceFeeVal = 13.19
    const intlServiceFeeVal = isMicroExport ? 47.71 : 0
    const totalServiceFee = platformServiceFeeVal + intlServiceFeeVal

    // Commission (VAT Inclusive) (Komisyon Gideri)
    const commAmount = salePrice * commRatio

    // Stopaj (1% of Net Sales)
    // Stopaj is legally calculated on the tax base.
    const saleExcl = salePrice / saleVatFactor
    const stopajRatio = 0.01
    const stopajAmount = saleExcl * stopajRatio

    // --- FORMULA CHANGE: CASH FLOW / VAT INCLUSIVE PROFIT ---
    // Net Kâr = Satış(Dahil) - Maliyet(Dahil) - Komisyon(Dahil) - Kargo(Dahil) - Hizmet(Dahil) - Stopaj
    const netProfit = salePrice
        - cost
        - commAmount
        - shipping
        - totalServiceFee
        - stopajAmount

    // Breakdown Computations (for reporting/debugging if needed, still useful to track)
    const costExcl = cost / costVatFactor
    const shippingExcl = shipping / shippingVatFactor
    const commExcl = commAmount / commVatFactor
    const feesExcl = totalServiceFee / feeVatFactor

    // Net VAT (KDV Farkı) Calculation (Still useful for tax planning, though not used in Net Profit anymore)
    const saleVat = salePrice - saleExcl
    const costVat = cost - costExcl
    const shippingVat = shipping - shippingExcl
    const commVat = commAmount - commExcl
    const feeVat = totalServiceFee - feesExcl
    const netVat = saleVat - (costVat + shippingVat + commVat + feeVat)

    return {
        salePrice,
        netProfit,
        roi: cost > 0 ? (netProfit / cost) * 100 : 0, // ROI based on Inclusive Cost
        margin: salePrice > 0 ? (netProfit / salePrice) * 100 : 0, // Margin based on Inclusive Sales
        commissionAmount: commAmount,
        shippingAmount: shipping,
        netVat,
        breakdown: {
            saleExcl,
            costExcl,
            shippingExcl,
            commExcl,
            feesExcl,
            stopajAmount,
            saleVat,
            costVat,
            shippingVat,
            commVat,
            netVat
        }
    }
}

export function calculatePriceFromTarget(
    target: number,
    mode: 'amount' | 'rate',
    cost: number,
    shipping: number,
    commissionRate: number,
    costVatRate: number = 10,
    saleVatRate: number = 10,
    isMicroExport: boolean = false
): CalculationResult {
    const commRatio = commissionRate / 100
    const saleVatFactor = 1 + (saleVatRate / 100)
    const stopajRatio = 0.01

    // VAT Inclusive Fixed Fees
    const platformServiceFeeVal = 13.19
    const intlServiceFeeVal = isMicroExport ? 47.71 : 0
    const totalServiceFee = platformServiceFeeVal + intlServiceFeeVal

    // Formula Reversal for:
    // NetProfit = SalePrice - Cost - (SalePrice*Comm) - Shipping - Fees - (SalePrice/Factor * Stopaj)
    // NetProfit + Cost + Shipping + Fees = SalePrice * (1 - Comm - Stopaj/Factor)

    // Constant Factor attached to Sale Price
    const salePriceFactor = 1 - commRatio - (stopajRatio / saleVatFactor)

    // Fixed Costs Sum
    const fixedCosts = cost + shipping + totalServiceFee

    let salePrice = 0

    if (mode === 'amount') {
        // Target = SalePrice * Factor - FixedCosts
        // SalePrice = (Target + FixedCosts) / Factor
        if (salePriceFactor > 0) {
            salePrice = (target + fixedCosts) / salePriceFactor
        }
    } else {
        // Target(Rate) = (NetProfit / SalePrice) * 100
        // NetProfit = SalePrice * (Target/100)
        // SalePrice * (Target/100) = SalePrice * Factor - FixedCosts
        // FixedCosts = SalePrice * (Factor - Target/100)
        // SalePrice = FixedCosts / (Factor - Target/100)

        const targetRatio = target / 100
        const denominator = salePriceFactor - targetRatio
        if (denominator > 0) {
            salePrice = fixedCosts / denominator
        }
    }

    return calculateTrendyolProfit(salePrice, cost, shipping, commissionRate, costVatRate, saleVatRate, isMicroExport)
}


export function safeParsePrice(val: any): number {
    if (val === null || val === undefined || val === '') return 0
    if (typeof val === 'number') return val

    let str = String(val).replace('₺', '').trim()
    if (!str) return 0

    // Check if it's Turkish format (1.000,29) or English format (1,000.29 / 1000.29)
    const hasComma = str.includes(',')
    const hasDot = str.includes('.')

    if (hasComma && hasDot) {
        const commaIdx = str.lastIndexOf(',')
        const dotIdx = str.lastIndexOf('.')
        if (commaIdx > dotIdx) {
            // Turkish: 1.000,29 -> remove dots, replace comma with dot
            return parseFloat(str.replace(/\./g, '').replace(',', '.'))
        } else {
            // English: 1,000.29 -> remove commas
            return parseFloat(str.replace(/,/g, ''))
        }
    }

    if (hasComma) {
        // Only comma: 1000,29 -> replace with dot
        return parseFloat(str.replace(',', '.'))
    }

    if (hasDot) {
        // Only dot: Danger zone. Could be 1.060 (Turkish thousands) or 1060.29 (decimal)
        // Rule of thumb for Trendyol: Prices usually have 2 decimal places. 
        // If the dot is followed by exactly 3 digits, it's likely a thousands separator.
        const parts = str.split('.')
        if (parts.length === 2 && parts[1].length === 3) {
            return parseFloat(str.replace(/\./g, ''))
        }
        return parseFloat(str)
    }

    return parseFloat(str) || 0
}
