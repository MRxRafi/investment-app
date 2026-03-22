"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, History, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-white/5 bg-zinc-950 flex-col py-10 px-8 space-y-12 hidden lg:flex h-screen sticky top-0">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-black text-xs shadow-[0_0_20px_rgba(250,204,21,0.2)] border-2 border-black/10">
          NB
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black font-outfit tracking-tighter text-white leading-none">
            El<span className="text-yellow-500">Portafolio</span>
          </span>
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1 font-plus-jakarta">Investment OS</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2">
        <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mb-4 px-3 font-plus-jakarta">Main Terminal</div>
        <NavLink 
          href="/" 
          label="Overview" 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          active={pathname === "/"} 
        />
        <NavLink 
          href="/assets" 
          label="Asset Matrix" 
          icon={<PieChart className="w-5 h-5" />} 
          active={pathname === "/assets"} 
        />
        <NavLink 
          href="/transactions" 
          label="Ledger" 
          icon={<History className="w-5 h-5" />} 
          active={pathname === "/transactions"} 
        />
        <NavLink 
          href="/reports" 
          label="Intelligence" 
          icon={<FileText className="w-5 h-5" />} 
          active={pathname === "/reports"} 
        />
      </nav>

      <div className="pt-8 border-t border-white/5 px-3">
        <div className="flex items-center text-[9px] text-zinc-500 font-bold uppercase tracking-[0.25em] font-plus-jakarta">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          Neural Link Active
        </div>
      </div>
    </aside>
  );
}

function NavLink({ 
  href, 
  label, 
  icon, 
  active = false 
}: { 
  href: string, 
  label: string, 
  icon: React.ReactNode, 
  active?: boolean 
}) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group text-[13px] font-bold font-plus-jakarta border border-transparent",
        active 
          ? "bg-white/5 text-white border-white/5 shadow-sm" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
      )}
    >
      <span className={cn(
        "transition-colors duration-300",
        active ? "text-yellow-500" : "text-zinc-700 group-hover:text-zinc-500"
      )}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>
    </Link>
  );
}
