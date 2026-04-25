import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { currency } from '../../utils/format';

export default function StatCard({ title, value, subtitle, type, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
  };

  const colors = colorMap[color] || colorMap.emerald;

  // Auto-detect color from type
  const resolvedColor = type === 'income' ? colorMap.emerald : type === 'expense' ? colorMap.red : colors;

  const TrendIcon = type === 'income' ? TrendingUp : type === 'expense' ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${resolvedColor.bg}`}>
          {Icon ? <Icon size={18} className={resolvedColor.text} /> : <TrendIcon size={18} className={resolvedColor.text} />}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{currency(value)}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      <div className={`mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800`}>
        <div className={`h-1 w-1/3 rounded-full ${resolvedColor.dot}`} />
      </div>
    </div>
  );
}
