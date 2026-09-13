import { useEffect, useState } from 'react';
import api from '../services/api';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import { MonthlyChart } from '../components/charts/DashboardCharts';
import { currency, dateBR } from '../utils/format';
import { toast } from 'sonner';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, ShieldCheck, ShieldAlert, Info, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

function HealthBadge({ label, status, detail }) {
  const colors = {
    ok: 'bg-fincash-forest/10 text-fincash-forest border-fincash-forest/20',
    warn: 'bg-fincash-gold/10 text-fincash-gold border-fincash-gold/20',
    bad: 'bg-fincash-terracotta/10 text-fincash-terracotta border-fincash-terracotta/20',
  };
  const icons = { ok: ShieldCheck, warn: AlertTriangle, bad: ShieldAlert };
  const Icon = icons[status] || Info;

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${colors[status] || colors.ok}`}>
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
        <div className="flex h-60 items-center justify-center rounded-2xl border border-fincash-ink/10 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3 text-fincash-ink/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-fincash-forest border-t-transparent" />
            Carregando dashboard...
          </div>
        </div>
      </AppShell>
    );
  }

  const healthIndicators = computeHealth(dashboard);

  // Calculate balance variation percentage (mock for now, would need historical data)
  const balanceVariation = dashboard.totalIncome > 0 
    ? ((dashboard.balance / dashboard.totalIncome) * 100).toFixed(0)
    : 0;

  return (
    <AppShell>
      {/* Hero section - Current balance */}
      <div className="rounded-2xl bg-fincash-forest p-6 text-fincash-cream">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Saldo atual</p>
            <h2 className="mt-2 text-4xl font-bold font-money">
              {currency(dashboard.balance)}
            </h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fincash-cream/20">
            <Wallet size={20} className="text-fincash-cream" />
          </div>
        </div>
        <div className="inline-flex items-center rounded-full bg-fincash-gold px-3 py-1 text-xs font-semibold" style={{ color: '#2D2A26' }}>
          {dashboard.balance >= 0 ? '+' : ''}{balanceVariation}% este mês
        </div>
      </div>

      {/* Income and expense cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-fincash-ink/10 bg-white p-5 dark:bg-slate-800">
          <div className="mb-3 flex items-start justify-between">
            <p className="text-sm font-medium text-fincash-ink/60">Total de receitas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fincash-forest/10">
              <TrendingUp size={16} className="text-fincash-forest" />
            </div>
          </div>
          <h3 className="text-xl font-bold font-money text-fincash-forest">
            {currency(dashboard.totalIncome)}
          </h3>
        </div>
        <div className="rounded-lg border border-fincash-ink/10 bg-white p-5 dark:bg-slate-800">
          <div className="mb-3 flex items-start justify-between">
            <p className="text-sm font-medium text-fincash-ink/60">Total de despesas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fincash-terracotta/10">
              <TrendingDown size={16} className="text-fincash-terracotta" />
            </div>
          </div>
          <h3 className="text-xl font-bold font-money text-fincash-terracotta">
            {currency(dashboard.totalExpense)}
          </h3>
        </div>
      </div>

      {/* Health indicators */}
      <PageCard title="Indicadores de Saúde Financeira">
        <div className="grid gap-3 sm:grid-cols-3">
          {healthIndicators.map((ind, i) => (
            <HealthBadge key={i} {...ind} />
          ))}
        </div>
        <p className="mt-3 text-xs text-fincash-ink/60">
          * Indicadores calculados com base nas suas transações registradas. Mantenha os registros atualizados para uma análise mais precisa.
        </p>
      </PageCard>

      {/* Expenses by category - horizontal bars */}
      <PageCard title="Despesas por categoria">
        {!dashboard.expensesByCategory || dashboard.expensesByCategory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-4 text-sm text-fincash-ink/60">
              Registre sua primeira despesa para ver esse gráfico
            </p>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 rounded-sm bg-fincash-forest px-4 py-2 text-sm font-semibold text-fincash-cream transition hover:bg-fincash-forest/90"
            >
              <Plus size={16} />
              Adicionar transação
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboard.expensesByCategory.map((item) => {
              const maxValue = Math.max(...dashboard.expensesByCategory.map(d => d.value));
              const percentage = (item.value / maxValue) * 100;
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-28 shrink-0 truncate text-sm font-medium text-fincash-ink">
                    {item.name}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-fincash-ink/5">
                      <div
                        className="h-2 rounded-full bg-fincash-forest"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 shrink-0 text-right text-sm font-bold font-money text-fincash-ink">
                    {currency(item.value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>

      {/* Monthly chart */}
      <MonthlyChart data={dashboard.monthlyMovement} />

      {/* Recent transactions */}
      <PageCard title="Últimas transações">
        {dashboard.recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-fincash-ink/60">Nenhuma transação registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {dashboard.recentTransactions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fincash-ink/10 p-4 dark:border-fincash-ink/10">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${item.type === 'income' ? 'bg-fincash-forest/10 text-fincash-forest' : 'bg-fincash-terracotta/10 text-fincash-terracotta'}`}>
                    {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-fincash-ink dark:text-fincash-cream">{item.title}</p>
                    <p className="text-xs text-fincash-ink/60">{item.category?.name} • {dateBR(item.transactionDate)}</p>
                  </div>
                </div>
                <div className={`text-sm font-bold font-money ${item.type === 'income' ? 'text-fincash-forest' : 'text-fincash-terracotta'}`}>
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
