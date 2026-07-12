import { getIncomes, getExpenses, getTrendyolOrders, getLowStockProducts } from '@/lib/actions';
import OdemelerRaporuContent from '@/components/OdemelerRaporuDashboard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [incomes, expenses, trendyolOrdersData, lowStockProducts] = await Promise.all([
    getIncomes(),
    getExpenses(),
    getTrendyolOrders(0, 1000), // Get recent orders to analyze statuses
    getLowStockProducts()
  ]);

  const trendyolOrders = trendyolOrdersData?.content || [];

  return (
    <OdemelerRaporuContent 
      incomes={incomes}
      expenses={expenses}
      trendyolOrders={trendyolOrders}
      lowStockProducts={lowStockProducts}
    />
  );
}