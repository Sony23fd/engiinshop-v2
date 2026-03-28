"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, Check, X, Star, Truck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createOrderStatus, updateOrderStatus, deleteOrderStatus } from "@/app/actions/order-status-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/admin/StatusBadge"

const TAILWIND_COLORS = [
  { name: "slate", class: "bg-slate-500" },
  { name: "gray", class: "bg-gray-500" },
  { name: "red", class: "bg-red-500" },
  { name: "orange", class: "bg-orange-500" },
  { name: "amber", class: "bg-amber-500" },
  { name: "yellow", class: "bg-yellow-500" },
  { name: "lime", class: "bg-lime-500" },
  { name: "green", class: "bg-green-500" },
  { name: "emerald", class: "bg-emerald-500" },
  { name: "teal", class: "bg-teal-500" },
  { name: "cyan", class: "bg-cyan-500" },
  { name: "sky", class: "bg-sky-500" },
  { name: "blue", class: "bg-blue-500" },
  { name: "indigo", class: "bg-indigo-500" },
  { name: "violet", class: "bg-violet-500" },
  { name: "purple", class: "bg-purple-500" },
  { name: "fuchsia", class: "bg-fuchsia-500" },
  { name: "pink", class: "bg-pink-500" },
  { name: "rose", class: "bg-rose-500" },
]

