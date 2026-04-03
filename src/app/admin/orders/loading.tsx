export default function OrdersLoading() {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="h-10 w-full md:w-1/3 bg-slate-100 rounded-lg animate-pulse" />
          <div className="flex gap-2 justify-end w-full md:w-2/3">
             <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
             <div className="h-9 w-48 bg-slate-50 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="px-4 py-3 h-12">
                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 w-full bg-slate-50 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
