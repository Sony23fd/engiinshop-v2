import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { DashboardCharts } from "./DashboardCharts"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;

  const now = new Date();
  
  let totalRevenue = 0;
  let successfulOrdersCount = 0;
  let completedOrdersCount = 0;
  let activeProductsCount = 0;
  let pendingRefundsCount = 0;
  let revenueData: { date: string, amount: number }[] = [];
  let batchSales: { name: string, sales: number }[] = [];

  try {
    const validOrderFilter: any = {
      status: {
        isDefault: false,
        name: { not: "Цуцлагдсан" }
      }
    };
    
    let dateFilter: any = {};
    if (days > 0) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { gte: cutoffDate } };
      validOrderFilter.updatedAt = { gte: cutoffDate };
    }

    // 1. Total Revenue (All orders that are progressed beyond Pending and not Cancelled)
    const revenueResult = await db.order.aggregate({
      where: validOrderFilter,
      _sum: { totalAmount: true }
    })
    totalRevenue = Number(revenueResult._sum?.totalAmount || 0);

    // 2. Total Confirmed Orders
    successfulOrdersCount = await db.order.count({
      where: validOrderFilter
    })

    // 3. Completed Orders
    completedOrdersCount = await db.order.count({
      where: { 
        status: { isFinal: true, name: { not: "Цуцлагдсан" } },
        ...dateFilter
      }
    })

    // 4. Active Products
    activeProductsCount = await db.product.count({
      where: { isActive: true }
    })

    // 5. Refunds tracking
    pendingRefundsCount = await (db.order as any).count({
      where: {
        status: { name: { contains: "Буцаагдсан" } },
        isRefunded: false
      }
    })

    // Chart 1: Revenue last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await db.order.findMany({
      where: { 
        createdAt: { gte: sevenDaysAgo },
        ...validOrderFilter
      },
      select: { createdAt: true, totalAmount: true }
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      revenueByDate[dateStr] = 0;
    }
    
    recentOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (revenueByDate[dateStr] !== undefined) {
        revenueByDate[dateStr] += Number(order.totalAmount || 0);
      }
    });

    revenueData = Object.keys(revenueByDate).map(date => ({
      date: date.substring(5), // MM-DD
      amount: revenueByDate[date]
    }));

    // Chart 2: Top 10 performing batches
    const batches = await db.batch.findMany({
      include: { product: true },
    });
    batchSales = batches.map(b => {
      const sold = b.targetQuantity - b.remainingQuantity;
      return {
        name: b.product?.name?.substring(0, 15) + "..." || "Бараа",
        sales: sold > 0 ? sold : 0
      };
    }).filter(b => b.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 10);
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
  }

  return (
    <div className="space-y-6">
      {pendingRefundsCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-rose-800 text-sm">Анхаар: Мөнгө буцаалт хүлээгдэж байна!</h3>
              <p className="text-rose-600 text-sm mt-0.5">Танд хүмүүс рүү мөнгийг нь дансаар буцаан шилжүүлэх шаардлагатай <strong>{pendingRefundsCount}</strong> ширхэг захиалга байна. Марталгүй шилжүүлж баталгаажуулна уу.</p>
            </div>
          </div>
          <Link href="/admin/orders/refunds" className="text-xs font-bold bg-white text-rose-600 border border-rose-200 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap">
            Яг одоо шалгах
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Хянах самбар</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Дэлгүүрийн үйл ажиллагаа болон статистик.
          </p>
        </div>
        <DateRangeFilter days={days} basePath="/admin/home" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Нийт Орлого</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-[#4e3dc7]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">₮{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Баталгаажсан Захиалга</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{successfulOrdersCount.toLocaleString()} ш</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Дууссан Захиалга</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{completedOrdersCount.toLocaleString()} ш</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Идэвхтэй Бараа</CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{activeProductsCount.toLocaleString()} төрөл</div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts revenueData={revenueData} topProducts={batchSales} />
    </div>
  )
}
