"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CreateBatchForm } from "./CreateBatchForm"

export function CreateBatchSheet({ categoryId, categoryName }: { categoryId: string, categoryName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca] shrink-0">
        <Plus className="w-4 h-4 mr-2" />
        Бараа нэмэх
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Шинэ бараа үүсгэх ({categoryName})</SheetTitle>
        </SheetHeader>
        <CreateBatchForm 
          categoryId={categoryId} 
          onSuccess={() => {
            setIsOpen(false)
            router.refresh()
          }} 
        />
      </SheetContent>
    </Sheet>
  )
}
