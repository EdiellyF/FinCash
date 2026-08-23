import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TrendingUp, LogIn } from 'lucide-react';

export default function Login() {
  const { register: registerInput, handleSubmit, formState: { isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(values) {
    try {
      await login(values);
      toast.success('Login realizado com sucesso.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao entrar. Verifique seus dados.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <TrendingUp size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">FinCash</h1>
          <p className="mt-1 text-sm text-slate-500">Financeiro</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
          <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Entrar na conta</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">E-mail</label>
              <input {...registerInput('email')} type="email" placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Senha</label>
              <input {...registerInput('password')} type="password" placeholder="••••••••" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Código TOTP (6 dígitos)</label>
              <input {...registerInput('totpCode')} type="text" placeholder="123456" />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60"
            >
              <LogIn size={16} />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          <div className="mt-5 flex justify-between text-sm">
            <Link to="/register" className="font-medium text-emerald-600 hover:underline">Criar conta</Link>
            <Link to="/forgot-password" className="font-medium text-slate-500 hover:underline">Recuperar senha</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
