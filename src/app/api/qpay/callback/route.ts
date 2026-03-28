import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkQPayPayment, createQPayEbarimt, getQPayPayment } from "@/lib/qpay"
import { orderEmitter } from "@/lib/orderEvents"

export async function GET(request: Request) {
  return handleCallback(request)
}

export async function POST(request: Request) {
  return handleCallback(request)
}

async function handleCallback(request: Request) {
  const { searchParams } = new URL(request.url)
  const transactionRef = searchParams.get("ref")
  const paymentId = searchParams.get("payment_id")

  if (!transactionRef) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 })
  }

  try {
    // Find orders with this ref
    const orders = await (db.order as any).findMany({
      where: { transactionRef }
    })

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const firstOrder = orders[0]
    
    // If already confirmed, nothing to do
    if (firstOrder.paymentStatus === "CONFIRMED") {
      return NextResponse.json({ success: true, message: "Already confirmed" })
    }

    const invoiceId = firstOrder.qpayInvoiceId
    if (!invoiceId) {
      return NextResponse.json({ error: "No QPay invoice found for this order" }, { status: 400 })
    }

    // Double check with QPay if the invoice is really paid
    let isPaid = false
    let finalPaymentId = paymentId

    const checkRes = await checkQPayPayment(invoiceId)
    if (checkRes.success && checkRes.data.count > 0) {
      // Find a successful payment row
      const paidRow = checkRes.data.rows?.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        isPaid = true
        finalPaymentId = paidRow.payment_id || finalPaymentId
      }
    }

    if (!isPaid) {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 })
    }

    let ebarimtId = null
    let ebarimtQr = null
    let ebarimtLottery = null

    // Payment is verified. Now create E-barimt if we found a payment_id
    if (finalPaymentId) {
      try {
        const ebRes = await createQPayEbarimt(finalPaymentId)
        if (ebRes.success) {
          ebarimtId = ebRes.data.id || ebRes.data.billId
          ebarimtQr = ebRes.data.qr_data || ebRes.data.qrCode // depending on QPay exact response
          ebarimtLottery = ebRes.data.lottery || ebRes.data.lotteryWarningMsg
        }
      } catch (err) {
        console.error("Failed to generate E-barimt:", err)
        // We continue even if ebarimt fails, so the order is still confirmed
      }
    }

    // Find or create the web confirmed status
    let webConfirmedStatus = await db.orderStatusType.findFirst({
      where: { name: "Захиалга баталгаажсан /Вэбээр/" }
    });
    
    if (!webConfirmedStatus) {
      webConfirmedStatus = await db.orderStatusType.create({
        data: {
          name: "Захиалга баталгаажсан /Вэбээр/",
          color: "blue",
          isDefault: false,
          isFinal: false,
          isDeliverable: true
        }
      });
    }

    // Update orders in DB
    await (db.order as any).updateMany({
      where: { transactionRef },
      data: {
        paymentStatus: "CONFIRMED",
        statusId: webConfirmedStatus.id,
        ebarimtId: ebarimtId,
        ebarimtQr: ebarimtQr,
        ebarimtLottery: ebarimtLottery
      }
    })

    // Prepare notification logic
    const totalAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0)
    const name = orders[0].customerName
    const phone = orders[0].customerPhone

    // Emit event for realtime Admin notification
    orderEmitter.emit("order-confirmed", {
      transactionRef,
      name,
      phone,
      totalAmount
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("QPay callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
