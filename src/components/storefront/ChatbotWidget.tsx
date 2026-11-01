"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, X, MessageSquare, ChevronDown, Search, Phone, ExternalLink, RotateCcw } from "lucide-react"
import Link from "next/link"
import { DEFAULT_FAQS } from "@/app/admin/faqs/FaqAdminClient"

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
  faqId?: string
}

export function ChatbotWidget({ faqs }: { faqs: FaqNode[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const initialGreeting: Message = {
    id: "init_1",
    isBot: true,
    text: "Сайн байна уу? Танд юугаар туслах вэ? Түгээмэл асуултуудаас сонгон шуурхай зааварчилгаа авах боломжтой."
  }
  const [messages, setMessages] = useState<Message[]>([initialGreeting])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use configured FAQs or fallback to rich defaults
  const activeFaqs = (faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS)
    .filter(f => f.isActive)
    .sort((a, b) => a.order - b.order)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener("open-chatbot", handleOpen)
    return () => window.removeEventListener("open-chatbot", handleOpen)
  }, [])

  function handleQuestionClick(faq: FaqNode) {
    const userMsg: Message = { id: Date.now().toString(), isBot: false, text: faq.question }
    setMessages(prev => [...prev, userMsg])
    
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        isBot: true,
        text: faq.answer,
        faqId: faq.id
      }
      setMessages(prev => [...prev, botMsg])
    }, 350)
  }

  function handleReset() {
    setMessages([initialGreeting])
  }

  const filteredFaqs = activeFaqs.filter(faq => {
    if (categoryFilter === "all") return true
    const q = faq.question.toLowerCase()
    const a = faq.answer.toLowerCase()
    if (categoryFilter === "payment") {
      return q.includes("төлбөр") || q.includes("гүйлгээ") || a.includes("qpay") || a.includes("данс")
    }
    if (categoryFilter === "cargo") {
      return q.includes("карго") || q.includes("хүргэлт") || q.includes("хоног") || a.includes("солонгос")
    }
    if (categoryFilter === "other") {
      return q.includes("хаяг") || q.includes("авах") || q.includes("цуцлах") || q.includes("холбогдох") || q.includes("шалгах")
    }
    return true
  })

  return (
    <>
      {/* Floating Button (Desktop) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-gradient-to-tr from-[#3f2fb8] to-[#5a48db] rounded-full shadow-[0_8px_30px_rgba(78,61,199,0.35)] hidden md:flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 group border border-white/20"
        title="Туслах ажилтан"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 md:bottom-24 right-0 md:right-6 w-full md:w-[400px] h-[85vh] md:h-[620px] max-h-screen bg-white md:rounded-2xl shadow-2xl flex flex-col z-[101] animate-in slide-in-from-bottom-5 duration-300 border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4433bf] to-indigo-600 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/25">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Туслах ажилтан</h3>
                <p className="text-[11px] text-indigo-100 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Шууд хариулахад бэлэн
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleReset} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                title="Шинээр эхлэх"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden">
                <ChevronDown className="w-6 h-6" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => {
              const isTrackRelated = msg.text.includes("Захиалга шалгах") || msg.text.includes("/track")
              const isPhoneRelated = msg.text.includes("8853 9667") || msg.text.includes("8853 9887")
              const isFacebookRelated = msg.text.includes("Anar Korea Shop") || msg.text.includes("Facebook")

              return (
                <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                    msg.isBot 
                      ? "bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm leading-relaxed" 
                      : "bg-[#4e3dc7] text-white shadow-md rounded-tr-sm"
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Interactive Action Buttons */}
                    {msg.isBot && (isTrackRelated || isPhoneRelated || isFacebookRelated) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                        {isTrackRelated && (
                          <Link 
                            href="/track" 
                            onClick={() => setIsOpen(false)} 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            <Search className="w-3.5 h-3.5 text-indigo-600" /> Захиалга шалгах
                          </Link>
                        )}
                        {isPhoneRelated && (
                          <a 
                            href="tel:+97688539667" 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" /> 8853-9667 залгах
                          </a>
                        )}
                        {isFacebookRelated && (
                          <a 
                            href="https://www.facebook.com/profile.php?id=100086582256535" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Facebook хуудас
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies & Filter Tabs */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Түгээмэл асуултууд</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${categoryFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Бүгд
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("payment")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${categoryFilter === "payment" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Төлбөр
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("cargo")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${categoryFilter === "cargo" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Карго & Хүргэлт
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("other")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${categoryFilter === "other" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Бусад
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[145px] custom-scrollbar pb-1">
              {filteredFaqs.map(faq => (
                <button
                  key={faq.id}
                  onClick={() => handleQuestionClick(faq)}
                  className="bg-indigo-50/80 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-800 border border-indigo-100/90 px-3 py-1.5 rounded-full text-xs font-semibold transition-all text-left"
                >
                  {faq.question}
                </button>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="text-xs text-slate-400 p-2">Энэ ангилалд тохирох асуулт олдсонгүй.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
