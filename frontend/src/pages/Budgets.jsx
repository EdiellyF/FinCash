import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import FormModal from '../components/ui/FormModal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { currency } from '../utils/format';
import api from '../services/api';
import { toast } from 'sonner';
import { Wallet, Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const initial = { categoryId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: '' };

// Modelos de orçamento para estudantes (Valores atualizados para realidade de Palmas/TO)
const BUDGET_TEMPLATES = [
  {
    name: '💼 Estudante Bolsista',
    description: 'Para estudantes com bolsa-auxílio (R$ 400-600/mês) - Foco em economia',
    budgets: [
      { category: 'Restaurante Universitário', limit: 120 }, // ~R$ 4/dia (almoço)
      { category: 'Transporte para Faculdade', limit: 90 }, // ~R$ 4,50 x 20 dias
      { category: 'Alimentação', limit: 100 }, // jantar e finais de semana
      { category: 'Materiais de Estudo', limit: 50 },
      { category: 'Saúde', limit: 30 },
      { category: 'Lazer', limit: 30 },
    ]
  },
  {
    name: '👷 Estudante Trabalhador',
    description: 'Para estudantes com renda de trabalho (R$ 1.200-2.000/mês)',
    budgets: [
      { category: 'Moradia', limit: 400 }, // aluguel modesto em Palmas
      { category: 'Alimentação', limit: 400 }, // refeições completas
      { category: 'Transporte para Faculdade', limit: 90 }, // transporte urbano
      { category: 'Materiais de Estudo', limit: 80 },
      { category: 'Lazer', limit: 150 },
      { category: 'Saúde', limit: 80 },
      { category: 'Educação', limit: 100 },
      { category: 'Cursos Complementares', limit: 80 }, // cursos extras
    ]
  },
  {
    name: '🏠 Estudante em República',
    description: 'Para estudantes dividindo casa (R$ 350-500/mês de aluguel)',
    budgets: [
      { category: 'Alojamento/República', limit: 400 }, // aluguel + contas divididas
      { category: 'Restaurante Universitário', limit: 120 }, // almoço no RU
      { category: 'Alimentação', limit: 200 }, // jantar e fins de semana
      { category: 'Transporte para Faculdade', limit: 90 },
      { category: 'Materiais de Estudo', limit: 60 },
      { category: 'Lazer', limit: 80 },
      { category: 'Saúde', limit: 40 },
      { category: 'Cursos Complementares', limit: 50 }, // cursos extras
    ]
  },
  {
    name: '👨‍👩‍👧‍👦 Morando com Familiares',
    description: 'Para estudantes em casa dos pais (renda própria R$ 300-800/mês)',
    budgets: [
      { category: 'Transporte para Faculdade', limit: 90 },
      { category: 'Alimentação', limit: 150 }, // alimentação fora de casa
      { category: 'Materiais de Estudo', limit: 80 },
      { category: 'Lazer', limit: 120 },
      { category: 'Saúde', limit: 50 },
      { category: 'Educação', limit: 80 },
      { category: 'Transporte', limit: 50 }, // transporte adicional
    ]
  },
];

function TemplateCard({ template, onApply }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-3">
        <p className="font-bold text-slate-900 dark:text-white">{template.name}</p>
        <p className="text-xs text-slate-500">{template.description}</p>
      </div>
      <div className="mb-3 space-y-1">
        {template.budgets.map((b, idx) => (
          <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
            {b.category}: <span className="font-semibold">{currency(b.limit)}</span>
          </p>
        ))}
      </div>
      <button
        onClick={() => onApply(template)}
        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        Aplicar este template
      </button>
    </div>
  );
}

export default function Budgets() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [templateMode, setTemplateMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: initial });

  useEffect(() => { load(); loadCategories(); }, []);

  async function load() { const { data } = await api.get('/budgets'); setRows(data.data); }
  async function loadCategories() { const { data } = await api.get('/categories'); setCategories(data.data.filter(i => i.type === 'expense')); }

  function handleNew() { setEditing(null); reset(initial); setTemplateMode(false); setOpen(true); }
  
  async function handleApplyTemplate(template) {
    setSelectedTemplate(template);
    setTemplateMode(true);
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(row) {
    setEditing(row);
    setTemplateMode(false);
    reset({ categoryId: row.categoryId, month: row.month, year: row.year, limitAmount: Number(row.limitAmount) });
    setOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (templateMode && selectedTemplate) {
        // Aplicar template
        for (const budget of selectedTemplate.budgets) {
          const category = categories.find(c => c.name === budget.category);
          if (category) {
            await api.post('/budgets', {
              categoryId: category.id,
              month: values.month,
              year: values.year,
              limitAmount: budget.limit,
            });
          }
        }
        toast.success('Template de orçamento aplicado com sucesso!');
        setTemplateMode(false);
        setSelectedTemplate(null);
      } else if (editing) { 
        await api.put(`/budgets/${editing.id}`, values); 
        toast.success('Orçamento atualizado.'); 
      } else { 
        await api.post('/budgets', values); 
        toast.success('Orçamento salvo.'); 
      }
      setOpen(false); 
      load();
    } catch (error) { toast.error(error.response?.data?.message || 'Erro ao salvar orçamento.'); }
  }

  async function remove(id) {
    if (!window.confirm('Deseja excluir este orçamento?')) return;
    await api.delete(`/budgets/${id}`);
    toast.success('Orçamento removido.'); load();
  }

  return (
    <AppShell>
      {/* Templates de Orçamento para Estudantes */}
      {rows.length === 0 && (
        <PageCard title="📋 Templates de Orçamento para Estudantes">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Escolha um perfil que se adequa à sua situação e aplicaremos um orçamento baseado em padrões comuns de estudantes universitários:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_TEMPLATES.map((template, idx) => (
              <TemplateCard key={idx} template={template} onApply={handleApplyTemplate} />
            ))}
          </div>
        </PageCard>
      )}

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

      <FormModal 
        open={open} 
        title={
          templateMode 
            ? `Aplicar: ${selectedTemplate?.name} - Escolha mês e ano` 
            : editing 
            ? 'Editar orçamento' 
            : 'Novo orçamento'
        } 
        onClose={() => {
          setOpen(false);
          setTemplateMode(false);
          setSelectedTemplate(null);
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          {!templateMode && (
            <>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-500">Categoria de despesa</label>
                <select {...register('categoryId')} required>
                  <option value="">Selecione a categoria</option>
                  {categories.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Limite mensal (R$)</label>
                <input {...register('limitAmount')} type="number" step="0.01" placeholder="0,00" required />
              </div>
            </>
          )}
          {templateMode && (
            <div className="sm:col-span-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Será criado um orçamento para cada categoria do template abaixo para o mês e ano selecionados.
              </p>
            </div>
          )}
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
          <button type="submit" className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
            {templateMode ? 'Aplicar template' : 'Salvar orçamento'}
          </button>
        </form>
      </FormModal>
    </AppShell>
  );
}
