import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
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

  async function handleDeleteAccount() {
    const confirmed = window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.');
    if (!confirmed) return;

    const currentPassword = window.prompt('Digite sua senha atual para confirmar a exclusão:');
    if (!currentPassword) {
      toast.error('Senha necessária para confirmar a exclusão.');
      return;
    }

    try {
      const token = localStorage.getItem('finance_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      // Pass Authorization header explicitly as a fallback in case interceptor is not firing
      await api.delete('/users/me', { data: { currentPassword }, headers: { Authorization: 'Bearer ' + token } });
      toast.success('Conta excluída com sucesso.');
      logout();
      navigate('/login');
    } catch (err) {
      // Provide more detailed error for debugging
      console.error('Erro ao chamar DELETE /users/me:', err);
      toast.error(err.response?.data?.message || 'Erro ao excluir conta.');
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

        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold">Privacidade</h3>
          <p className="mb-4 text-sm text-slate-600">Você pode excluir permanentemente sua conta e todos os dados associados.</p>
          <button onClick={handleDeleteAccount} className="rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white">Excluir minha conta</button>
        </div>
      </PageCard>
    </AppShell>
  );
}
