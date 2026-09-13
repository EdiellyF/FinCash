import {
  Area, AreaChart, CartesianGrid, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell
} from 'recharts';
import PageCard from '../ui/PageCard';

const COLORS = ['#1B4332', '#D4A24C', '#8B3A3A', '#2D2A26', '#10b981', '#3b82f6', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-fincash-ink/10 bg-white p-3 shadow-lg dark:border-fincash-cream/10 dark:bg-slate-800">
      {label && <p className="mb-1 text-xs font-bold text-fincash-ink/60">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export function ExpensesChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <PageCard title="Despesas por categoria">
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">Sem dados de despesas.</div>
      </PageCard>
    );
  }

  return (
    <PageCard title="Despesas por categoria">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={40} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </PageCard>
  );
}

export function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <PageCard title="Movimentação mensal">
        <div className="flex h-64 items-center justify-center text-sm text-fincash-ink/60">Sem dados mensais.</div>
      </PageCard>
    );
  }

  return (
    <PageCard title="Movimentação mensal">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B3A3A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B3A3A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2A261A" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#2D2A2633" />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} stroke="#2D2A2633" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="income" name="Receitas" stroke="#1B4332" strokeWidth={2} fill="url(#income)" />
            <Area type="monotone" dataKey="expense" name="Despesas" stroke="#8B3A3A" strokeWidth={2} fill="url(#expense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PageCard>
  );
}
