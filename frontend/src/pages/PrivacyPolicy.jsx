import { useEffect, useState } from 'react';
import api from '../services/api';

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/legal/privacy-policy').then((resp) => {
      if (mounted) setPolicy(resp.data);
    }).catch(() => {
      if (mounted) setPolicy({ version: '1.0', content: 'Política indisponível no momento.' });
    });
    return () => { mounted = false; };
  }, []);

  if (!policy) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Política de Privacidade (v{policy.version})</h1>
      <p style={{ whiteSpace: 'pre-line' }}>{policy.content}</p>
    </div>
  );
}
