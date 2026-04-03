import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { DashboardCharts } from "./DashboardCharts"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"
import Link from "next/link"
import { getAnalyticsSummary } from "@/app/actions/analytics-actions"

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
  
  // Analytics stats
  let analyticsStats: any = null;

  try {
    const validOrderFilter: any = {
      paymentStatus: { not: "REJECTED" },
      OR: [
        { statusId: null },
        { 
          status: {
            name: { not: "Цуцлагдсан" }
          }
        }
      ]
    };
    
    if (days > 0) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      validOrderFilter.createdAt = { gte: cutoffDate };
    }

    // Parallel fetch all data
    const [
      revenueResult,
      confirmedCount,
      completedCount,
      activeCount,
      refundsCount,
      analyticsResult
    ] = await Promise.all([
      db.order.aggregate({ where: validOrderFilter, _sum: { totalAmount: true } }),
      db.order.count({ where: validOrderFilter }),
      db.order.count({ 
        where: { 
          status: { isFinal: true, name: { not: "Цуцлагдсан" } },
          ...(days > 0 && { createdAt: { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) } })
        } 
      }),
      db.product.count({ where: { isActive: true } }),
      (db.order as any).count({ where: { status: { name: { contains: "Буцаагдсан" } }, isRefunded: false } }),
      getAnalyticsSummary(days)
    ]);

    totalRevenue = Number(revenueResult._sum?.totalAmount || 0);
    successfulOrdersCount = confirmedCount;
    completedOrdersCount = completedCount;
    activeProductsCount = activeCount;
    pendingRefundsCount = refundsCount;
    analyticsStats = analyticsResult.success ? analyticsResult.stats : null;

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

    // Chart 2: Top 10 performing batches (Based on actual orders in the selected period)
    const topSalesGroups = await db.order.groupBy({
      by: ['batchId'],
      where: validOrderFilter,
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    if (topSalesGroups.length > 0) {
      const topBatchIds = topSalesGroups.map(group => group.batchId);
      const batchesInfo = await db.batch.findMany({
        where: { id: { in: topBatchIds } },
        include: { product: true }
      });

      batchSales = topSalesGroups.map(group => {
        const batch = batchesInfo.find(b => b.id === group.batchId);
        const name = batch?.product?.name || "Нэргүй бараа";
        return {
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          sales: group._sum.quantity || 0
        };
      });
    } else {
      batchSales = [];
    }
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Хянах самбар</h1>
            {analyticsStats && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-100 animate-pulse">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {analyticsStats.activeUsers} LIVE
              </div>
            )}
          </div>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Дэлгүүрийн үйл ажиллагаа болон бодит хандалтын статистик.
          </p>
        </div>
        <DateRangeFilter days={days} basePath="/admin/home" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-500">Нийт Орлого</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4 text-[#4e3dc7]" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black text-slate-900">₮{totalRevenue.toLocaleString()}</div>
          </CardContent>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl"></div>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-500">Захиалга</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black text-slate-900">{successfulOrdersCount.toLocaleString()} ш</div>
          </CardContent>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-green-50/30 rounded-full blur-2xl"></div>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-500">Зочид</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black text-slate-900">
              {analyticsStats ? analyticsStats.uniqueVisitors.toLocaleString() : "..."}
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-50/30 rounded-full blur-2xl"></div>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-500">Нийт хандалт</CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black text-slate-900">
              {analyticsStats ? analyticsStats.totalViews.toLocaleString() : "..."}
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-50/30 rounded-full blur-2xl"></div>
        </Card>
      </div>

      <DashboardCharts 
        revenueData={revenueData} 
        topProducts={batchSales} 
        viewsOverTime={analyticsStats?.viewsOverTime || []} 
      />
    </div>
  )
}
