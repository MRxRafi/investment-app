import { cn } from "@/lib/utils";

interface AllocationItem {
  name: string;
  value: number;
}

interface AllocationTableProps {
  title: string;
  data: AllocationItem[];
  variant?: 'blue' | 'indigo' | 'emerald';
}

export function AllocationTable({ title, data, variant = 'blue' }: AllocationTableProps) {
  const accentColor = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
  };

  const softBg = {
    blue: 'bg-blue-500/5',
    indigo: 'bg-indigo-500/5',
    emerald: 'bg-emerald-500/5',
  };

  return (
    <div className="glass-card flex flex-col h-full animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-black font-outfit tracking-tighter text-white/90">
          {title}
        </h3>
        <div className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-white/5 bg-white/5 text-zinc-400 group-hover:text-blue-400 transition-colors cursor-default")}>
          Live Data
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {data.map((item, idx) => (
          <div key={idx} className="group/row">
            <div className={cn(
               "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5 hover:bg-white/5",
               idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
            )}>
              <div className="flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-950 border border-white/5 flex items-center justify-center font-bold text-xs text-zinc-500 group-hover/row:text-white transition-colors">
                    {idx + 1}
                  </div>
                  {/* Circular progress highlight */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                      cx="20" cy="20" r="18" 
                      fill="none" stroke="currentColor" strokeWidth="2"
                      className={cn("text-white/5", accentColor[variant], "opacity-20")}
                      style={{ strokeDasharray: 113.1, strokeDashoffset: 113.1 - (113.1 * item.value / 100) }}
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100 uppercase tracking-tight group-hover/row:translate-x-1 transition-transform duration-300">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Distribución Acordada</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black font-outfit text-white tracking-tighter italic">
                  {item.value.toFixed(1)}<span className="text-[10px] text-zinc-500 ml-0.5 font-bold">%</span>
                </p>
                <div className="w-20 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                   <div 
                    className={cn("h-full transition-all duration-1000 ease-out", accentColor[variant])}
                    style={{ width: `${item.value}%` }} 
                   />
                </div>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 italic border-2 border-dashed border-white/5 rounded-[2rem]">
            No hay datos disponibles en esta sección
          </div>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center px-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Portfolio Core v3.0</span>
        <span className="text-sm font-black font-outfit text-zinc-400 group-hover:text-blue-500 transition-colors">
          {data.reduce((acc, i) => acc + i.value, 0).toFixed(0)}% <span className="text-[10px] uppercase ml-1">Total</span>
        </span>
      </div>
    </div>
  );
}
