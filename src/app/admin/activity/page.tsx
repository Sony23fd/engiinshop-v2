import { getCurrentAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Shield, Truck, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "ADMIN") redirect("/admin/orders/search")

  const { page: pageStr, q } = await searchParams
  const page = parseInt(pageStr || "1")
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const where = q
    ? {
        OR: [
          { userName: { contains: q, mode: "insensitive" as const } },
          { action: { contains: q, mode: "insensitive" as const } },
          { target: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [logs, total] = await Promise.all([
    (db as any).activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    (db as any).activityLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  function formatDate(d: string) {
    const dt = new Date(d)
    return dt.toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Үйлдлийн лог</h1>
          <p className="text-slate-500 text-sm mt-1">Нийт {total} бичлэг</p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Хайх..."
            className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Хайх
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">Хэзээ</th>
              <th className="px-4 py-3">Хэн</th>
              <th className="px-4 py-3">Эрх</th>
              <th className="px-4 py-3">Үйлдэл</th>
              <th className="px-4 py-3">Объект</th>
              <th className="px-4 py-3">Дэлгэрэнгүй</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Лог бичлэг байхгүй байна
                </td>
              </tr>
            ) : logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(log.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{log.userName}</td>
                <td className="px-4 py-3">
                  {log.userRole === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      <Shield className="w-3 h-3" /> Админ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      <Truck className="w-3 h-3" /> Карго
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">{log.action}</td>
                <td className="px-4 py-3">
                  {log.targetUrl ? (
                    <a href={log.targetUrl} className="text-indigo-600 hover:underline text-xs">
                      {log.target || log.targetUrl}
                    </a>
                  ) : (
                    <span className="text-slate-500 text-xs">{log.target || "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                  {log.detail || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3), page + 3
          ).map(p => (
            <a
              key={p}
              href={`?page=${p}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
