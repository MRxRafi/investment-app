import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <div className="absolute inset-0 blur-xl bg-yellow-500/20 animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-zinc-200 font-bold text-sm tracking-tight uppercase">Sincronizando</p>
        <p className="text-zinc-500 text-[10px] font-medium tracking-widest uppercase">ElPortafolio Engine v2.0</p>
      </div>
    </div>
  );
}
