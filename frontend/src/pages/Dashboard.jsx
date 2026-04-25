import { useEffect, useState } from 'react';
import api from '../services/api';
import AppShell from '../components/layout/AppShell';
import StatCard from '../components/ui/StatCard';
import PageCard from '../components/ui/PageCard';
import { ExpensesChart, MonthlyChart } from '../components/charts/DashboardCharts';
import { currency, dateBR } from '../utils/format';
import { toast } from 'sonner';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, ShieldCheck, ShieldAlert, Info } from 'lucide-react';

function HealthBadge({ label, status, detail }) {
  const colors = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    warn: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    bad: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  };
  const icons = { ok: ShieldCheck, warn: AlertTriangle, bad: ShieldAlert };
  const Icon = icons[status] || Info;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${colors[status] || colors.ok}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-bold">{label}</p>
        {detail && <p className="text-xs opacity-80">{detail}</p>}
      </div>
    </div>
  );
}

function computeHealth(dashboard) {
  if (!dashboard) return [];
  const { balance, totalIncome, totalExpense } = dashboard;
  const indicators = [];

  if (totalIncome > 0) {
    const expenseRate = (totalExpense / totalIncome) * 100;
    if (expenseRate < 70) {
      indicators.push({ label: 'Comprometimento de renda', status: 'ok', detail: `${expenseRate.toFixed(0)}% da renda comprometida — situação saudável` });
    } else if (expenseRate < 90) {
      indicators.push({ label: 'Comprometimento de renda', status: 'warn', detail: `${expenseRate.toFixed(0)}% da renda comprometida — atenção` });
    } else {
      indicators.push({ label: 'Comprometimento de renda', status: 'bad', detail: `${expenseRate.toFixed(0)}% da renda comprometida — crítico` });
    }
  }

  const reserveTarget = totalExpense * 6;
  if (balance >= reserveTarget) {
    indicators.push({ label: 'Reserva de emergência', status: 'ok', detail: `Saldo cobre mais de 6 meses de despesas` });
  } else if (balance >= totalExpense * 3) {
    indicators.push({ label: 'Reserva de emergência', status: 'warn', detail: `Saldo cobre ${(balance / (totalExpense || 1)).toFixed(1)} meses — meta: 6 meses` });
  } else {
    indicators.push({ label: 'Reserva de emergência', status: 'bad', detail: `Reserva insuficiente. Meta: ${currency(reserveTarget)}` });
  }

  if (balance > 0) {
    indicators.push({ label: 'Saldo positivo', status: 'ok', detail: 'Suas receitas superam as despesas' });
  } else {
    indicators.push({ label: 'Saldo negativo', status: 'bad', detail: 'Despesas superam receitas neste período' });
  }

  return indicators;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/dashboard');
      setDashboard(data.data);
    } catch {
      toast.error('Erro ao carregar dashboard.');
    }
  }

  if (!dashboard) {
    return (
      <AppShell>
        <div className="flex h-60 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            Carregando dashboard...
          </div>
        </div>
      </AppShell>
    );
  }

  const healthIndicators = computeHealth(dashboard);

  return (
    <AppShell>
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Saldo atual" value={dashboard.balance} color={dashboard.balance >= 0 ? 'emerald' : 'red'} icon={Wallet} />
        <StatCard title="Total de receitas" value={dashboard.totalIncome} type="income" icon={TrendingUp} />
        <StatCard title="Total de despesas" value={dashboard.totalExpense} type="expense" icon={TrendingDown} />
      </div>

      {/* Health indicators */}
      <PageCard title="Indicadores de Saúde Financeira">
        <div className="grid gap-3 sm:grid-cols-3">
          {healthIndicators.map((ind, i) => (
            <HealthBadge key={i} {...ind} />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          * Indicadores calculados com base nas suas transações registradas. Mantenha os registros atualizados para uma análise mais precisa.
        </p>
      </PageCard>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ExpensesChart data={dashboard.expensesByCategory} />
        <MonthlyChart data={dashboard.monthlyMovement} />
      </div>

      {/* Recent transactions */}
      <PageCard title="Últimas transações">
        {dashboard.recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Nenhuma transação registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {dashboard.recentTransactions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.category?.name} • {dateBR(item.transactionDate)}</p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {item.type === 'income' ? '+' : '−'} {currency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </AppShell>
  );
}
