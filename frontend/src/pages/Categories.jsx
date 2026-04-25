import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import FormModal from '../components/ui/FormModal';
import BasicTable from '../components/tables/BasicTable';
import api from '../services/api';
import { toast } from 'sonner';

const initial = { name: '', type: 'expense', color: '#2563eb', icon: 'tag' };

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: initial });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/categories');
    setRows(data.data);
  }

  function handleNew() {
    setEditing(null);
    reset(initial);
    setOpen(true);
  }

  function handleEdit(row) {
    setEditing(row);
    reset({ name: row.name, type: row.type, color: row.color || '#2563eb', icon: row.icon || 'tag' });
    setOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, values);
        toast.success('Categoria atualizada.');
      } else {
        await api.post('/categories', values);
        toast.success('Categoria criada.');
      }
      setOpen(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar categoria.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Deseja excluir esta categoria?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoria removida.');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao excluir categoria.');
    }
  }

  return (
    <AppShell>
      <PageCard
        title="Categorias"
        actions={<button onClick={handleNew} className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Nova categoria</button>}
      >
        <BasicTable
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'type', label: 'Tipo', render: (row) => row.type === 'income' ? 'Receita' : 'Despesa' },
            { key: 'color', label: 'Cor', render: (row) => <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full" style={{ backgroundColor: row.color || '#64748b' }} /> {row.color || '-'}</span> },
            { key: 'isDefault', label: 'Origem', render: (row) => row.isDefault ? 'Padrão' : 'Personalizada' }
          ]}
          rows={rows}
          renderActions={(row) => row.isDefault ? <span className="text-slate-400">Bloqueada</span> : (
            <div className="flex gap-2">
              <button onClick={() => handleEdit(row)} className="rounded-xl bg-amber-500 px-3 py-2 text-white">Editar</button>
              <button onClick={() => remove(row.id)} className="rounded-xl bg-red-600 px-3 py-2 text-white">Excluir</button>
            </div>
          )}
        />
      </PageCard>

      <FormModal open={open} title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <input {...register('name')} placeholder="Nome" />
          <select {...register('type')}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          <input {...register('color')} type="color" />
          <input {...register('icon')} placeholder="Ícone" />
          <button className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white md:col-span-2">Salvar categoria</button>
        </form>
      </FormModal>
    </AppShell>
  );
}