export default function OrderStatusClient({ initialStatuses }: { initialStatuses: any[] }) {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const ColorSelector = ({ prefix = "", defaultColor = "slate" }: { prefix?: string, defaultColor?: string }) => {
    const [color, setColor] = useState(defaultColor || "slate");
    return (
      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium text-slate-700">Төлвийн өнгө</label>
        <div className="flex flex-wrap gap-2">
          <input type="hidden" name={`${prefix}color`} value={color} />
          {TAILWIND_COLORS.map(c => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(c.name)}
              className={`w-6 h-6 rounded-full ${c.class} ring-offset-2 transition-all ${color === c.name ? 'ring-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
              title={c.name}
            />
          ))}
        </div>
      </div>
    )
  }

  async function handleAdd(formData: FormData) {
    setIsLoading(true)
    const name = formData.get("name") as string
    const color = formData.get("color") as string || "slate"
    const isFinal = formData.get("isFinal") === "true"
    const isDefault = formData.get("isDefault") === "true"
    const isDeliverable = formData.get("isDeliverable") === "true"

    const result = await createOrderStatus({ name, color, isFinal, isDefault, isDeliverable })
    setIsLoading(false)

    if (result.success && result.status) {
      let updated = [...statuses]
      if (isDefault) updated = updated.map(s => ({ ...s, isDefault: false }))
      setStatuses([...updated, { ...result.status, _count: { orders: 0 } }])
      setIsAddOpen(false)
      toast({ title: "Амжилттай", description: "Шинэ төлөв нэмэгдлээ." })
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: result.error || "Алдаа гарлаа" })
    }
  }

  async function handleEdit(formData: FormData) {
    if (!currentStatus) return
    setIsLoading(true)
    const name = formData.get("name") as string
    const color = formData.get("edit-color") as string || "slate"
    const isFinal = formData.get("isFinal") === "true"
    const isDefault = formData.get("isDefault") === "true"
    const isDeliverable = formData.get("isDeliverable") === "true"

    const result = await updateOrderStatus(currentStatus.id, { name, color, isFinal, isDefault, isDeliverable })
    setIsLoading(false)

    if (result.success && result.status) {
      let updated = statuses.map(s => s.id === currentStatus.id ? { ...result.status, _count: s._count } : s)
      // Unset other defaults in UI if this was set as default
      if (isDefault) updated = updated.map(s => s.id === currentStatus.id ? s : { ...s, isDefault: false })
      setStatuses(updated)
      setIsEditOpen(false)
      toast({ title: "Амжилттай", description: "Төлөв шинэчлэгдлээ." })
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: result.error || "Алдаа гарлаа" })
    }
  }

  async function handleDelete() {
    if (!currentStatus) return
    setIsLoading(true)
    const result = await deleteOrderStatus(currentStatus.id)
    setIsLoading(false)

    if (result.success) {
      setStatuses(statuses.filter(s => s.id !== currentStatus.id))
      setIsDeleteOpen(false)
      toast({ title: "Амжилттай", description: "Төлөв устгагдлаа." })
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: result.error || "Алдаа гарлаа" })
      setIsDeleteOpen(false)
    }
  }

  function openEdit(status: any) {
    setCurrentStatus(status)
    setIsEditOpen(true)
  }

  function openDelete(status: any) {
    setCurrentStatus(status)
    setIsDeleteOpen(true)
  }

  const StatusCheckboxGroup = ({ prefix = "" }: { prefix?: string }) => (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`${prefix}isFinal`} name="isFinal" value="true"
          defaultChecked={currentStatus?.isFinal || false}
          className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
        <label htmlFor={`${prefix}isFinal`} className="text-sm text-slate-700">
          Эцсийн төлөв (захиалга хаагддаг)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`${prefix}isDefault`} name="isDefault" value="true"
          defaultChecked={currentStatus?.isDefault || false}
          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
        <label htmlFor={`${prefix}isDefault`} className="text-sm text-slate-700 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          Анхдагч статус (шинэ захиалганд автоматаар оноогдоно)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`${prefix}isDeliverable`} name="isDeliverable" value="true"
          defaultChecked={currentStatus?.isDeliverable || false}
          className="rounded border-slate-300 text-blue-500 focus:ring-blue-500" />
        <label htmlFor={`${prefix}isDeliverable`} className="text-sm text-slate-700 flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-blue-500" />
          Хүргэлт захиалах боломжтой (хэрэглэгч хүргэлт авах захиалга өгч болно)
        </label>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Захиалгын төлөв тохиргоо</h1>
            <p className="text-sm text-slate-500 mt-1">
              <Star className="w-3 h-3 inline text-amber-400 mr-1" /> Анхдагч нь шинэ захиалганд оноогдоно.
              <Truck className="w-3 h-3 inline text-blue-500 mx-1" /> Хүргэлтийн нь хэрэглэгчид захиалах боломж олгоно.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
              <Plus className="w-4 h-4 mr-2 text-slate-600" />
              Шинэ төлөв нэмэх
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Шинэ төлөв үүсгэх</DialogTitle>
                <DialogDescription>
                  Захиалгын явцыг илтгэх төлөвийн нэрийг оруулна уу.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAdd} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Төлвийн нэр</label>
                  <Input id="name" name="name" required placeholder="Жишээ: Улаанбаатарт ирсэн" />
                </div>
                <ColorSelector />
                <StatusCheckboxGroup />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Болих</Button>
                  <Button type="submit" disabled={isLoading} className="bg-[#4F46E5] text-white">
                    {isLoading ? "Хадгалж байна..." : "Хадгалах"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b text-xs uppercase text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4 font-normal">Нэр</th>
                <th className="px-6 py-4 font-normal text-center">Эцсийн</th>
                <th className="px-6 py-4 font-normal text-center">Анхдагч</th>
                <th className="px-6 py-4 font-normal text-center">Хүргэлт</th>
                <th className="px-6 py-4 font-normal text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Одоогоор төлөв бүртгэгдээгүй байна
                  </td>
                </tr>
              ) : statuses.map((status: any) => (
                <tr key={status.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    <StatusBadge status={status.name} color={status.color} />
                    {status._count?.orders > 0 && (
                      <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {status._count.orders} захиалгатай
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {status.isFinal ? (
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {status.isDefault ? (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto" />
                    ) : (
                      <span className="text-slate-200">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {status.isDeliverable ? (
                      <Truck className="w-4 h-4 text-blue-500 mx-auto" />
                    ) : (
                      <span className="text-slate-200">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(status)} className="h-8 w-8 text-amber-500 hover:bg-slate-100">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(status)} className="h-8 w-8 text-red-500 hover:bg-slate-100">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Төлөв засах</DialogTitle>
          </DialogHeader>
          {currentStatus && (
            <form action={handleEdit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Төлвийн нэр</label>
                <Input id="edit-name" name="name" required defaultValue={currentStatus.name} />
              </div>
              <ColorSelector prefix="edit-" defaultColor={currentStatus.color} />
              <StatusCheckboxGroup prefix="edit-" />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Болих</Button>
                <Button type="submit" disabled={isLoading} className="bg-[#4F46E5] text-white">
                  {isLoading ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Төлөв устгах</DialogTitle>
            <DialogDescription>
              Та "{currentStatus?.name}" төлвийг устгахдаа итгэлтэй байна уу?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Устгаж байна..." : "Тийм, устгах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
