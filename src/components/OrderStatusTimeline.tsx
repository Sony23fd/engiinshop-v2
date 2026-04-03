"use client"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Truck, Package, Home, Box } from "lucide-react"

interface StatusTimelineProps {
  status: string; // Current status name
  isFinal?: boolean;
}

export function OrderStatusTimeline({ status, isFinal }: StatusTimelineProps) {
  const steps = [
    { name: "Баталгаажсан", icon: CheckCircle2, matches: ["Баталгаажсан", "Confirmed", "Батлагдсан"] },
    { name: "Солонгосоос гарсан", icon: Truck, matches: ["Солонгосоос гарсан", "Shipped", "Гарсан", "хөдөлсөн", "Departed"] },
    { name: "Монголд ирсэн", icon: Box, matches: ["Ирсэн", "Arrived", "Монголд ирсэн", "Улаанбаатарт ирсэн", "UB ирсэн"] },
    { name: "Хүлээн авсан", icon: Home, matches: ["Өөрөө ирж авсан", "Хүргэлтээр авсан", "Delivered", "Picked up", "Дууссан", "Авсан"] },
  ];

  // Find the current step index
  let currentStepIndex = steps.findIndex(step => 
    step.matches.some(m => status.toLowerCase().includes(m.toLowerCase()))
  );

  // Since these are confirmed orders, if we don't find a match or find the first one, ensure index 0 is at least reached
  if (currentStepIndex === -1 && status !== "") {
    // If not negative status like "Rejected" or "Cancelled", assume at least step 0
    currentStepIndex = 0;
  }
  
  if (currentStepIndex === -1) currentStepIndex = 0;

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between max-w-4xl mx-auto">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.name} className="relative z-10 flex flex-col items-center group">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 shadow-sm",
                  isCompleted ? "bg-indigo-600 border-indigo-600 text-white" : 
                  isCurrent ? "bg-white border-indigo-600 text-indigo-600 scale-125 shadow-md ring-4 ring-indigo-50" : 
                  "bg-white border-slate-300 text-slate-300"
                )}
              >
                <Icon size={18} className={cn(isCurrent && "animate-pulse")} />
              </div>
              <span 
                className={cn(
                  "absolute -bottom-8 whitespace-nowrap text-[11px] font-extrabold transition-all duration-500 tracking-tight uppercase",
                  isCurrent ? "text-indigo-700 scale-110" : 
                  isCompleted ? "text-indigo-900/60" : "text-slate-400"
                )}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
