/**
 * Telegram Bot мэдэгдлийн модуль
 * .env эсвэл ShopSettings дээр TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID тохируулсан үед 
 * админы Telegram суваг / групп руу шинэ захиалга, баталгаажилт, хүргэлтийн хүсэлтийг шууд илгээнэ.
 */

export async function sendTelegramNotification(htmlMessage: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

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
