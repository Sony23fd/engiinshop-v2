"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchOrders, updateOrderStatus } from "@/app/actions/order-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

import { StatusBadge } from "@/components/admin/StatusBadge"
import { GroupStatusUpdater } from "./GroupStatusUpdater"
import { GroupAdminDeliveryButton } from "./GroupAdminDeliveryButton"

export default function SearchClient({ statuses }: { statuses: any[] }) {
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [confirmChange, setConfirmChange] = useState<{orderId: string, newStatusId: string, oldStatusId: string | null} | null>(null)
  const { toast } = useToast()

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    
    setLoading(true)
    const result = await searchOrders(query)
    setLoading(false)
    setHasSearched(true)
    
    if (result.success && result.orders) {
      setOrders(result.orders)
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: "Жагсаалт унших үед алдаа гарлаа",
      })
    }
  }

  async function executeStatusChange() {
    if (!confirmChange) return;
    const { orderId, newStatusId } = confirmChange;
    const prevOrders = [...orders]
    
    // Optimistic UI
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, statusId: newStatusId, status: statuses.find(s => s.id === newStatusId) } : o
    ))
    setConfirmChange(null)

    const result = await updateOrderStatus(orderId, newStatusId)
    
    if (result.success) {
      toast({
        title: "Амжилттай",
        description: "Захиалгын төлөв өөрчлөгдлөө.",
      })
    } else {
      setOrders(prevOrders)
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: "Захиалгын төлөв өөрчлөх боломжгүй байна.",
      })
    }
  }

  // Grouping logic based on `customerPhone` or `transactionRef` fallback
  const groupedOrders: Record<string, any[]> = {}
  orders.forEach((o) => {
    const key = o.customerPhone || o.transactionRef || o.id
    if (!groupedOrders[key]) groupedOrders[key] = []
    groupedOrders[key].push(o)
  })
  const groups = Object.values(groupedOrders)

  // Multi-select logic per group
  const [selectedIds, setSelectedIds] = useState<Record<string, string[]>>({})

  function toggleOrderSelection(groupKey: string, orderId: string) {
    setSelectedIds(prev => {
      const current = prev[groupKey] || []
      const next = current.includes(orderId) 
        ? current.filter(id => id !== orderId) 
        : [...current, orderId]
      return { ...prev, [groupKey]: next }
    })
  }

  function toggleGroupAll(groupKey: string, allIds: string[]) {
    setSelectedIds(prev => {
      const current = prev[groupKey] || []
      const allSelected = current.length === allIds.length
      return { ...prev, [groupKey]: allSelected ? [] : allIds }
    })
  }

  function refreshSearchData() {
    setSelectedIds({})
    handleSearch() // Re-fetch the orders to reflect new statuses
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      {!!confirmChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmChange(null)} />
          <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 border animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Төлөв өөрчлөхийг баталгаажуулах</h3>
            <p className="text-sm text-slate-500 mb-6">
              Та энэхүү захиалгын төлөвийг <strong className="text-slate-700">{confirmChange ? statuses.find(s => s.id === confirmChange.newStatusId)?.name : ''}</strong> болгон өөрчлөхдөө итгэлтэй байна уу?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmChange(null)}>Буцах</Button>
              <Button onClick={executeStatusChange} className="bg-[#4e3dc7] hover:bg-[#4338ca] text-white">Тийм, өөрчлөх</Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
          <Search className="w-4 h-4" /> Хайх
        </label>
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-1 text-lg py-6" 
            placeholder="Дансны дугаар, утасны дугаар эсвэл нэрээр хайх..." 
          />
          <Button type="submit" disabled={loading} className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-8 h-auto font-medium shadow-sm transition-all">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Хайх
          </Button>
        </form>
      </div>

      {!hasSearched ? null : groups.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border shadow-sm border-dashed flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-slate-700">Илэрц олдсонгүй</h3>
          <p className="text-muted-foreground">Таны хайлтад тохирох захиалга олдсонгүй.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-sm font-medium text-slate-500 pb-2 border-b">
            Олдсон үр дүн: <span className="font-bold text-slate-800">{orders.length}</span> захиалга ({groups.length} хэрэглэгч)
          </div>
          
          {groups.map((group) => {
            const first = group[0]
            const groupKey = first.customerPhone || first.transactionRef || first.id
            const selectedInGroup = selectedIds[groupKey] || []
            const groupIds = group.map(o => o.id)
            const allSelected = groupIds.every(id => selectedInGroup.includes(id)) && groupIds.length > 0
            const someSelected = selectedInGroup.length > 0 && !allSelected

            return (
              <div key={groupKey} className="bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 border-l-indigo-400">
                
                {/* Customer Header */}
                <div className="bg-slate-50 border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold text-lg">
                      {first.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-lg">{first.customerName}</span>
                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                          {first.customerPhone}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1 flex gap-2 items-center">
                        {first.accountNumber && (
                          <span className="font-mono bg-slate-200/50 px-1 rounded">Данс: {first.accountNumber}</span>
                        )}
                        <span className="text-slate-400">Сүүлд: {new Date(first.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                     <GroupAdminDeliveryButton 
                       selectedOrderIds={selectedInGroup}
                       onUpdated={refreshSearchData}
                     />
                     <GroupStatusUpdater 
                       selectedOrderIds={selectedInGroup} 
                       statuses={statuses} 
                       onUpdated={refreshSearchData} 
                     />
                  </div>
                </div>

                {/* Orders List with Checkboxes */}
                <div className="divide-y divide-slate-100">
                  <div className="px-5 py-2.5 bg-slate-50/50 flex items-center gap-3 border-b border-slate-100">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ml-1 cursor-pointer"
                      checked={allSelected}
                      ref={input => { if (input) input.indeterminate = someSelected }}
                      onChange={() => toggleGroupAll(groupKey, groupIds)}
                    />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleGroupAll(groupKey, groupIds)}>
                      Бүгдийг сонгох
                    </span>
                  </div>
                  
                  {group.map((order) => {
                    const isChecked = selectedInGroup.includes(order.id)
                    return (
                      <div 
                        key={order.id} 
                        className={`px-5 py-4 flex items-center gap-4 transition-colors ${isChecked ? 'bg-indigo-50/20' : 'hover:bg-slate-50'}`}
                      >
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ml-1 cursor-pointer mt-1"
                          checked={isChecked}
                          onChange={() => toggleOrderSelection(groupKey, order.id)}
                        />
                        
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Product Info */}
                          <div className="md:col-span-5 flex flex-col cursor-pointer" onClick={() => toggleOrderSelection(groupKey, order.id)}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 line-clamp-1">{order.batch?.product?.name}</span>
                              <span className="text-slate-400 text-xs font-mono bg-slate-100 px-1 rounded">#{order.orderNumber}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{order.quantity} ширхэг</span>
                          </div>
                          
                          {/* Price & Date */}
                          <div className="md:col-span-4 flex flex-col text-sm space-y-1">
                            <span className="text-slate-500">
                              Төлбөр: <strong className="text-slate-700">₮{Number(order.totalAmount || 0).toLocaleString()}</strong>
                            </span>
                            <span className="text-slate-400 text-xs">
                              Захиалсан: {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                            </span>
                          </div>
                          
                          {/* Status Dropdown */}
                          <div className="md:col-span-3 flex justify-end">
                            <Select 
                              value={order.statusId ? String(order.statusId) : undefined} 
                              onValueChange={(val) => {
                                if (val && val !== order.statusId) {
                                  setConfirmChange({
                                    orderId: order.id,
                                    newStatusId: val as string,
                                    oldStatusId: order.statusId || null
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 border-slate-200 h-9">
                                <SelectValue placeholder="Төлөв сонгох">
                                  {order.statusId ? (
                                    <StatusBadge status={statuses.find(s => s.id === order.statusId)?.name || ""} color={statuses.find(s => s.id === order.statusId)?.color} />
                                  ) : "Сонгох..."}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((s) => (
                                  <SelectItem key={s.id} value={String(s.id)}>
                                    <StatusBadge status={s.name} color={s.color} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

