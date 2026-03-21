import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function SummaryCard({ title, value, change, trend, icon }: SummaryCardProps) {
  return (
    <div className="glass-card flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-none">{title}</p>
          <h3 className="text-3xl font-black font-outfit tracking-tighter text-white group-hover:scale-105 origin-left transition-transform duration-500">
            {value}
          </h3>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-inner">
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-8 flex items-center space-x-3 animate-fade-in">
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors duration-500",
            trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
            trend === 'down' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          )}>
            {change}
          </span>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter italic">vs periodo anterior</span>
        </div>
      )}
    </div>
  );
}
