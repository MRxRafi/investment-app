import type { Metadata } from "next";
import { Inter, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavProvider } from "@/components/layout/NavContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  title: "ElPortafolio | Portfolio",
  description: "Clean investment tracking for the modern investor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} ${plusJakarta.variable} font-sans antialiased bg-black text-zinc-100`}>
        <NavProvider>
          <div className="flex min-h-screen relative overflow-hidden">
            {/* Noise overlay for texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Navigation Interface */}
            <MobileNav />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
              <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 md:px-8 bg-zinc-950/20 sticky top-0 z-40 backdrop-blur-md print:hidden">
                <div className="flex items-center lg:hidden">
                  <span className="text-lg font-bold font-outfit text-yellow-500 tracking-tight">ElPortafolio</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center space-x-4">
                  {/* Dynamic slots if needed */}
                </div>
              </header>
              
              <div className="flex-1 w-full animate-fade-in print:p-0 print:max-w-none">
                {children}
              </div>
              
              <footer className="py-8 px-8 border-t border-white/5 text-center text-zinc-600 text-[10px] font-medium tracking-widest uppercase mt-auto">
                © {new Date().getFullYear()} ElPortafolio • Industrial Utilitarian v2.0
              </footer>
            </main>
          </div>
        </NavProvider>
      </body>
    </html>
  );
}


