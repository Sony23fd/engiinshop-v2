import { Button } from "@/components/ui/button"
import { Plus, Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getBatchesByCategory, createBatch } from "@/app/actions/batch-actions"
import { getCategoryById, getCategories } from "@/app/actions/category-actions"
import { getCurrentAdmin } from "@/lib/auth"
import Link from "next/link"
import { notFound } from "next/navigation"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Edit2, Trash2 } from "lucide-react"
import { BatchRowActions } from "./BatchRowActions"
import { CategoryDeliveryFeeEditor } from "./CategoryDeliveryFeeEditor"
import { ArchiveCategoryButton } from "./ArchiveCategoryButton"
import { CreateBatchSheet } from "./CreateBatchSheet"
import { CategorySearch } from "./CategorySearch"

import { CategoryBatchesTable } from "./CategoryBatchesTable"

export default async function CategoryBatchesPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ categoryId: string }> 
  searchParams?: Promise<{ q?: string; filter?: string; page?: string }>
}) {
  const { categoryId } = await params;
  const sp = searchParams ? await searchParams : ({} as { q?: string; filter?: string; page?: string });
  const query = sp.q?.toLowerCase() || "";
  const filterPreOrder = sp.filter === 'preorder';
  const page = sp.page ? parseInt(sp.page, 10) : 1;
  const itemsPerPage = 50;

  const admin = await getCurrentAdmin()
  const role = admin?.role || "ADMIN"

  const [{ batches, success }, { category }, { categories }] = await Promise.all([
    getBatchesByCategory(categoryId),
    getCategoryById(categoryId),
    getCategories()
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/admin/orders" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{category.name} - Ангиллын бараанууд</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Category delivery fee — applies to all batches */}
        <div className="flex-1">
          <CategoryDeliveryFeeEditor
            categoryId={categoryId}
            initialFee={Number((category as any).deliveryFee || 0)}
          />
        </div>
        <ArchiveCategoryButton categoryId={categoryId} isArchived={(category as any).isArchived ?? false} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm w-full border">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <CategorySearch />
            <Link href={filterPreOrder ? `/admin/orders/category/${categoryId}` : `/admin/orders/category/${categoryId}?filter=preorder`}
              className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${filterPreOrder ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white hover:bg-slate-50 text-slate-600'}`}>
              ✈️ Карго хүлээж буй харах
            </Link>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {role !== "CARGO_ADMIN" && (
              <CreateBatchSheet categoryId={categoryId} categoryName={category.name} />
            )}
          </div>
        </div>

        {/* Batches Table Component (Client-side for selection and bulk actions) */}
        <CategoryBatchesTable 
          batches={batches || []}
          query={query}
          filterPreOrder={filterPreOrder}
          categoryId={categoryId}
          role={role}
          categories={categories || []}
          page={page}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  )
}
