import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import api from '../services/api';
import AppShell from '../components/layout/AppShell';

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
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
    api.get('/legal/privacy-policy').then((resp) => {
      if (mounted) {
        setPolicy(resp.data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setPolicy({ version: '1.0', content: { introduction: 'Política indisponível no momento.' } });
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
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
        </div>

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
                  <span className="text-slate-400">
                    {isExpanded ? '−' : '+'}
                  </span>
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
      </div>
    </AppShell>
  );
}
