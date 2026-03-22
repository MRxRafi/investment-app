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
    <div className="glass-card flex flex-col justify-between min-h-[140px] group relative overflow-hidden">
      {/* Subtle accent border on hover */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-0 transition-opacity duration-300",
        trend === 'up' ? "bg-emerald-500 group-hover:opacity-100" : 
        trend === 'down' ? "bg-red-500 group-hover:opacity-100" : 
        "bg-blue-500 group-hover:opacity-100"
      )} />

      <div className="flex justify-between items-start mb-4">
        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] font-plus-jakarta">{title}</p>
        <div className="text-zinc-600 transition-colors duration-300">
          {icon}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-black font-outfit tracking-tighter text-white group-hover:text-yellow-400 transition-colors duration-300">
          {value}
        </h3>
        {change && (
          <div className="flex items-center space-x-2 animate-fade-in">
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded border leading-none uppercase tracking-wider",
              trend === 'up' ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" : 
              trend === 'down' ? "bg-red-500/5 text-red-400 border-red-500/20" : 
              "bg-zinc-800/50 text-zinc-500 border-white/5"
            )}>
              {change}
            </span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">vs hoy</span>
          </div>
        )}
      </div>
    </div>
  );
}
