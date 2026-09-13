import { useEffect, useState } from 'react';
import { Shield, Eye, Lock, Share2, Trash2, Mail, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function PrivacyPolicy({ isOpen, onClose, onAccept }) {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  const sections = [
    { id: 'introduction', icon: Shield, title: 'Introdução' },
    { id: 'dataCollection', icon: Eye, title: 'Coleta de Dados' },
    { id: 'dataUsage', icon: Lock, title: 'Uso de Dados' },
    { id: 'dataProtection', icon: Shield, title: 'Proteção de Dados' },
    { id: 'dataSharing', icon: Share2, title: 'Compartilhamento' },
    { id: 'userRights', icon: Shield, title: 'Seus Direitos' },
    { id: 'accountDeletion', icon: Trash2, title: 'Exclusão de Conta' },
    { id: 'contact', icon: Mail, title: 'Contato' },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    if (!isOpen || policy) return;

    let mounted = true;

    async function fetchPolicy() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/legal/privacy-policy');
        if (mounted) setPolicy(response.data);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Não foi possível carregar a política de privacidade.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPolicy();

    return () => {
      mounted = false;
    };
  }, [isOpen, policy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {policy?.title || 'Política de Privacidade'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Versão {policy?.version || '1.0'} • Atualizado em {policy?.lastUpdated || '2024-01-01'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="font-semibold">Erro ao carregar política</p>
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : policy ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                {policy.content.introduction}
              </p>
            </div>

            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections[section.id];
              const sectionContent = policy.content[section.id];

              if (!sectionContent) return null;

              return (
                <div
                  key={section.id}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        <Icon size={20} />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {section.title}
                      </span>
                    </div>
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
                              className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : typeof sectionContent === 'object' ? (
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
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
                        <p className="text-sm text-slate-600 dark:text-slate-400">
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
                {policy.content.updates}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            Não foi possível carregar a política de privacidade.
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Aceitar e Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
