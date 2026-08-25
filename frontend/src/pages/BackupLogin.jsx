import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function BackupLogin() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { backupLogin } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await backupLogin({ email, backupCode: code });
      toast.success('Login realizado com código de backup');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao efetuar login com código de backup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Login com código de backup</h1>
        <form onSubmit={handleSubmit} className="rounded bg-white p-6 shadow">
          <div className="mb-3">
            <label className="block text-sm">E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <div className="mb-3">
            <label className="block text-sm">Código de backup</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <button className="rounded bg-emerald-600 text-white px-4 py-2" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}
