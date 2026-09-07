import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TrendingUp, UserPlus } from 'lucide-react';
import validator from 'validator';

export default function Register() {
  const {
    register: reg,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      consentAccepted: false
    }
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(values) {
    try {
      const result = await register(values);

      toast.success('Conta criada. Configure o TOTP e salve seus códigos de backup.');

      navigate('/setup-totp', {
        state: {
          totpUri: result.totpUri,
          backupCodes: result.backupCodes
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível criar a conta. Tente novamente.');
    }
  }


  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

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
              <label htmlFor="name" className="mb-1 block text-xs font-semibold text-slate-500">Nome completo</label>
              <input 
                id="name"
                className={inputClass}
                {...reg('name', { required: 'Informe seu nome completo.' })} 
                placeholder="Seu nome" 
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-500">E-mail</label>
              <input
                id="email"
                className={inputClass}
                {...reg('email', {
                  required: 'Informe seu e-mail.',
                  validate: (value) =>
                    validator.isEmail(value) || 'Informe um e-mail válido.',
                })}
                type="email"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-500">Senha</label>
              <input
                id="password"
                className={inputClass}
                {...reg('password', {
                  required: 'Crie uma senha.',
                  minLength: {
                    value: 6,
                    message: 'A senha precisa ter pelo menos 6 caracteres.'
                  }
                })}
                type="password"
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <input
                {...reg('consentAccepted', { required: 'Você precisa aceitar a Política de Privacidade para continuar.' })}
                type="checkbox"
                id="consentAccepted"
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border border-slate-300 bg-white accent-emerald-600"
              />
              <div className="flex flex-col">
                <label htmlFor="consentAccepted" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  Li e aceito a <Link to="/privacy-policy" className="font-semibold text-emerald-600 underline">Política de Privacidade</Link>
                </label>
                {errors.consentAccepted && <p className="mt-1 text-xs text-red-500">{errors.consentAccepted.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
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