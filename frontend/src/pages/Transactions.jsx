import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import FormModal from '../components/ui/FormModal';
import BasicTable from '../components/tables/BasicTable';
import TransactionExtraction from '../components/ui/TransactionExtraction';
import { currency, dateBR } from '../utils/format';
import api from '../services/api';
import { toast } from 'sonner';


const emptyForm = {
  title: '',
  description: '',
  type: 'expense',
  amount: '',
  categoryId: '',
  transactionDate: new Date().toISOString().slice(0, 10)
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: '', categoryId: '', startDate: '', endDate: '' });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  
  

  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm });

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, []);

  async function loadCategories() {
    const { data } = await api.get('/categories');
    setCategories(data.data);
  }

  async function loadTransactions(query = filters) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value && params.append(key, value));
    const { data } = await api.get(`/transactions?${params.toString()}`);
    setTransactions(data.data);
  }

  function handleNew() {
    setEditing(null);
    reset(emptyForm);
    setOpen(true);
  }

  function handleEdit(item) {
    setEditing(item);
    reset({
      title: item.title,
      description: item.description || '',
      type: item.type,
      amount: Number(item.amount),
      categoryId: item.categoryId,
      transactionDate: item.transactionDate.slice(0, 10)
    });
    setOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        const { data } = await api.put(`/transactions/${editing.id}`, values);
        if (data.data.budgetAlert) {
          toast.warning(`Limite excedido em ${data.data.budgetAlert.category}.`);
        } else {
          toast.success('Transação atualizada.');
        }
      } else {
        const { data } = await api.post('/transactions', values);
        if (data.data.budgetAlert) {
          toast.warning(`Limite excedido em ${data.data.budgetAlert.category}.`);
        } else {
          toast.success('Transação criada.');
        }
      }

      setOpen(false);
      loadTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar transação.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Deseja realmente excluir esta transação?')) return;
    await api.delete(`/transactions/${id}`);
    toast.success('Transação removida.');
    loadTransactions();
  }

  return (
    <AppShell>
      <PageCard
        title="Transações"
        actions={
          <div className="flex gap-3">
            <TransactionExtraction onTransactionsSaved={loadTransactions} />
            <button onClick={handleNew} className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Nova transação</button>
          </div>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Todos os tipos</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
            <option value="">Todas as categorias</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        </div>
        <div className="mb-4 flex gap-3">
          <button onClick={() => loadTransactions()} className="rounded-2xl bg-slate-900 px-4 py-3 text-white dark:bg-slate-700">Filtrar</button>
          <button onClick={() => { const cleared = { type: '', categoryId: '', startDate: '', endDate: '' }; setFilters(cleared); loadTransactions(cleared); }} className="rounded-2xl border border-slate-300 px-4 py-3 dark:border-slate-700">Limpar</button>
        </div>

        <BasicTable
          columns={[
            { key: 'title', label: 'Título' },
            { key: 'category', label: 'Categoria', render: (row) => row.category?.name || '-' },
            { key: 'type', label: 'Tipo', render: (row) => row.type === 'income' ? 'Receita' : 'Despesa' },
            { key: 'amount', label: 'Valor', render: (row) => currency(row.amount) },
            { key: 'transactionDate', label: 'Data', render: (row) => dateBR(row.transactionDate) }
          ]}
          rows={transactions}
          renderActions={(row) => (
            <div className="flex gap-2">
              <button onClick={() => handleEdit(row)} className="rounded-xl bg-amber-500 px-3 py-2 text-white">Editar</button>
              <button onClick={() => remove(row.id)} className="rounded-xl bg-red-600 px-3 py-2 text-white">Excluir</button>
            </div>
          )}
        />
      </PageCard>

      <FormModal open={open} title={editing ? 'Editar transação' : 'Nova transação'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <input {...register('title')} placeholder="Título" />
          <select {...register('type')}>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <select {...register('categoryId')}>
            <option value="">Selecione uma categoria</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input {...register('amount')} type="number" step="0.01" placeholder="Valor" />
          <input {...register('transactionDate')} type="date" />
          <input {...register('description')} placeholder="Descrição" className="md:col-span-2" />
          <button className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white md:col-span-2">
            {editing ? 'Salvar alterações' : 'Cadastrar transação'}
          </button>
        </form>
      </FormModal>
    </AppShell>
  );
}
