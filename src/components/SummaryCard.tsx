import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll create it or use standard strings

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function SummaryCard({ title, value, change, trend, icon }: SummaryCardProps) {
  return (
    <div className="glass-card relative overflow-hidden group hover:border-white/20 transition-all duration-500">
      {/* Subtle glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          {change && (
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg border shadow-sm ${
              trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              trend === 'down' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
              'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            }`}>
              {change}
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1.5">{title}</p>
          <p className="text-3xl font-black font-outfit tracking-tight text-white group-hover:text-blue-50 group-hover:scale-[1.02] origin-left transition-all duration-500">
             {value}
          </p>
        </div>
      </div>
    </div>
  );
}
