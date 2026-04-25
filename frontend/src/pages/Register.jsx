import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TrendingUp, UserPlus } from 'lucide-react';

export default function Register() {
  const { register: reg, handleSubmit, formState: { isSubmitting } } = useForm();
  const { register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(values) {
    try {
      await register(values);
      toast.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao criar conta.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <TrendingUp size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">FinCash</h1>
          <p className="mt-1 text-sm text-slate-500">Financeiro</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
          <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Criar conta</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nome completo</label>
              <input {...reg('name')} placeholder="Seu nome" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">E-mail</label>
              <input {...reg('email')} type="email" placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Senha</label>
              <input {...reg('password')} type="password" placeholder="Mínimo 6 caracteres" required />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60"
            >
              <UserPlus size={16} />
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
          <p className="mt-5 text-center text-sm text-slate-500">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
