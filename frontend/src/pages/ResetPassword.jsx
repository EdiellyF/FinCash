import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const tokenFromQs = params.get('token') || '';
  const emailFromQs = params.get('email') || '';

  const [email, setEmail] = useState(emailFromQs);
  const [token, setToken] = useState(tokenFromQs);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromQs) setToken(tokenFromQs);
    if (emailFromQs) setEmail(emailFromQs);
  }, [tokenFromQs, emailFromQs]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/auth/reset-password', { email, token, newPassword });
      toast.success('Senha redefinida com sucesso');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Redefinir senha</h1>
          <p className="mt-1 text-sm text-slate-500">Informe o token recebido por e-mail e sua nova senha.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@exemplo.com" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Token</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token recebido por email" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nova senha</label>
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" type="password" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold">{loading ? 'Aguarde...' : 'Redefinir senha'}</button>

            <p className="mt-5 text-center text-sm text-slate-500">Lembrou? <Link to="/login" className="text-emerald-600">Entrar</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
