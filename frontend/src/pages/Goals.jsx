import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import FormModal from '../components/ui/FormModal';
import { currency, dateBR } from '../utils/format';
import api from '../services/api';
import { toast } from 'sonner';
import { Target, Pencil, Trash2, Plus, Trophy, Lightbulb } from 'lucide-react';

const initial = { title: '', targetAmount: '', currentAmount: 0, deadline: '' };

// Sugestões de metas para estudantes
const STUDENT_GOAL_SUGGESTIONS = [
  {
    title: 'Notebook para estudos',
    targetAmount: 4000,
    icon: '💻',
    description: 'Investimento em ferramentas de estudo',
    range: 'R$ 3.000-5.000',
  },
  {
    title: 'Viagem de formatura',
    targetAmount: 3000,
    icon: '✈️',
    description: 'Celebrar o final da graduação',
    range: 'R$ 2.000-4.000',
  },
  {
    title: 'Intercâmbio curto prazo',
    targetAmount: 10000,
    icon: '🌍',
    description: 'Experiência acadêmica internacional',
    range: 'R$ 8.000-15.000',
  },
  {
    title: 'Reserva de emergência',
    targetAmount: 2400,
    icon: '🛡️',
    description: '6 meses de despesas básicas',
    range: '6 meses de gastos',
  },
  {
    title: 'Cursos complementares',
    targetAmount: 1000,
    icon: '📚',
    description: 'Certificações e qualificação profissional',
    range: 'R$ 500-2.000',
  },
];

function GoalCard({ row, onEdit, onRemove }) {
  const pct = Math.min(100, row.progress ?? 0);
  const done = pct >= 100;

  return (
    <div className={`rounded-xl border p-4 ${done ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
            {done ? <Trophy size={16} /> : <Target size={16} />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
            {row.deadline && <p className="text-xs text-slate-500">Prazo: {dateBR(row.deadline)}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(row)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400">
            <Pencil size={14} />
          </button>
          <button onClick={() => onRemove(row.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : pct > 60 ? 'bg-blue-500' : pct > 30 ? 'bg-amber-500' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{currency(row.currentAmount)} de {currency(row.targetAmount)}</span>
        <span className="font-bold">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onSelect }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{suggestion.icon}</span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{suggestion.title}</p>
            <p className="text-xs text-slate-500">{suggestion.description}</p>
            <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">{suggestion.range}</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => onSelect(suggestion)}
        className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        Criar esta meta
      </button>
    </div>
  );
}

export default function Goals() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: initial });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/goals');
    setRows(data.data);
    // Hide suggestions if user already has goals
    if (data.data.length > 0) {
      setShowSuggestions(false);
    }
  }

  function handleNew() { setEditing(null); reset(initial); setOpen(true); }

  function handleEdit(row) {
    setEditing(row);
    reset({ title: row.title, targetAmount: Number(row.targetAmount), currentAmount: Number(row.currentAmount), deadline: row.deadline ? row.deadline.slice(0, 10) : '' });
    setOpen(true);
  }

  function handleSelectSuggestion(suggestion) {
    reset({
      title: suggestion.title,
      targetAmount: suggestion.targetAmount,
      currentAmount: 0,
      deadline: '',
    });
    setEditing(null);
    setOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await api.put(`/goals/${editing.id}`, values);
        toast.success('Meta atualizada.');
      } else {
        await api.post('/goals', values);
        toast.success('Meta criada.');
      }
      setOpen(false); 
      setShowSuggestions(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar meta.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Deseja excluir esta meta?')) return;
    await api.delete(`/goals/${id}`);
    toast.success('Meta removida.');
    load();
  }

  const completed = rows.filter(r => (r.progress ?? 0) >= 100).length;

  return (
    <AppShell>
      {/* Sugestões de Metas para Estudantes */}
      {showSuggestions && rows.length === 0 && (
        <PageCard title="💡 Sugestões de Metas para Estudantes">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Comece com uma destas metas comuns entre estudantes universitários:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {STUDENT_GOAL_SUGGESTIONS.map((suggestion, idx) => (
              <SuggestionCard key={idx} suggestion={suggestion} onSelect={handleSelectSuggestion} />
            ))}
          </div>
        </PageCard>
      )}

      <PageCard
        title="Metas financeiras"
        actions={
          <button onClick={handleNew} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            <Plus size={16} /> Nova meta
          </button>
        }
      >
        {rows.length > 0 && (
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-slate-500">{rows.length} {rows.length === 1 ? 'meta' : 'metas'} cadastradas</span>
            {completed > 0 && <span className="font-semibold text-emerald-600">{completed} concluída{completed > 1 ? 's' : ''} 🏆</span>}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Target size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">Nenhuma meta cadastrada ainda.</p>
            <button onClick={handleNew} className="mt-3 text-sm font-semibold text-emerald-600 hover:underline">Criar primeira meta</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(row => <GoalCard key={row.id} row={row} onEdit={handleEdit} onRemove={remove} />)}
          </div>
        )}
      </PageCard>

      <FormModal open={open} title={editing ? 'Editar meta' : 'Nova meta'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Título da meta</label>
            <input {...register('title')} placeholder="Ex: Reserva de emergência" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Valor alvo (R$)</label>
            <input {...register('targetAmount')} type="number" step="0.01" placeholder="0,00" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Valor atual (R$)</label>
            <input {...register('currentAmount')} type="number" step="0.01" placeholder="0,00" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Prazo (opcional)</label>
            <input {...register('deadline')} type="date" />
          </div>
          <button type="submit" className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
            Salvar meta
          </button>
        </form>
      </FormModal>
    </AppShell>
  );
}
