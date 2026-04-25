import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'sonner';

export default function ResetPassword() {
  const { register, handleSubmit } = useForm();

  async function onSubmit(values) {
    try {
      await api.post('/auth/reset-password', values);
      toast.success('Senha atualizada com sucesso.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="mb-6 text-3xl font-bold">Redefinir senha</h1>
        <div className="space-y-4">
          <input {...register('email')} type="email" placeholder="Seu e-mail" />
          <input {...register('newPassword')} type="password" placeholder="Nova senha" />
          <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Atualizar senha</button>
        </div>
      </form>
    </div>
  );
}
