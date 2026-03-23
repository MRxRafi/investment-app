"use client";

import { Menu, X, LayoutDashboard, PieChart, History, FileText } from "lucide-react";
import { useNav } from "./NavContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function MobileNav() {
  const { isOpen, toggle, close } = useNav();
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {/* Mobile Trigger Button */}
      <button 
        onClick={toggle}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-yellow-500 text-black rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-black/10"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={close}
        />
      )}

      {/* Slide-over Menu */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-[240px] xs:w-72 bg-zinc-950 border-l border-white/10 z-[100] lg:hidden transition-all duration-300 ease-in-out p-8 shadow-2xl",
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <div className="flex flex-col h-full space-y-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900/50 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold font-outfit tracking-tight text-white">
              El<span className="text-yellow-400">Portafolio</span>
            </span>
          </div>

          <nav className="flex-1 space-y-2">
            <MobileNavLink 
              href="/" 
              label="Dashboard" 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              active={pathname === "/"} 
            />
            <MobileNavLink 
              href="/assets" 
              label="Activos" 
              icon={<PieChart className="w-5 h-5" />} 
              active={pathname === "/assets"} 
            />
            <MobileNavLink 
              href="/transactions" 
              label="Transacciones" 
              icon={<History className="w-5 h-5" />} 
              active={pathname === "/transactions"} 
            />
            <MobileNavLink 
              href="/reports" 
              label="Reportes" 
              icon={<FileText className="w-5 h-5" />} 
              active={pathname === "/reports"} 
            />
          </nav>

        </div>
      </div>
    </>
  );
}

function MobileNavLink({ 
  href, 
  label, 
  icon, 
  active 
}: { 
  href: string, 
  label: string, 
  icon: React.ReactNode, 
  active: boolean 
}) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center space-x-4 p-4 rounded-xl transition-all font-medium text-lg",
        active 
          ? "bg-white/5 text-yellow-500 border border-white/5" 
          : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-yellow-500" : "text-zinc-600"
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
