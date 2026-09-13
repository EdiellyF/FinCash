import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function ResetPasswordWithBackupCode() {
  const [email, setEmail] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      await api.post('/auth/reset-password-with-backup-code', {
        email,
        backupCode,
        newPassword
      });
      toast.success('Senha redefinida com sucesso.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Nao foi possivel redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <ShieldCheck size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Redefinir senha</h1>
          <p className="mt-1 text-sm text-slate-500">Use um codigo de backup da sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">E-mail</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Codigo de backup</label>
              <input
                value={backupCode}
                onChange={(event) => setBackupCode(event.target.value)}
                type="text"
                placeholder="codigo salvo"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nova senha</label>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-60"
            >
              <KeyRound size={16} />
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </div>
          <div className="mt-5 text-center text-sm">
            <Link to="/login" className="font-medium text-emerald-600 hover:underline">Voltar ao login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
