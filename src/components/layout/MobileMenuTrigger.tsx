"use client";

import { Menu } from "lucide-react";
import { useNav } from "./NavContext";

export function MobileMenuTrigger() {
  const { toggle } = useNav();
  return (
    <button 
      onClick={toggle}
      className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors lg:hidden"
      aria-label="Open Menu"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
