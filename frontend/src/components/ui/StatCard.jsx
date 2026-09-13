import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { currency } from '../../utils/format';

export default function StatCard({ title, value, subtitle, type = 'neutral', icon: Icon }) {
  const typeMap = {
    income: {
      bg: 'bg-fincash-forest/10',
      text: 'text-fincash-forest',
      dot: 'bg-fincash-forest',
    },
    expense: {
      bg: 'bg-fincash-terracotta/10',
      text: 'text-fincash-terracotta',
      dot: 'bg-fincash-terracotta',
    },
    neutral: {
      bg: 'bg-fincash-ink/10',
      text: 'text-fincash-ink/70',
      dot: 'bg-fincash-ink/40',
    },
  };

  const resolved = typeMap[type] || typeMap.neutral;
  const TrendIcon = type === 'income' ? TrendingUp : type === 'expense' ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl border border-fincash-ink/10 bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm font-medium text-fincash-ink/60">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${resolved.bg}`}>
          {Icon ? <Icon size={18} className={resolved.text} /> : <TrendIcon size={18} className={resolved.text} />}
        </div>
      </div>
      <h3 className="text-2xl font-bold font-mono tabular-nums text-fincash-ink">{currency(value)}</h3>
      {subtitle && <p className="mt-1 text-xs text-fincash-ink/60">{subtitle}</p>}
      <div className="mt-3 h-1 w-full rounded-full bg-fincash-ink/5">
        <div className={`h-1 w-1/3 rounded-full ${resolved.dot}`} />
      </div>
    </div>
  );
}
