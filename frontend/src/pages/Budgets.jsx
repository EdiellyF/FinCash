import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import FormModal from '../components/ui/FormModal';
import { currency } from '../utils/format';
import api from '../services/api';
import { toast } from 'sonner';
import { Wallet, Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const initial = { categoryId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: '' };

export default function Budgets() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: initial });

  useEffect(() => { load(); loadCategories(); }, []);

  async function load() { const { data } = await api.get('/budgets'); setRows(data.data); }
  async function loadCategories() { const { data } = await api.get('/categories'); setCategories(data.data.filter(i => i.type === 'expense')); }

  function handleNew() { setEditing(null); reset(initial); setOpen(true); }
  function handleEdit(row) {
    setEditing(row);
    reset({ categoryId: row.categoryId, month: row.month, year: row.year, limitAmount: Number(row.limitAmount) });
    setOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) { await api.put(`/budgets/${editing.id}`, values); toast.success('Orçamento atualizado.'); }
      else { await api.post('/budgets', values); toast.success('Orçamento salvo.'); }
      setOpen(false); load();
    } catch (error) { toast.error(error.response?.data?.message || 'Erro ao salvar orçamento.'); }
  }

  async function remove(id) {
    if (!window.confirm('Deseja excluir este orçamento?')) return;
    await api.delete(`/budgets/${id}`);
    toast.success('Orçamento removido.'); load();
  }

  return (
    <AppShell>
      <PageCard
        title="Orçamentos mensais"
        actions={
          <button onClick={handleNew} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            <Plus size={16} /> Novo orçamento
          </button>
        }
      >
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">Nenhum orçamento cadastrado.</p>
            <button onClick={handleNew} className="mt-3 text-sm font-semibold text-emerald-600 hover:underline">Criar primeiro orçamento</button>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(row => {
              const spent = row.spentAmount ? Number(row.spentAmount) : 0;
              const limit = Number(row.limitAmount);
              const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
              const over = pct >= 100;
              const warn = pct >= 80;

              return (
                <div key={row.id} className={`rounded-xl border p-4 ${over ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {over ? <AlertTriangle size={16} className="text-red-500" /> : warn ? <AlertTriangle size={16} className="text-amber-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{row.category?.name || 'Categoria'}</p>
                        <p className="text-xs text-slate-500">{MONTHS[(row.month || 1) - 1]}/{row.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Limite: {currency(limit)}</span>
                      <button onClick={() => handleEdit(row)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(row.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{pct.toFixed(0)}% utilizado{over && ' — limite excedido!'}</p>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>

      <FormModal open={open} title={editing ? 'Editar orçamento' : 'Novo orçamento'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Categoria de despesa</label>
            <select {...register('categoryId')} required>
              <option value="">Selecione a categoria</option>
              {categories.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Mês</label>
            <select {...register('month')}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Ano</label>
            <input {...register('year')} type="number" min="2000" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Limite mensal (R$)</label>
            <input {...register('limitAmount')} type="number" step="0.01" placeholder="0,00" required />
          </div>
          <button type="submit" className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
            Salvar orçamento
          </button>
        </form>
      </FormModal>
    </AppShell>
  );
}
