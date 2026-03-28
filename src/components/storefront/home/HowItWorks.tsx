import { ShoppingBag, Plane, CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <ShoppingBag className="w-8 h-8 text-[#4e3dc7]" />,
      title: "1. Захиалах",
      desc: "Та хүссэн бараагаа сонгон сагслаад, урьдчилгаа эсвэл бүтэн төлбөрөө төлж баталгаажуулна."
    },
    {
      icon: <Plane className="w-8 h-8 text-[#4e3dc7]" />,
      title: "2. Тээвэрлэгдэх",
      desc: "Захиалга хаагдмагц Солонгосоос шууд ачигдаж, Улаанбаатар руу хурдан шуурхай тээвэрлэгдэнэ."
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-[#4e3dc7]" />,
      title: "3. Хүлээн авах",
      desc: "Бараа Монголд ирмэгц та өөрийн сонгосон хаягаар хүргүүлж авах эсвэл ирж авна."
    }
  ];

  return (
    <div id="how-it-works" className="py-24 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Хэрхэн ажилладаг вэ?</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Хамгийн хялбар бөгөөд ойлгомжтой 3 алхамт үйл явц</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative px-4 text-center">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[40px] left-[15%] w-[70%] h-0.5 bg-gradient-to-r from-transparent via-indigo-100 to-transparent -z-10"></div>
          
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center group bg-white">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#4e3dc7]/10 transition-colors backdrop-blur-sm">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed max-w-[280px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
