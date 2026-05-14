import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { MailCheck, TrendingUp, ShieldCheck, RefreshCcw } from 'lucide-react';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post('/auth/verify-register', {
        email,
        otp
      });

      toast.success('Conta criada com sucesso');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao confirmar código.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    try {
      setResending(true);

      await api.post('/auth/resend-otp', {
        email
      });

      toast.success('Novo código enviado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao reenviar código.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <TrendingUp size={28} />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            FinCash
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Financeiro
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
              <MailCheck size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Confirmar e-mail
              </h2>

              <p className="text-sm text-slate-500">
                Enviamos um código para seu e-mail.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Código de verificação
              </label>

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Digite o código recebido"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />

              {email && (
                <p className="mt-2 text-xs text-slate-500">
                  Código enviado para{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {email}
                  </span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              {loading ? 'Confirmando...' : 'Confirmar conta'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-60 dark:hover:bg-emerald-500/10"
            >
              <RefreshCcw size={15} />
              {resending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Já confirmou?{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}