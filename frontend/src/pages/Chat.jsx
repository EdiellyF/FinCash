import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import AppShell from '../components/layout/AppShell';
import { Send, User, Loader2, Download, AlertCircle, FileText, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';

// SVG personalizados com tema verde
const AnalysisCompleteIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#10B981" fillOpacity="0.1"/>
    <path d="M24 8L26.5 16.5L35 19L26.5 21.5L24 30L21.5 21.5L13 19L21.5 16.5L24 8Z" fill="#10B981"/>
    <path d="M15 32L17 35L20 30" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 32L30 35L33 30" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpendingAnalysisIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#10B981" fillOpacity="0.1"/>
    <path d="M12 36L18 24L24 30L36 12" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36 12H30" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36 12V18" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BudgetIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#10B981" fillOpacity="0.1"/>
    <rect x="12" y="14" width="24" height="20" rx="2" stroke="#10B981" strokeWidth="2.5"/>
    <path d="M12 20H36" stroke="#10B981" strokeWidth="2.5"/>
    <path d="M18 26H22" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M18 30H26" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="32" cy="27" r="3" fill="#10B981"/>
  </svg>
);

const GoalsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#10B981" fillOpacity="0.1"/>
    <circle cx="24" cy="24" r="14" stroke="#10B981" strokeWidth="2.5"/>
    <circle cx="24" cy="24" r="8" stroke="#10B981" strokeWidth="2.5"/>
    <circle cx="24" cy="24" r="3" fill="#10B981"/>
    <path d="M24 10V12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 36V38" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M10 24H12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M36 24H38" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const SavingsIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#10B981" fillOpacity="0.1"/>
    <path d="M16 20C16 16 18 12 24 12C30 12 32 16 32 20V26C32 32 28 36 24 36C20 36 16 32 16 26V20Z" stroke="#10B981" strokeWidth="2.5"/>
    <path d="M20 20C20 18 21 16 24 16C27 16 28 18 28 20" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="21" cy="24" r="1.5" fill="#10B981"/>
    <circle cx="27" cy="24" r="1.5" fill="#10B981"/>
    <path d="M22 28C22 29 23 30 24 30C25 30 26 29 26 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#10B981"/>
  </svg>
);

