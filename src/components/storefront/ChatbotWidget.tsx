"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, X, MessageSquare, ChevronDown, Send } from "lucide-react"

export type FaqNode = {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

type Message = {
  id: string
  isBot: boolean
  text: string
}

export function ChatbotWidget({ faqs }: { faqs: FaqNode[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", isBot: true, text: "Сайн байна уу? Танд юугаар туслах вэ? Доорх асуултуудаас сонгож зааварчилгаа авах боломжтой." }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  useEffect(() => {
    // Global listener to open chatbot from anywhere (e.g. MobileBottomNav)
    const handleOpen = () => setIsOpen(true)
    window.addEventListener("open-chatbot", handleOpen)
    return () => window.removeEventListener("open-chatbot", handleOpen)
  }, [])

  function handleQuestionClick(faq: FaqNode) {
    // Add user question
    const userMsg: Message = { id: Date.now().toString(), isBot: false, text: faq.question }
    setMessages(prev => [...prev, userMsg])
    
    // Simulate typing delay
    setTimeout(() => {
      const botMsg: Message = { id: (Date.now() + 1).toString(), isBot: true, text: faq.answer }
      setMessages(prev => [...prev, botMsg])
    }, 400)
  }

  return (
    <>
      {/* Floating Button (Desktop) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-[#4e3dc7] rounded-full shadow-[0_8px_30px_rgba(78,61,199,0.3)] hidden md:flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 md:bottom-24 right-0 md:right-6 w-full md:w-[380px] h-[85vh] md:h-[600px] max-h-screen bg-white md:rounded-2xl shadow-2xl flex flex-col z-[101] animate-in slide-in-from-bottom-5 duration-300 border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4e3dc7] to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Туслах ажилтан</h3>
                <p className="text-[11px] text-indigo-100 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Шууд хариулах болно
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden">
              <ChevronDown className="w-6 h-6" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.isBot 
                    ? "bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm whitespace-pre-wrap leading-relaxed" 
                    : "bg-[#4e3dc7] text-white shadow-md rounded-tr-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Түгээмэл асуултууд</p>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[150px] custom-scrollbar pb-2">
              {faqs.filter(f => f.isActive).map(faq => (
                <button
                  key={faq.id}
                  onClick={() => handleQuestionClick(faq)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors text-left"
                >
                  {faq.question}
                </button>
              ))}
              {faqs.filter(f => f.isActive).length === 0 && (
                <div className="text-xs text-slate-400 p-2">Одоогоор зааварчилгаа байхгүй байна.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
