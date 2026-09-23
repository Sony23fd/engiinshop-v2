import { EventEmitter } from "events"
import { sendTelegramNotification } from "./telegram"

const globalForEmitter = global as unknown as { orderEmitter?: EventEmitter }
if (!globalForEmitter.orderEmitter) {
  globalForEmitter.orderEmitter = new EventEmitter()
  globalForEmitter.orderEmitter.setMaxListeners(100)

  // Attach automated Telegram notifications
  globalForEmitter.orderEmitter.on("order-confirmed", (e: OrderConfirmedEvent) => {
    const msg = `✅ <b>ТӨЛБӨР БАТАЛГААЖЛАА!</b>\n` +
      `👤 Захиалагч: <b>${e.name}</b> (${e.phone})\n` +
      `💰 Төлсөн дүн: <b>${Number(e.totalAmount || 0).toLocaleString()}₮</b>\n` +
      `🔗 Код: <code>${e.transactionRef}</code>`
    sendTelegramNotification(msg).catch(() => {})
  })
}
export const orderEmitter = globalForEmitter.orderEmitter

// ── Types ────────────────────────────────────────────────────────────────────

export interface NewOrderEvent {
  transactionRef: string
  customerName: string
  customerPhone?: string
  items: Array<{
    orderId: string
    productName: string
    quantity: number
    totalAmount: number
    batchId: string
  }>
  totalAmount: number
  wantsDelivery: boolean
  createdAt: string
}

export type OrderConfirmedEvent = {
  transactionRef: string
  name: string
  phone: string
  totalAmount: number
}

export type DeliveryRequestEvent = {
  customerName: string
  customerPhone: string
  address: string
  orderCount: number
  createdAt: string
}

// ── Server-side debounce grouping ────────────────────────────────────────────
// Multiple createOrder calls share the same transactionRef (cart checkout).
// We buffer them for 800ms then emit a single grouped notification.

const globalForBuffer = global as unknown as {
  _orderBuffer?: Map<string, { event: NewOrderEvent; timer: ReturnType<typeof setTimeout> }>
}
if (!globalForBuffer._orderBuffer) {
  globalForBuffer._orderBuffer = new Map()
}
const orderBuffer = globalForBuffer._orderBuffer

export function emitNewOrder(event: Omit<NewOrderEvent, "items"> & {
  item: NewOrderEvent["items"][0]
}) {
  const ref = event.transactionRef
  const existing = orderBuffer.get(ref)

  if (existing) {
    // Merge item into existing group
    clearTimeout(existing.timer)
    existing.event.items.push(event.item)
    existing.event.totalAmount += event.item.totalAmount
  } else {
    // New group
    const grouped: NewOrderEvent = {
      transactionRef: ref,
      customerName: event.customerName,
      customerPhone: event.customerPhone,
      items: [event.item],
      totalAmount: event.item.totalAmount,
      wantsDelivery: event.wantsDelivery,
      createdAt: event.createdAt,
    }
    orderBuffer.set(ref, { event: grouped, timer: null as any })
  }

  const entry = orderBuffer.get(ref)!
  entry.timer = setTimeout(() => {
    orderEmitter.emit("new-order", entry.event)

    // Send Telegram alert
    const itemsList = entry.event.items
      .map(i => `• ${i.productName} (${i.quantity}ш) - ${Number(i.totalAmount).toLocaleString()}₮`)
      .join("\n")
    const msg = `🛍️ <b>ШИНЭ ЗАХИАЛГА ИРЛЭЭ!</b>\n` +
      `👤 Захиалагч: <b>${entry.event.customerName}</b> (${entry.event.customerPhone || "Утасгүй"})\n` +
      `💰 Нийт дүн: <b>${Number(entry.event.totalAmount).toLocaleString()}₮</b>\n` +
      `📦 Бараанууд:\n${itemsList}\n` +
      `🚚 Хүргэлт: ${entry.event.wantsDelivery ? "Тийм" : "Үгүй"}\n` +
      `🔗 Код: <code>${entry.event.transactionRef}</code>`
    sendTelegramNotification(msg).catch(() => {})

    orderBuffer.delete(ref)
  }, 800) // wait 800ms for any additional items from same checkout
}

export function emitDeliveryRequest(event: DeliveryRequestEvent) {
  orderEmitter.emit("delivery-request", event)

  // Send Telegram alert
  const msg = `🚚 <b>ХҮРГЭЛТИЙН ХҮСЭЛТ ИРЛЭЭ!</b>\n` +
    `👤 Захиалагч: <b>${event.customerName}</b> (${event.customerPhone})\n` +
    `📍 Хаяг: <b>${event.address}</b>\n` +
    `📦 Захиалгын тоо: <b>${event.orderCount}ш</b>`
  sendTelegramNotification(msg).catch(() => {})
}
