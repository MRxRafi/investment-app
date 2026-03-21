import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { LayoutDashboard, PieChart, History, FileText, User } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Portfolio Tracker | Smart Inversion",
  description: "Advanced investment portfolio management with real-time analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-slate-200`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-72 border-r border-white/5 bg-zinc-950/20 backdrop-blur-3xl hidden lg:flex flex-col p-8 space-y-10 print:hidden relative overflow-hidden">
            <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />
            
            <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/20 rotate-3 transition-transform hover:rotate-0">
                P
              </div>
              <span className="text-2xl font-black font-outfit tracking-tighter text-white uppercase italic">Portfo<span className="text-blue-500">lio</span></span>
            </div>
            
            <nav className="flex-1 space-y-2">
              <NavLink href="/" label="Dashboard" icon={<LayoutDashboard className="w-5 h-5" />} active />
              <NavLink href="/assets" label="Activos" icon={<PieChart className="w-5 h-5" />} />
              <NavLink href="/transactions" label="Transacciones" icon={<History className="w-5 h-5" />} />
              <NavLink href="/reports" label="Reportes" icon={<FileText className="w-5 h-5" />} />
            </nav>

            <div className="pt-8 border-t border-white/5">
              <div className="p-5 rounded-[2rem] bg-blue-600/5 border border-blue-600/10 group transition-all hover:bg-blue-600/10 hover:border-blue-600/20">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2 leading-none">System Status</p>
                <div className="flex items-center text-sm font-bold text-blue-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  Live Sync
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto print:overflow-visible bg-[#050507]">
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 glass sticky top-0 z-50 print:hidden overflow-hidden">
              <div className="flex items-center lg:hidden">
                <span className="text-xl font-black font-outfit tracking-tighter italic">Portfo<span className="text-blue-500">lio</span></span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center space-x-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Session Active</span>
                  <span className="text-xs text-zinc-200 font-black font-outfit uppercase tracking-tighter">rafadriveclase</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center hover:border-blue-600/30 transition-colors shadow-lg">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
            </header>
            
            <div className="p-10 max-w-7xl mx-auto print:p-0 print:max-w-none">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, label, icon, active = false }: { href: string, label: string, icon: React.ReactNode, active?: boolean }) {
  return (
    <a href={href} className={`flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all group ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-500/5' : 'text-zinc-500 hover:text-blue-100 hover:bg-white/5'}`}>
      <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </a>
  );
}
