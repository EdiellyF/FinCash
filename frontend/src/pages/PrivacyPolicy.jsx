import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronDown, ChevronUp, Shield, TrendingUp } from 'lucide-react';
import api from '../services/api';

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  const sections = [
    { id: 'introduction', icon: Shield, title: 'Introdução' },
    { id: 'dataCollection', icon: Shield, title: 'Coleta de Dados' },
    { id: 'dataUsage', icon: Shield, title: 'Uso de Dados' },
    { id: 'dataProtection', icon: Shield, title: 'Proteção de Dados' },
    { id: 'dataSharing', icon: Shield, title: 'Compartilhamento' },
    { id: 'userRights', icon: Shield, title: 'Seus Direitos' },
    { id: 'accountDeletion', icon: Shield, title: 'Exclusão de Conta' },
    { id: 'contact', icon: Shield, title: 'Contato' },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api.get('/legal/privacy-policy').then((resp) => {
      if (mounted) {
        setPolicy(resp.data);
        setLoading(false);
      }
    }).catch((err) => {
      if (mounted) {
        setError(err.response?.data?.message || 'Não foi possível carregar a política de privacidade.');
        setPolicy(null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm dark:bg-slate-900">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">Finance</p>
              <p className="text-xs font-semibold leading-tight text-emerald-600">FinCash</p>
            </div>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-emerald-600 hover:underline">
            Voltar ao login
          </Link>
        </header>

        <main className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {policy?.title || 'Política de Privacidade'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Versão {policy?.version || '1.0'} • Atualizado em {policy?.lastUpdated || '2024-01-01'}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="font-semibold">Erro ao carregar política</p>
              </div>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 p-6 dark:bg-emerald-900/20">
            <p className="text-emerald-800 dark:text-emerald-300">
              {policy?.content?.introduction || 'Política indisponível no momento.'}
            </p>
          </div>

          {sections.map((section) => {
            const sectionContent = policy?.content?.[section.id];
            if (!sectionContent) return null;

            const isExpanded = expandedSections[section.id];

            return (
              <div
                key={section.id}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {section.title}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                    {Array.isArray(sectionContent) ? (
                      <ul className="space-y-2">
                        {sectionContent.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-slate-600 dark:text-slate-400"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : typeof sectionContent === 'object' ? (
                      <div className="space-y-3 text-slate-600 dark:text-slate-400">
                        {Object.entries(sectionContent).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold text-slate-900 dark:text-white capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="ml-2">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 dark:text-slate-400">
                        {sectionContent}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {policy?.content?.updates || 'Esta política pode ser atualizada periodicamente.'}
            </p>
          </div>
        </div>
          )}
        </main>
      </div>
    </div>
  );
}
