interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export function SummaryCard({ title, value, change, trend, icon }: SummaryCardProps) {
  return (
    <div className="glass-card">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-zinc-800 border border-white/5 text-blue-400">
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-500/10 text-green-400' : 
            trend === 'down' ? 'bg-red-500/10 text-red-400' : 
            'bg-zinc-500/10 text-zinc-400'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-zinc-400 font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold font-outfit">{value}</p>
      </div>
    </div>
  );
}
