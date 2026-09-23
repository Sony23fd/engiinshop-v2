import { ReactNode } from "react"
import { Outfit } from "next/font/google"
import { ToastProvider } from "@/components/ui/use-toast"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata = {
  title: "Anar Korea Shop",
  description: "Korean product procurement system",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn" className={`${outfit.variable} ${outfit.className}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var origError = console.error;
                  console.error = function() {
                    for (var i = 0; i < arguments.length; i++) {
                      var str = "";
                      try { str = String(arguments[i] || ""); } catch (e) {}
                      if (str.indexOf("bis_skin_checked") !== -1) {
                        return;
                      }
                    }
                    origError.apply(console, arguments);
                  };
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans font-medium" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
