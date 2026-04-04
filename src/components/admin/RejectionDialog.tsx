"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle } from "lucide-react"

interface RejectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  title?: string
  description?: string
  isLoading?: boolean
}

export function RejectionDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Захиалга цуцлах",
  description = "Та энэ захиалгыг цуцлах шалтгаанаа оруулна уу. Энэ тайлбар хэрэглэгчид харагдах болно.",
  isLoading = false,
}: RejectionDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = async () => {
    await onConfirm(reason)
    setReason("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Жишээ: Төлбөр дутуу, Бараа дууссан гэх мэт..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] border-slate-200 focus:ring-red-500"
            disabled={isLoading}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Болих
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isLoading || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 font-bold"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Цуцлахыг баталгаажуулах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
