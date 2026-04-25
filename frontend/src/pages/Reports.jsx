import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import BasicTable from '../components/tables/BasicTable';
import { currency, dateBR } from '../utils/format';
import api from '../services/api';
import { toast } from 'sonner';
import { Download, FileText, Search, TrendingUp, TrendingDown } from 'lucide-react';

const MONTHS = [
  { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Março' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Maio' }, { v: 6, l: 'Junho' },
  { v: 7, l: 'Julho' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Setembro' },
  { v: 10, l: 'Outubro' }, { v: 11, l: 'Novembro' }, { v: 12, l: 'Dezembro' },
];

export default function Reports() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [rows, setRows] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); loadCategorySummary(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/monthly?month=${month}&year=${year}`);
      setRows(data.data);
    } catch { toast.error('Erro ao carregar relatório.'); }
    finally { setLoading(false); }
  }

  async function loadCategorySummary() {
    try {
      const { data } = await api.get('/reports/category');
      setCategorySummary(data.data);
    } catch { toast.error('Erro ao carregar relatório por categoria.'); }
  }

  async function download(type) {
    try {
      const response = await api.get(`/reports/export/${type}?month=${month}&year=${year}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${year}-${String(month).padStart(2,'0')}.${type}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Arquivo ${type.toUpperCase()} gerado.`);
    } catch { toast.error(`Erro ao exportar ${type.toUpperCase()}.`); }
  }

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let totalIncome = 0, totalExpense = 0;
    rows.forEach(r => {
      if (r.type === 'income') totalIncome += Number(r.amount);
      else totalExpense += Number(r.amount);
    });
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [rows]);

  return (
    <AppShell>
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Mês</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-40">
            {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Ano</label>
          <input type="number" value={year} min="2000" onChange={e => setYear(Number(e.target.value))} className="w-28" />
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-700">
          <Search size={15} /> Filtrar
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => download('csv')} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            <Download size={15} /> CSV
          </button>
          <button onClick={() => download('pdf')} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600 mb-1"><TrendingUp size={16} /><span className="text-xs font-semibold">Receitas</span></div>
          <p className="text-xl font-bold text-emerald-600">{currency(totalIncome)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-2 text-red-500 mb-1"><TrendingDown size={16} /><span className="text-xs font-semibold">Despesas</span></div>
          <p className="text-xl font-bold text-red-500">{currency(totalExpense)}</p>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm ${balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="mb-1 text-xs font-semibold text-slate-500">Saldo do período</p>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{currency(balance)}</p>
        </div>
      </div>

      <PageCard title={`Transações — ${MONTHS.find(m => m.v === month)?.l} ${year}`}>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <BasicTable
            columns={[
              { key: 'title', label: 'Título' },
              { key: 'category', label: 'Categoria', render: r => r.category?.name || '-' },
              { key: 'type', label: 'Tipo', render: r => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {r.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              )},
              { key: 'amount', label: 'Valor', render: r => <span className={r.type === 'income' ? 'font-bold text-emerald-600' : 'font-bold text-red-500'}>{currency(r.amount)}</span> },
              { key: 'transactionDate', label: 'Data', render: r => dateBR(r.transactionDate) },
            ]}
            rows={rows}
          />
        )}
      </PageCard>

      <PageCard title="Resumo por categoria">
        <BasicTable
          columns={[
            { key: 'category', label: 'Categoria' },
            { key: 'total', label: 'Total', render: r => <span className="font-bold">{currency(r.total)}</span> },
          ]}
          rows={categorySummary}
        />
      </PageCard>
    </AppShell>
  );
}
