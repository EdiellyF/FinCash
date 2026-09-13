import { useState, useEffect } from 'react';
import { Check, FileText, Sparkles, Upload, Wand2, X, Edit2, Save, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import api from '../services/api';

import { currency, dateBR } from '../../utils/format';

export default function TransactionExtraction({ onTransactionsSaved }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  
  // Estado apenas para Categorias (Carteiras não são exigidas pelo schema Zod)
  const [categories, setCategories] = useState([]);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [extractionLimits, setExtractionLimits] = useState({ used: 0, remaining: 4, limit: 4 });
  const [loadingLimits, setLoadingLimits] = useState(false);

  useEffect(() => {
    if (open) {
      fetchExtractionLimits();
      fetchAuxiliaryData(); // Busca categorias quando o modal abre
    }
  }, [open]);

  async function fetchExtractionLimits() {
    setLoadingLimits(true);
    try {
      const response = await api.get('/transactions/extraction-limits');
      setExtractionLimits(response.data);
    } catch (error) {
      console.error('Erro ao buscar limites de extração:', error);
    } finally {
      setLoadingLimits(false);
    }
  }

  // Busca dados de categoria para preencher o select e validar UUIDs
  async function fetchAuxiliaryData() {
    try {
      const categoriesRes = await api.get('/categories');
      setCategories(categoriesRes.data.data || categoriesRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias. Verifique a conexão com o banco.');
    }
  }

  function resetModal() {
    setOpen(false);
    setText('');
    setPdfFile(null);
    setExtractedTransactions([]);
    setMode('text');
    setEditingIndex(null);
    setEditingTransaction(null);
  }

  function startEditing(index) {
    setEditingIndex(index);
    setEditingTransaction({ ...extractedTransactions[index] });
  }

  function cancelEditing() {
    setEditingIndex(null);
    setEditingTransaction(null);
  }

  function saveEditing() {
    if (editingTransaction && editingIndex !== null) {
      const updatedTransactions = [...extractedTransactions];
      updatedTransactions[editingIndex] = editingTransaction;
      setExtractedTransactions(updatedTransactions);
      setEditingIndex(null);
      setEditingTransaction(null);
      toast.success('Transação atualizada.');
    }
  }

  function deleteTransaction(index) {
    const updatedTransactions = extractedTransactions.filter((_, i) => i !== index);
    setExtractedTransactions(updatedTransactions);
    toast.success('Transação removida.');
  }

  function updateEditingField(field, value) {
    if (editingTransaction) {
      setEditingTransaction({ ...editingTransaction, [field]: value });
    }
  }

  // Compara o nome que a IA sugeriu com as categorias do banco para preencher o UUID
  function enrichExtractedData(transactionsFromAI) {
    return transactionsFromAI.map(tx => {
      const matchedCategory = categories.find(
        c => c.name.toLowerCase() === (tx.category || '').toLowerCase()
      );
      
      return {
        ...tx,
        categoryId: matchedCategory ? matchedCategory.id : '',
      };
    });
  }

  async function handleExtractText() {
    if (!text || text.trim().length === 0) {
      toast.error('Digite um texto para extrair transações.');
      return;
    }

    if (extractionLimits.remaining <= 0) {
      toast.error(`Você atingiu o limite diário de ${extractionLimits.limit} extrações.`);
      return;
    }

    try {
      const { data } = await api.post('/transactions/extract', { text });
      
      const enrichedTransactions = enrichExtractedData(data.data.transactions);
      setExtractedTransactions(enrichedTransactions);

      if (data.data.remainingExtractions !== undefined) {
        setExtractionLimits(prev => ({ ...prev, used: prev.used + 1, remaining: data.data.remainingExtractions }));
      }

      toast.success(`${enrichedTransactions.length} transações extraídas com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao extrair transações.');
    }
  }

  async function handleExtractPdf() {
    if (!pdfFile) {
      toast.error('Selecione um extrato ou fatura em PDF.');
      return;
    }

    if (extractionLimits.remaining <= 0) {
      toast.error(`Você atingiu o limite diário de ${extractionLimits.limit} extrações.`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const { data } = await api.post('/transactions/extract-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const enrichedTransactions = enrichExtractedData(data.data.transactions);
      setExtractedTransactions(enrichedTransactions);

      if (data.data.remainingExtractions !== undefined) {
        setExtractionLimits(prev => ({ ...prev, used: prev.used + 1, remaining: data.data.remainingExtractions }));
      }

      toast.success(`${enrichedTransactions.length} transações extraídas do PDF!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao extrair transações do PDF.');
    }
  }

  async function handleExtract() {
    try {
      setIsExtracting(true);
      if (mode === 'pdf') {
        await handleExtractPdf();
      } else {
        await handleExtractText();
      }
    } catch (error) {
      // Erros tratados nas funções específicas
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSaveExtracted() {
    // Verifica se alguma transação ficou sem categoria
    const hasMissingRelations = extractedTransactions.some(tx => !tx.categoryId);
    
    if (hasMissingRelations) {
      toast.error('Algumas transações estão sem Categoria. Clique no lápis para corrigir.');
      return;
    }

    try {
      setIsSaving(true);

      // Formatação estrita para o Payload do Backend (Zod schemas)
      const formattedTransactions = extractedTransactions.map(tx => {
        const isoDate = tx.transactionDate 
          ? new Date(`${tx.transactionDate}T12:00:00Z`).toISOString() 
          : new Date().toISOString();

        return {
          title: tx.title,
          description: tx.description || '',
          amount: Math.abs(Number(tx.amount) || 0),
          type: tx.type ? tx.type.toLowerCase() : 'expense', // Garante minúsculo para z.enum(['income', 'expense'])
          transactionDate: isoDate, // Backend pede a chave 'transactionDate'
          categoryId: tx.categoryId,
        };
      });

      const { data } = await api.post('/transactions/extract-save', {
        transactions: formattedTransactions
      });

      toast.success(`${data.data?.save?.totalSaved || formattedTransactions.length} transações salvas!`);
      resetModal();
      if (onTransactionsSaved) {
        onTransactionsSaved();
      }
    } catch (error) {
      console.error(error.response?.data);
      toast.error(error.response?.data?.message || 'Erro ao salvar transações no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  }
  
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-fincash-forest px-4 py-2.5 text-sm font-medium text-fincash-cream transition hover:bg-fincash-forest/90"
      >
        <Wand2 size={18} />
        <span>Extrair com IA</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fincash-ink/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-fincash-cream p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-fincash-forest" size={24} />
            <h2 className="text-xl font-medium text-fincash-ink">
              Extração de transações com IA
            </h2>
          </div>
          <button onClick={resetModal} className="rounded-lg p-2 transition hover:bg-fincash-ink/10">
            <X size={20} className="text-fincash-ink/60" />
          </button>
        </div>

        {!loadingLimits && (
          <div className={`mb-6 rounded-lg p-4 border ${extractionLimits.remaining === 0 ? 'bg-fincash-terracotta/5 border-fincash-terracotta/20' : 'bg-fincash-ink/5 border-fincash-ink/10'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className={extractionLimits.remaining === 0 ? 'text-fincash-terracotta' : 'text-fincash-ink/80'} />
              <p className={`text-sm ${extractionLimits.remaining === 0 ? 'text-fincash-terracotta font-medium' : 'text-fincash-ink/80'}`}>
                Extrações hoje: <span className="font-money">{extractionLimits.used}/{extractionLimits.limit}</span> (<span className="font-money">{extractionLimits.remaining}</span> restantes)
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fincash-ink/10">
              <div
                className={`h-full transition-all ${extractionLimits.remaining === 0 ? 'bg-fincash-terracotta' : 'bg-fincash-forest'}`}
                style={{ width: `${(extractionLimits.used / extractionLimits.limit) * 100}%` }}
              />
            </div>
          </div>
        )}

        {extractedTransactions.length === 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 rounded-lg border border-fincash-ink/10 p-1 bg-white">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
                  mode === 'text' ? 'bg-fincash-forest text-fincash-cream' : 'text-fincash-ink/60 hover:bg-fincash-ink/5 hover:text-fincash-ink'
                }`}
              >
                <FileText size={16} />
                <span>Texto livre</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('pdf')}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
                  mode === 'pdf' ? 'bg-fincash-forest text-fincash-cream' : 'text-fincash-ink/60 hover:bg-fincash-ink/5 hover:text-fincash-ink'
                }`}
              >
                <Upload size={16} />
                <span>Arquivo PDF</span>
              </button>
            </div>

            {mode === 'text' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-fincash-ink">Descreva suas transações</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ex: salário 1800, mercado 300, transporte 150..."
                  className="w-full resize-none rounded-lg border border-fincash-ink/20 bg-white p-4 text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest placeholder:text-fincash-ink/40"
                  rows={6}
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-fincash-ink">Fatura do cartão ou extrato</label>
                <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-fincash-ink/20 bg-white p-6 text-center transition hover:border-fincash-forest hover:bg-fincash-ink/5">
                  <Upload className="mb-3 text-fincash-forest/80" size={28} />
                  <span className="font-medium text-fincash-ink">{pdfFile ? pdfFile.name : 'Selecionar PDF'}</span>
                  <span className="mt-1 text-sm text-fincash-ink/50">Tamanho máximo <span className="font-money">10 MB</span></span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={resetModal} className="rounded-lg border border-fincash-ink/20 px-5 py-2.5 text-sm font-medium text-fincash-ink transition hover:bg-fincash-ink/5">
                Cancelar
              </button>
              <button
                onClick={handleExtract}
                disabled={isExtracting || extractionLimits.remaining <= 0}
                className="flex items-center gap-2 rounded-lg bg-fincash-forest px-5 py-2.5 text-sm font-medium text-fincash-cream transition hover:bg-fincash-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExtracting ? (
                  <><Sparkles className="animate-spin" size={16} /><span>Extraindo...</span></>
                ) : (
                  <><Wand2 size={16} /><span>{extractionLimits.remaining <= 0 ? 'Limite atingido' : 'Extrair transações'}</span></>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg bg-fincash-forest/10 p-4 border border-fincash-forest/20">
              <p className="text-sm font-medium text-fincash-forest">
                <span className="font-money">{extractedTransactions.length}</span> transações extraídas com sucesso.
              </p>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-2">
              {extractedTransactions.map((tx, index) => (
                <div
                  key={`${tx.title}-${index}`}
                  className={`rounded-lg border bg-white p-4 transition-colors ${
                    !tx.categoryId ? 'border-fincash-terracotta/40 bg-fincash-terracotta/5' : 'border-fincash-ink/10 hover:border-fincash-ink/20'
                  }`}
                >
                  {editingIndex === index ? (
                    <div className="space-y-4">
                      {/* Linha 1: Título e Valor */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-fincash-ink/60">Título</label>
                          <input
                            type="text"
                            value={editingTransaction?.title || ''}
                            onChange={(e) => updateEditingField('title', e.target.value)}
                            className="w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-fincash-ink/60">Valor</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingTransaction?.amount || ''}
                            onChange={(e) => updateEditingField('amount', parseFloat(e.target.value) || 0)}
                            className="font-money w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest"
                          />
                        </div>
                      </div>

                      {/* Linha 2: Categoria e Tipo */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-fincash-ink/60">Categoria</label>
                          <select
                            value={editingTransaction?.categoryId || ''}
                            onChange={(e) => updateEditingField('categoryId', e.target.value)}
                            className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest ${!editingTransaction?.categoryId ? 'border-fincash-terracotta/50' : 'border-fincash-ink/20'}`}
                          >
                            <option value="">Selecione...</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-fincash-ink/60">Tipo</label>
                          <select
                            value={editingTransaction?.type || 'expense'}
                            onChange={(e) => updateEditingField('type', e.target.value)}
                            className="w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest"
                          >
                            <option value="expense">Despesa</option>
                            <option value="income">Receita</option>
                          </select>
                        </div>
                      </div>

                      {/* Linha 3: Data e Descrição */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-fincash-ink/60">Data</label>
                          <input
                            type="date"
                            value={editingTransaction?.transactionDate || ''}
                            onChange={(e) => updateEditingField('transactionDate', e.target.value)}
                            className="font-money w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-fincash-ink/60">Descrição</label>
                          <input
                            type="text"
                            value={editingTransaction?.description || ''}
                            onChange={(e) => updateEditingField('description', e.target.value)}
                            className="w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none transition focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={cancelEditing} className="flex items-center gap-1.5 rounded-md border border-fincash-ink/20 px-3 py-1.5 text-sm font-medium text-fincash-ink transition hover:bg-fincash-ink/5">
                          <X size={14} /> Cancelar
                        </button>
                        <button onClick={saveEditing} className="flex items-center gap-1.5 rounded-md bg-fincash-forest px-3 py-1.5 text-sm font-medium text-fincash-cream transition hover:bg-fincash-forest/90">
                          <Save size={14} /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-fincash-ink">{tx.title}</p>
                          {!tx.categoryId && (
                            <span className="flex items-center gap-1 rounded-full bg-fincash-terracotta/10 px-2 py-0.5 text-[10px] font-semibold text-fincash-terracotta">
                              <AlertCircle size={10} /> Completar
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-fincash-ink/60 mt-0.5">
                          {tx.categoryId ? categories.find(c => c.id === tx.categoryId)?.name : <span className="text-fincash-terracotta">Sem categoria</span>}
                          {tx.transactionDate ? <span className="font-money"> - {dateBR(tx.transactionDate)}</span> : ''}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className={`font-money text-base font-medium ${tx.type === 'income' ? 'text-fincash-forest' : 'text-fincash-terracotta'}`}>
                          {tx.type === 'income' ? '+' : '-'}{currency(tx.amount)}
                        </p>
                        <div className="flex gap-1">
                          <button onClick={() => startEditing(index)} className="rounded-md p-1.5 text-fincash-ink/40 transition hover:bg-fincash-ink/5 hover:text-fincash-forest">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteTransaction(index)} className="rounded-md p-1.5 text-fincash-ink/40 transition hover:bg-fincash-terracotta/10 hover:text-fincash-terracotta">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setExtractedTransactions([])} className="rounded-lg border border-fincash-ink/20 px-5 py-2.5 text-sm font-medium text-fincash-ink transition hover:bg-fincash-ink/5">
                Voltar
              </button>
              <button onClick={handleSaveExtracted} disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-fincash-forest px-5 py-2.5 text-sm font-medium text-fincash-cream transition hover:bg-fincash-forest/90 disabled:cursor-not-allowed disabled:opacity-50">
                <Check size={16} />
                <span>{isSaving ? 'Salvando...' : 'Salvar transações'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}