const ANALYSIS_TYPES = [
  {
    id: 'complete',
    icon: AnalysisCompleteIcon,
    title: 'Análise Completa',
    description: 'Visão geral de todas as suas finanças',
    prompt: 'Faça uma análise completa da minha situação financeira atual, incluindo saldo, receitas, despesas, metas e orçamentos. Dê recomendações personalizadas.'
  },
  {
    id: 'spending',
    icon: SpendingAnalysisIcon,
    title: 'Análise de Gastos',
    description: 'Identifique onde está gastando mais',
    prompt: 'Analise meus gastos dos últimos 30 dias. Quais são as maiores categorias de despesa? Onde posso economizar?'
  },
  {
    id: 'budget',
    icon: BudgetIcon,
    title: 'Orçamento Mensal',
    description: 'Veja se está dentro do orçamento',
    prompt: 'Analise meu orçamento mensal. Estou respeitando os limites definidos? Quais categorias estão estourando?'
  },
  {
    id: 'goals',
    icon: GoalsIcon,
    title: 'Progresso de Metas',
    description: 'Acompanhe suas metas financeiras',
    prompt: 'Analise o progresso das minhas metas financeiras. Estou no caminho certo? Quanto preciso poupar para atingir cada meta no prazo?'
  },
  {
    id: 'savings',
    icon: SavingsIcon,
    title: 'Dicas de Economia',
    description: 'Receba dicas personalizadas',
    prompt: 'Com base nos meus dados financeiros, me dê 5 dicas práticas para economizar mais dinheiro este mês.'
  }
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(true);
  const [limits, setLimits] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const streamingMessageRef = useRef('');
  const tempMessageIdRef = useRef(null);

  // Conectar ao WebSocket ao montar
  useEffect(() => {
    const ACCESS_TOKEN_KEY = 'finance_access_token';
    const connect = () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const socket = io('http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
        auth: { token }
      });

      socketRef.current = socket;

      socket.on('chat:chunk', ({ chunk, done }) => {
        if (done) {
          const finalMessage = streamingMessageRef.current;
          setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === tempMessageIdRef.current) {
              return { ...msg, content: finalMessage, isStreaming: false };
            }
            return msg;
          }));
          streamingMessageRef.current = '';
          setIsStreaming(false);
          setStreamingMessage('');
          tempMessageIdRef.current = null;
        } else {
          streamingMessageRef.current += chunk;
          setStreamingMessage(prev => prev + chunk);
        }
      });

      socket.on('chat:context', ({ context }) => {
        console.log('Contexto recebido:', context);
      });

      socket.on('connect', () => {
        console.log('Conectado ao WebSocket');
      });

      socket.on('disconnect', () => {
        console.log('Desconectado do WebSocket');
      });

      return socket;
    };

    // initial connect
    let sock = connect();

    // reconnect when token changes in localStorage (e.g., after refresh)
    const onStorage = (e) => {
      if (e.key === 'finance_access_token') {
        try {
          sock.disconnect();
        } catch (err) {
          // ignore
        }
        sock = connect();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      try { sock.disconnect(); } catch (err) {}
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Carregar histórico ao montar
  useEffect(() => {
    loadHistory();
    loadLimits();
  }, []);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const response = await api.get('/chat/history');
      if (response.data.length > 0) {
        setMessages(response.data);
        setShowAnalysisOptions(false);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadLimits = async () => {
    try {
      const response = await api.get('/chat/limits');
      setLimits(response.data);
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const sendMessage = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    const messageToSend = customMessage || input.trim();
    
    if (!messageToSend || loading) return;

    setInput('');
    setLoading(true);
    setShowAnalysisOptions(false);

    // Adicionar mensagem do usuário localmente
    setMessages(prev => [...prev, { role: 'user', content: messageToSend, createdAt: new Date() }]);

    try {
      // Usar streaming se o WebSocket estiver conectado
      if (socketRef.current?.connected) {
        setIsStreaming(true);
        setStreamingMessage('');
        streamingMessageRef.current = '';
        
        // Criar mensagem temporária para streaming
        const tempMessageId = Date.now();
        tempMessageIdRef.current = tempMessageId;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '', 
          id: tempMessageId,
          createdAt: new Date(),
          isStreaming: true 
        }]);

        await api.post('/chat/message-stream', { 
          message: messageToSend, 
          period: selectedPeriod,
          socketId: socketRef.current.id 
        });

        // Quando o streaming terminar, atualizar a mensagem
        setIsStreaming(false);
      } else {
        // Fallback para método tradicional sem streaming
        const response = await api.post('/chat/message', { message: messageToSend, period: selectedPeriod });
        
        let cleanContent = response.data.message;
        const hashIndex = cleanContent.indexOf('##');
        if (hashIndex !== -1) {
          cleanContent = cleanContent.substring(hashIndex);
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: cleanContent, 
          id: response.data.id,
          createdAt: response.data.createdAt 
        }]);
      }
      
      await loadLimits();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao gerar análise. Tente novamente.');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageIdRef.current));
    } finally {
      setLoading(false);
      tempMessageIdRef.current = null;
      streamingMessageRef.current = '';
    }
  };

  const handleAnalysisClick = (analysisType) => {
    if (limits && limits.combined?.userRemaining <= 0) {
      toast.error('Você atingiu seu limite diário de 2 análises. Tente novamente amanhã.');
      return;
    }
    sendMessage(null, analysisType.prompt);
  };

  const resetAnalysis = () => {
    setMessages([]);
    setShowAnalysisOptions(true);
  };

  const handleComparePeriods = async () => {
    try {
      setCompareLoading(true);
      const response = await api.post('/chat/compare', {
        periods: ['7d', '30d', '365d']
      });
      setCompareData(response.data);
      setShowCompareModal(true);
    } catch (error) {
      console.error('Erro ao comparar períodos:', error);
      toast.error('Erro ao comparar períodos.');
    } finally {
      setCompareLoading(false);
    }
  };

  const exportAnalysis = async (format = 'txt') => {
    if (format === 'pdf') {
      try {
        const response = await api.get('/chat/export-pdf', {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `analise-financeira-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Análise exportada em PDF!');
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        toast.error('Erro ao exportar PDF. Tente exportar em texto.');
      }
    } else {
      const analysisText = messages
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.content)
        .join('\n\n---\n\n');
      
      const blob = new Blob([analysisText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analise-financeira-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Análise exportada com sucesso!');
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análise Financeira IA</h1>
          </div>
          <div className="flex gap-2">
            {/* Seletor de período */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="365d">1 ano</option>
            </select>
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleComparePeriods}
                  disabled={compareLoading}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {compareLoading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                  <span className="hidden sm:inline">Comparar</span>
                </button>
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                    <Download size={16} />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={() => exportAnalysis('pdf')}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    <button
                      onClick={() => exportAnalysis('txt')}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileText size={14} />
                      Texto
                    </button>
                  </div>
                </div>
                <button
                  onClick={resetAnalysis}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Nova Análise
                </button>
              </>
            )}
          </div>
        </div>

        {/* Limites */}
        {limits && (
          <div className="mb-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <SparklesIcon />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Análise IA
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{limits.combined?.userUsed || 0}</span>/{limits.combined?.userLimit || 2} hoje
                </div>
                {/* Barra de progresso */}
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-gray-300 dark:bg-gray-600">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${limits.combined?.userPercentage || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(limits.combined?.userPercentage || 0)}%
                  </span>
                </div>
              </div>
            </div>
            {/* Aviso de limite próximo */}
            {limits.combined?.nearLimit && limits.combined?.userRemaining > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">
                    Limite próximo de ser atingido
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Você tem apenas {limits.combined?.userRemaining || 0} análise(ões) restante(s) hoje.
                </p>
              </div>
            )}
            {/* Aviso de limite atingido */}
            {limits.combined?.userRemaining <= 0 && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">
                    Limite diário atingido
                  </span>
                </div>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Você já fez {limits.combined?.userLimit || 2} análises hoje. Você pode visualizar o histórico, mas não poderá fazer novas análises até amanhã.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          {showAnalysisOptions && messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12">
                  <AnalysisCompleteIcon />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Escolha uma análise financeira
                </h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  Selecione o tipo de análise que deseja receber sobre suas finanças
                </p>
                
                {/* Grid de opções de análise */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ANALYSIS_TYPES.map((type) => {
                    const Icon = type.icon;
                    const disabled = limits && limits.combined?.userRemaining <= 0;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleAnalysisClick(type)}
                        disabled={disabled || loading}
                        className={`flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-all ${
                          disabled 
                            ? 'border-gray-200 opacity-50 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-emerald-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-400'
                        }`}
                      >
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                          disabled ? 'bg-gray-100' : 'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}>
                          <div className="h-6 w-6">
                            <Icon />
                          </div>
                        </div>
                        <h3 className="mb-1 font-medium text-gray-900 dark:text-white">
                          {type.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {type.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-6 text-xs text-gray-400">
                  Powered by Gemini
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <div className="h-5 w-5">
                        <SparklesIcon />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.isStreaming ? streamingMessage : msg.content}
                    </p>
                    {msg.isStreaming && (
                      <span className="inline-block ml-1 h-4 w-1 bg-emerald-500 animate-pulse" />
                    )}
                    <p className={`mt-1 text-xs ${msg.role === 'user' ? 'text-emerald-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                      <User size={18} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              {loading && !isStreaming && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <div className="h-5 w-5">
                      <SparklesIcon />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-700">
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Analisando suas finanças...
                    </span>
                  </div>
                </div>
              )}
              {isStreaming && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <div className="h-5 w-5">
                      <SparklesIcon />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-700">
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Gerando resposta...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input - aparece quando há mensagens no histórico */}
        {messages.length > 0 && (
          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={limits?.combined?.userRemaining <= 0 
                ? "Limite de análises atingido. Você pode fazer perguntas sobre análises anteriores."
                : "Faça uma pergunta sobre sua análise..."}
              disabled={loading || limits?.combined?.userRemaining <= 0}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || limits?.combined?.userRemaining <= 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </form>
        )}
      </div>

      {/* Modal de Comparação de Períodos */}
      {showCompareModal && compareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comparação de Períodos</h2>
              <button
                onClick={() => setShowCompareModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tabela comparativa */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Métrica</th>
                      {compareData.periods.map((p) => (
                        <th key={p.period} className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {p.period === '7d' ? '7 dias' : p.period === '30d' ? '30 dias' : '1 ano'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Saldo</td>
                      {compareData.periods.map((p) => (
                        <td key={p.period} className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          R$ {p.balance.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Receitas</td>
                      {compareData.periods.map((p) => (
                        <td key={p.period} className="px-4 py-3 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          R$ {p.totalIncome.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Despesas</td>
                      {compareData.periods.map((p) => (
                        <td key={p.period} className="px-4 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400">
                          R$ {p.totalExpense.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Média diária (receitas)</td>
                      {compareData.periods.map((p) => (
                        <td key={p.period} className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          R$ {(p.totalIncome / p.periodDays).toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Análise textual */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Análise da Evolução</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {compareData.periods.length >= 2 && (
                    <>
                      Comparando os períodos de {compareData.periods[0].period === '7d' ? '7 dias' : compareData.periods[0].period === '30d' ? '30 dias' : '1 ano'} e {compareData.periods[1].period === '7d' ? '7 dias' : compareData.periods[1].period === '30d' ? '30 dias' : '1 ano'}:
                      {compareData.periods[1].totalIncome > compareData.periods[0].totalIncome ? (
                        <span className="text-emerald-600 dark:text-emerald-400"> Suas receitas aumentaram em {((compareData.periods[1].totalIncome - compareData.periods[0].totalIncome) / compareData.periods[0].totalIncome * 100).toFixed(1)}%.</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400"> Suas receitas diminuíram em {((compareData.periods[0].totalIncome - compareData.periods[1].totalIncome) / compareData.periods[0].totalIncome * 100).toFixed(1)}%.</span>
                      )}
                      {compareData.periods[1].totalExpense > compareData.periods[0].totalExpense ? (
                        <span className="text-red-600 dark:text-red-400"> Suas despesas aumentaram em {((compareData.periods[1].totalExpense - compareData.periods[0].totalExpense) / compareData.periods[0].totalExpense * 100).toFixed(1)}%.</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400"> Suas despesas diminuíram em {((compareData.periods[0].totalExpense - compareData.periods[1].totalExpense) / compareData.periods[0].totalExpense * 100).toFixed(1)}%.</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
