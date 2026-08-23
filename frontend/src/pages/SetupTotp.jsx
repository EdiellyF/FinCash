import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { toast } from 'sonner';

export default function SetupTotp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totpUri, backupCodes } = location.state || {};

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!totpUri) return;
    QRCode.toDataURL(totpUri).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [totpUri]);

  if (!totpUri || !backupCodes) {
    // nothing to setup, redirect to home
    navigate('/');
    return null;
  }

  async function handleCopyCodes() {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast.success('Códigos copiados para a área de transferência');
    } catch {
      toast.error('Falha ao copiar códigos');
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (!savedConfirmed) return toast.error('Confirme que salvou seus códigos de backup antes de continuar.');
    if (totpCode.length !== 6) return toast.error('Digite o código de 6 dígitos.');

    try {
      setConfirming(true);
      await api.post('/auth/totp/confirm', { email: user.email, totpCode });
      toast.success('TOTP configurado com sucesso');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao confirmar TOTP');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Configurar Autenticação (TOTP)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="font-semibold mb-3">Escaneie este QR no seu app autenticador</h2>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="mx-auto" />
            ) : (
              <div className="h-40 flex items-center justify-center">QR indisponível</div>
            )}
            <p className="mt-3 text-sm text-slate-500">Se preferir, use a URI:</p>
            <pre className="mt-2 overflow-auto text-xs bg-slate-100 p-2 rounded">{totpUri}</pre>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="font-semibold mb-3">Códigos de backup (mostrados UMA VEZ)</h2>
            <ul className="mb-3 space-y-2">
              {backupCodes.map((c) => (
                <li key={c} className="font-mono text-sm bg-slate-50 p-2 rounded">{c}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={handleCopyCodes} className="rounded bg-emerald-600 text-white px-3 py-2">Copiar códigos</button>
              <button onClick={() => { navigator.clipboard.writeText(backupCodes.join('\n')) }} className="rounded border px-3 py-2">Copiar (alternativo)</button>
            </div>

            <form onSubmit={handleConfirm} className="mt-6">
              <label className="block text-sm mb-2">Digite o código de 6 dígitos do app autenticador</label>
              <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" className="w-full rounded border p-2 mb-3" required />

              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={savedConfirmed} onChange={(e) => setSavedConfirmed(e.target.checked)} />
                Eu salvei/anotei meus códigos de backup (obrigatório)
              </label>

              <button type="submit" disabled={confirming} className="rounded bg-emerald-600 text-white px-4 py-2">{confirming ? 'Confirmando...' : 'Confirmar e finalizar'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
