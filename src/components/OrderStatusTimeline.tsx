"use client"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Truck, Package, Home, Box, Clock, AlertCircle, XCircle } from "lucide-react"

interface StatusTimelineProps {
  status: string; // Current status name
  isFinal?: boolean;
}

export function OrderStatusTimeline({ status, isFinal }: StatusTimelineProps) {
  const isRejected = status.toLowerCase().includes("цуцлагдсан") || status.toLowerCase().includes("rejected");

  const steps = [
    { name: "Хүлээн авсан", icon: Clock, matches: ["Төлбөр хүлээгдэж байна", "Хүлээн авсан", "Received", "Pending"] },
    { name: "Баталгаажсан", icon: CheckCircle2, matches: ["Баталгаажсан", "Confirmed", "Батлагдсан"] },
    { name: "Солонгосоос гарсан", icon: Truck, matches: ["Солонгосоос гарсан", "Shipped", "Гарсан", "хөдөлсөн", "Departed"] },
    { name: "Улаанбаатарт ирсэн", icon: Box, matches: ["Ирсэн", "Arrived", "Монголд ирсэн", "Улаанбаатарт ирсэн", "UB ирсэн"] },
    { name: "Хүлээн авсан", icon: Home, matches: ["Өөрөө ирж авсан", "Хүргэлтээр авсан", "Delivered", "Picked up", "Дууссан", "Авсан"] },
  ];

  // Find the current step index
  let currentStepIndex = steps.findIndex(step => 
    step.matches.some(m => status.toLowerCase().includes(m.toLowerCase()))
  );

  // Default to step 0 if not found
  if (currentStepIndex === -1) {
    currentStepIndex = 0;
  }

  // If rejected, special case
  if (isRejected) {
    currentStepIndex = -1;
  }

  // Progress Bar width calculation
  const progressWidth = isFinal ? 100 : (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-6">
      <div className="relative flex justify-between max-w-4xl mx-auto">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-[2px] -translate-y-1/2 z-0 rounded-full bg-slate-100" />
        {!isRejected && (
          <div 
            className="absolute top-5 left-0 h-[2px] bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full shadow-[0_0_8px_rgba(79,70,229,0.2)]" 
            style={{ width: `${progressWidth}%` }}
          />
        )}

        {steps.map((step, index) => {
          // If isFinal is true, treat EVERY step up to and including current as completed
          const isCompleted = !isRejected && (index < currentStepIndex || (index === currentStepIndex && isFinal));
          const isCurrent = !isRejected && index === currentStepIndex && !isFinal;
          
          const showRejectedAtThisStep = isRejected && index === 0;
          const Icon = showRejectedAtThisStep ? XCircle : step.icon;

          return (
            <div key={step.name} className={cn(
              "relative z-10 flex flex-col items-center group transition-all duration-500",
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
                  "absolute -bottom-8 whitespace-nowrap text-[10px] font-bold transition-all duration-500 tracking-wider uppercase",
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
    </div>
  );
}
