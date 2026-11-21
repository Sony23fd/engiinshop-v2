import { db } from "./db"

/**
 * Telegram Bot мэдэгдлийн модуль
 * .env эсвэл ShopSettings дээр TELEGRAM_BOT_TOKEN (эсвэл telegram_bot_token), 
 * TELEGRAM_CHAT_ID (эсвэл telegram_chat_id) тохируулсан үед 
 * админы Telegram суваг / групп руу шинэ захиалга, баталгаажилт, хүргэлтийн хүсэлтийг шууд илгээнэ.
 */

async function getTelegramCredentials(customToken?: string, customChatId?: string): Promise<{ token: string | null; chatId: string | null }> {
  let token = customToken || process.env.TELEGRAM_BOT_TOKEN || null
  let chatId = customChatId || process.env.TELEGRAM_CHAT_ID || null

  if (!token || !chatId) {
    try {
      const [tokenSetting, chatSetting] = await Promise.all([
        db.shopSettings.findUnique({ where: { key: "telegram_bot_token" } }),
        db.shopSettings.findUnique({ where: { key: "telegram_chat_id" } })
      ])
      if (!token && tokenSetting?.value) token = tokenSetting.value
      if (!chatId && chatSetting?.value) chatId = chatSetting.value
    } catch {}
  }

  return { token, chatId }
}

export async function sendTelegramNotification(htmlMessage: string): Promise<boolean> {
  const { token, chatId } = await getTelegramCredentials()

  if (!token || !chatId) {
    // Not configured, silently ignore without affecting app
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: "HTML",
        disable_web_page_preview: true
      }),
      // Short timeout to never block user response
      signal: AbortSignal.timeout(4000)
    })
    return res.ok
  } catch (error) {
    console.warn("Telegram notification error:", error)
    return false
  }
}

export async function sendTestTelegramMessage(customToken?: string, customChatId?: string): Promise<{ success: boolean; error?: string }> {
  const { token, chatId } = await getTelegramCredentials(customToken, customChatId)

  if (!token) return { success: false, error: "Telegram Bot Token тохируулаагүй байна." }
  if (!chatId) return { success: false, error: "Telegram Chat ID тохируулаагүй байна." }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 <b>ТУРШИЛТ: Telegram холболт амжилттай боллоо!</b>\n\nСистемийн шинэ захиалга, баталгаажилт, хүргэлтийн мэдэгдлүүд энэ групп рүү шууд илгээгдэхэд бэлэн боллоо.\n⏰ ${new Date().toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}`,
        parse_mode: "HTML",
        disable_web_page_preview: true
      }),
      signal: AbortSignal.timeout(6000)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      return { success: false, error: errData?.description || `Telegram API алдаа: status ${res.status}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Сүлжээний алдаа гарлаа" }
  }
}
