import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { LayoutDashboard, PieChart, History, FileText, User } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Portfolio Tracker | Invest Smart",
  description: "Advanced investment portfolio management with real-time analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-white/10 glass hidden lg:flex flex-col p-6 space-y-8">
            <div className="flex items-center space-x-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
                P
              </div>
              <span className="text-xl font-bold font-outfit">Portfolio</span>
            </div>
            
            <nav className="flex-1 space-y-1">
              <NavLink href="/" label="Dashboard" icon={<LayoutDashboard className="w-5 h-5" />} active />
              <NavLink href="/assets" label="Activos" icon={<PieChart className="w-5 h-5" />} />
              <NavLink href="/transactions" label="Transacciones" icon={<History className="w-5 h-5" />} />
              <NavLink href="/reports" label="Reportes" icon={<FileText className="w-5 h-5" />} />
            </nav>

            <div className="pt-8 border-t border-white/10">
              <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-600/20">
                <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  Conectado
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 glass sticky top-0 z-50">
              <div className="flex items-center lg:hidden">
                 <span className="text-xl font-bold">Portfolio</span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center space-x-4">
                <div className="text-sm text-zinc-400">
                  <span className="hidden sm:inline">User:</span> <span className="text-zinc-100 font-medium">rafadriveclase</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              </div>
            </header>
            
            <div className="p-8 max-w-7xl mx-auto">
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
    <a href={href} className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-600/20' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
