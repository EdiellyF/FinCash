import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();

  async function onSubmit(values) {
    try {
      await api.post('/auth/forgot-password', values);
      toast.success('Solicitação enviada.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao processar solicitação.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="mb-6 text-3xl font-bold">Recuperar senha</h1>
        <div className="space-y-4">
          <input {...register('email')} type="email" placeholder="Seu e-mail" />
          <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Enviar</button>
        </div>
        <div className="mt-5 text-sm text-blue-600">
          <Link to="/reset-password">Redefinir agora</Link>
        </div>
      </form>
    </div>
  );
}
