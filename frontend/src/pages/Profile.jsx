import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || ''
    }
  });

  useEffect(() => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || ''
    });
  }, [user, reset]);

  async function onSubmit(values) {
    try {
      await api.put('/users/me', values);
      await refreshProfile();
      toast.success('Perfil atualizado.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil.');
    }
  }

  return (
    <AppShell>
      <PageCard title="Meu perfil">
        <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 md:grid-cols-2">
          <input {...register('name')} placeholder="Nome" className="md:col-span-2" />
          <input {...register('email')} type="email" placeholder="E-mail" className="md:col-span-2" />
          <input {...register('avatarUrl')} placeholder="URL do avatar" className="md:col-span-2" />
          <button className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white md:col-span-2">Salvar perfil</button>
        </form>
      </PageCard>
    </AppShell>
  );
}
