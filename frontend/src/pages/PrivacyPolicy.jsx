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
    <div className="min-h-screen bg-fincash-cream p-4">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <header className="mb-6 flex items-center justify-between rounded-xl border border-fincash-ink/10 bg-white px-5 py-4">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fincash-forest text-fincash-cream">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-fincash-ink">Finance</p>
              <p className="text-xs font-medium leading-tight text-fincash-forest">FinCash</p>
            </div>
          </Link>
          <Link to="/login" className="text-sm font-medium text-fincash-forest hover:underline">
            Voltar ao login
          </Link>
        </header>

        {/* Main Content */}
        <main className="rounded-xl border border-fincash-ink/10 bg-white p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-fincash-forest/10 text-fincash-forest">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-fincash-ink">
                {policy?.title || 'Política de Privacidade'}
              </h1>
              <p className="text-fincash-ink/60 mt-1">
                Versão {policy?.version || '1.0'} • Atualizado em {policy?.lastUpdated || '2024-01-01'}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-fincash-forest border-t-transparent" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-fincash-terracotta/20 bg-fincash-terracotta/5 p-5 text-fincash-terracotta">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="font-medium">Erro ao carregar política</p>
              </div>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              
              {/* Intro Box */}
              <div className="rounded-lg bg-fincash-forest/5 p-6 border border-fincash-forest/10">
                <p className="text-fincash-forest font-medium">
                  {policy?.content?.introduction || 'Política indisponível no momento.'}
                </p>
              </div>

              {/* Accordion Sections */}
              {sections.map((section) => {
                const sectionContent = policy?.content?.[section.id];
                if (!sectionContent) return null;

                const isExpanded = expandedSections[section.id];

                return (
                  <div
                    key={section.id}
                    className="rounded-lg border border-fincash-ink/10 bg-white overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-fincash-ink/5"
                    >
                      <span className="font-medium text-fincash-ink">
                        {section.title}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-fincash-ink/40" />
                      ) : (
                        <ChevronDown size={20} className="text-fincash-ink/40" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-fincash-ink/10 p-4 bg-fincash-cream/30">
                        {Array.isArray(sectionContent) ? (
                          <ul className="space-y-3">
                            {sectionContent.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3 text-sm text-fincash-ink/80"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fincash-forest opacity-80" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : typeof sectionContent === 'object' ? (
                          <div className="space-y-3 text-sm text-fincash-ink/80">
                            {Object.entries(sectionContent).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium text-fincash-ink capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="ml-2">{value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed text-fincash-ink/80">
                            {sectionContent}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Footer Updates */}
              <div className="mt-6 rounded-lg bg-fincash-ink/5 p-4 text-center">
                <p className="text-sm text-fincash-ink/60">
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