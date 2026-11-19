"use client"
import { cn } from "@/lib/utils"
import { CheckCircle2, Truck, Home, Box, Clock, XCircle, Calendar, Store } from "lucide-react"

const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

interface StatusTimelineProps {
  status: string;
  isFinal?: boolean;
  wantsDelivery?: boolean;
  deliveryDate?: string | Date | null;
  deliveryScheduleDays?: string;
  noticeInTransitTitle?: string;
  noticeInTransitText?: string;
  noticeDeliveryText?: string;
}

export function OrderStatusTimeline({ 
  status, 
  isFinal, 
  wantsDelivery = false,
  deliveryDate,
  deliveryScheduleDays = "3,6",
  noticeInTransitTitle,
  noticeInTransitText,
  noticeDeliveryText
}: StatusTimelineProps) {
  const lowerStatus = (status || "").toLowerCase().trim();
  const isRejected = 
    lowerStatus.includes("цуцлагдсан") || 
    lowerStatus.includes("буцаагдсан") || 
    lowerStatus.includes("rejected") || 
    lowerStatus.includes("refund");

  // If status indicates delivery, force delivery timeline regardless of wantsDelivery prop
  const effectiveWantsDelivery = wantsDelivery || 
    lowerStatus.includes("хүргэлт") || 
    lowerStatus.includes("ажилтанд") || 
    lowerStatus.includes("жолооч") ||
    lowerStatus.includes("delivery");

  // Dynamic steps depending on delivery preference
  const steps = effectiveWantsDelivery ? [
    { 
      name: "Захиалга үүссэн", 
      icon: Clock, 
      matches: ["төлбөр хүлээгдэж байна", "хүлээгдэж байна", "pending", "шинэ", "үүссэн"] 
    },
    { 
      name: "Баталгаажсан", 
      icon: CheckCircle2, 
      matches: ["баталгаажсан", "батлагдсан", "төлөгдсөн", "confirmed", "paid"] 
    },
    { 
      name: "Солонгосоос хөдөлсөн", 
      icon: Truck, 
      matches: ["солонгосоос", "хөдөлсөн", "shipped", "departed", "тээвэрлэлтэд"] 
    },
    { 
      name: "Улаанбаатарт ирсэн", 
      icon: Box, 
      matches: ["улаанбаатарт", "монголд", "агуулахад", "ub ирсэн", "arrived", "ирсэн"] 
    },
    { 
      name: "Хүргэлтийн ажилтанд өгсөн", 
      icon: Truck, 
      matches: ["ажилтанд өгсөн", "ажилтанд", "хүргэлтэд гарсан", "хүргэлтэд яваа", "жолоочид", "out for delivery"] 
    },
    { 
      name: "Хүргэгдсэн", 
      icon: Home, 
      matches: ["хүргэгдсэн", "хүргэлтээр авсан", "хүргэлтээр гарсан", "дууссан", "хүлээн авсан", "хүлээж авсан", "delivered", "completed"] 
    },
  ] : [
    { 
      name: "Захиалга үүссэн", 
      icon: Clock, 
      matches: ["төлбөр хүлээгдэж байна", "хүлээгдэж байна", "pending", "шинэ", "үүссэн"] 
    },
    { 
      name: "Баталгаажсан", 
      icon: CheckCircle2, 
      matches: ["баталгаажсан", "батлагдсан", "төлөгдсөн", "confirmed", "paid"] 
    },
    { 
      name: "Солонгосоос хөдөлсөн", 
      icon: Truck, 
      matches: ["солонгосоос", "хөдөлсөн", "shipped", "departed", "тээвэрлэлтэд"] 
    },
    { 
      name: "Улаанбаатарт ирсэн", 
      icon: Box, 
      matches: ["улаанбаатарт", "монголд", "агуулахад", "ub ирсэн", "arrived", "ирсэн"] 
    },
    { 
      name: "Өөрөө хүлээн авсан", 
      icon: Store, 
      matches: ["өөрөө", "ирж авсан", "салбараас", "дууссан", "авсан", "хүлээн авсан", "хүлээж авсан", "picked up", "completed"] 
    },
  ];

  // Resolve current step index
  let currentStepIndex = -1;

  if (isRejected) {
    currentStepIndex = -1;
  } else if (isFinal) {
    // Non-rejected finalized orders have completed the entire lifecycle
    currentStepIndex = steps.length - 1;
  } else {
    // Check backwards from steps.length - 2 down to 0 so non-final orders do not prematurely hit final step
    for (let i = steps.length - 2; i >= 0; i--) {
      if (steps[i].matches.some(m => lowerStatus.includes(m))) {
        currentStepIndex = i;
        break;
      }
    }
    // Default to step 0 if not explicitly matched
    if (currentStepIndex === -1) {
      currentStepIndex = 0;
    }
  }

  // Progress Bar width calculation
  const progressWidth = isFinal ? 100 : (currentStepIndex / (steps.length - 1)) * 100;

  // Format delivery date if available
  let formattedDeliveryDate = "";
  if (deliveryDate) {
    try {
      const d = new Date(deliveryDate);
      if (!isNaN(d.getTime())) {
        formattedDeliveryDate = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${DAY_NAMES[d.getDay()]})`;
      }
    } catch {
      // fallback
    }
  }

  const scheduleDayNames = deliveryScheduleDays
    .split(",")
    .map(Number)
    .map(d => DAY_NAMES[d])
    .filter(Boolean)
    .join(", ");

  // Banner visibility states
  const showInTransitNotice = !isRejected && currentStepIndex === 2 && !isFinal;
  const showUbWaitingNotice = !isRejected && currentStepIndex === 3 && !isFinal;
  const showCourierHandoverNotice = !isRejected && wantsDelivery && currentStepIndex === 4 && !isFinal;
  const showCompletedNotice = !isRejected && isFinal;

  return (
    <div className="w-full py-2 sm:py-6 pl-2 sm:pl-0">
      <div className="relative flex flex-col sm:flex-row justify-between max-w-4xl mx-auto gap-8 sm:gap-0">
        {/* Progress Line (Mobile) */}
        <div className="absolute left-5 top-0 w-[2px] h-full -translate-x-1/2 z-0 rounded-full bg-slate-100 sm:hidden" />
        {/* Progress Line (Desktop) */}
        <div className="absolute top-5 left-0 w-full h-[2px] -translate-y-1/2 z-0 rounded-full bg-slate-100 hidden sm:block" />
        
        {!isRejected && (
          <>
            {/* Active Line (Mobile) */}
            <div 
              className="absolute left-5 top-0 w-[2px] bg-indigo-600 -translate-x-1/2 z-0 transition-all duration-700 ease-in-out rounded-full shadow-[0_0_8px_rgba(79,70,229,0.2)] sm:hidden" 
              style={{ height: `${progressWidth}%` }}
            />
            {/* Active Line (Desktop) */}
            <div 
              className="absolute top-5 left-0 h-[2px] bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full shadow-[0_0_8px_rgba(79,70,229,0.2)] hidden sm:block" 
              style={{ width: `${progressWidth}%` }}
            />
          </>
        )}

        {steps.map((step, index) => {
          const isCompleted = !isRejected && (index < currentStepIndex || (index === currentStepIndex && isFinal));
          const isCurrent = !isRejected && index === currentStepIndex && !isFinal;
          
          const showRejectedAtThisStep = isRejected && index === 0;
          const Icon = showRejectedAtThisStep ? XCircle : step.icon;

          return (
            <div key={`${step.name}-${index}`} className={cn(
              "relative z-10 flex flex-row sm:flex-col items-center group transition-all duration-500",
              isRejected && index > 0 && "opacity-30"
            )}>
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 shadow-sm",
                  showRejectedAtThisStep ? "bg-red-50 border-red-200 text-red-500 ring-4 ring-red-50/50" :
                  isCompleted ? "bg-indigo-600 border-indigo-600 text-white" : 
                  isCurrent ? "bg-white border-indigo-600 text-indigo-600 scale-110 shadow-md ring-4 ring-indigo-50" : 
                  "bg-white border-slate-200 text-slate-300"
                )}
              >
                <Icon size={18} className={cn(isCurrent && "animate-pulse")} />
              </div>
              <span 
                className={cn(
                  "ml-4 sm:ml-0 sm:absolute sm:-bottom-8 sm:whitespace-nowrap text-[11px] sm:text-[10px] font-bold transition-all duration-500 tracking-wider uppercase text-center",
                  showRejectedAtThisStep ? "text-red-600" :
                  isCurrent ? "text-indigo-700 font-extrabold" : 
                  isCompleted ? (isFinal && index === currentStepIndex ? "text-indigo-600" : "text-slate-500") : 
                  "text-slate-300"
                )}
              >
                {showRejectedAtThisStep ? "Цуцлагдсан" : step.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Notice 1: In Transit from Korea */}
      {showInTransitNotice && (
        <div className="mt-12 mx-auto max-w-md">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-sm animate-in fade-in zoom-in duration-500">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>{noticeInTransitTitle || "Ойролцоох хугацаа:"}</strong>{" "}
              {noticeInTransitText || "Бараа Солонгосоос хөдөлсөн бөгөөд хэвийн нөхцөлд 7-10 хоногийн дараа Улаанбаатарт ирдэг."}
            </p>
          </div>
        </div>
      )}

      {/* Notice 2: Arrived in UB - Waiting for Delivery Day or Self-Pickup */}
      {showUbWaitingNotice && (
        <div className="mt-12 mx-auto max-w-lg">
          {wantsDelivery ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-xs text-amber-900 leading-relaxed">
                {formattedDeliveryDate ? (
                  <div className="font-bold flex items-center gap-1.5 flex-wrap text-amber-950">
                    <span>📅 Сонгосон хүргэлтийн өдөр:</span>
                    <span className="text-indigo-700 bg-white border border-amber-200 px-2 py-0.5 rounded font-extrabold shadow-2xs">
                      {formattedDeliveryDate}
                    </span>
                  </div>
                ) : (
                  <p className="font-bold text-amber-950">🚚 Хүргэлтийн хуваарьт бүртгэгдсэн</p>
                )}
                <p className="mt-1.5 text-amber-800 text-[11px]">
                  Манай хүргэлт 7 хоногт 2 удаа (<strong>{scheduleDayNames || "Лхагва, Бямба"}</strong> гарагт) гардаг. Таны захиалга сонгосон өдрийн өглөө хүргэлтийн жолоочид шилжиж хаяг руу тань замдаа гарах болно.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold text-emerald-950">🏬 Агуулахад бэлэн болсон (Өөрөө очиж авах)</p>
                <p className="mt-1 text-emerald-800 text-[11px]">
                  {noticeDeliveryText || "Та манай салбар дээр өөрийн биеэр ирж захиалгаа авах боломжтой. Хэрэв хүргэлтээр авахыг хүсвэл доорх 'Хүргэлт захиалах' товчоор өдрөө сонгоно уу."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notice 3: Out for Delivery (Handed over to courier) */}
      {showCourierHandoverNotice && (
        <div className="mt-12 mx-auto max-w-lg">
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 text-indigo-700 animate-pulse">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-xs text-indigo-900 leading-relaxed">
              <p className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                🚚 Хүргэлтийн жолооч замдаа гарлаа!
              </p>
              <p className="mt-1 text-indigo-800 text-[11px]">
                Өнөөдөр таны товлосон хүргэлтийн өдөр тул хүргэлтийн ажилтан таны хаяг руу замдаа гарсан байна. Хүргэлт хийгдэх үед жолооч тантай утсаар холбогдох тул утсаа нээлттэй байлгана уу.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notice 4: Finalized Order Notice */}
      {showCompletedNotice && (
        <div className="mt-12 mx-auto max-w-lg">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] font-semibold text-emerald-800">
              {wantsDelivery ? "🎉 Захиалга амжилттай хүргэгдсэн байна. Манайхаар үйлчлүүлсэнд баярлалаа!" : "✅ Захиалгыг салбараас хүлээн авсан байна. Манайхаар үйлчлүүлсэнд баярлалаа!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
