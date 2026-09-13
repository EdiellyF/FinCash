import { useState, useEffect } from 'react';
import { Check, FileText, Sparkles, Upload, Wand2, X, Edit2, Save, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { currency, dateBR } from '../../utils/format';

export default function TransactionExtraction({ onTransactionsSaved }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [extractionLimits, setExtractionLimits] = useState({ used: 0, remaining: 4, limit: 4 });
  const [loadingLimits, setLoadingLimits] = useState(false);

  useEffect(() => {
    if (open) {
      fetchExtractionLimits();
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

  async function handleExtractText() {
    if (!text || text.trim().length === 0) {
      toast.error('Digite um texto para extrair transacoes.');
      return;
    }

    if (extractionLimits.remaining <= 0) {
      toast.error(`Você atingiu o limite diário de ${extractionLimits.limit} extrações. Tente novamente amanhã.`);
      return;
    }

    try {
      const { data } = await api.post('/transactions/extract', { text });
      setExtractedTransactions(data.data.transactions);

      // Atualizar limites
      if (data.data.remainingExtractions !== undefined) {
        setExtractionLimits(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: data.data.remainingExtractions
        }));
      }

      toast.success(`${data.data.transactions.length} transacoes extraidas com sucesso!`);
    } catch (error) {
      if (error.response?.status === 429 || error.response?.data?.message?.includes('limite')) {
        toast.error(error.response?.data?.message || 'Limite diário de extrações atingido.');
        await fetchExtractionLimits(); // Atualizar limites
      } else {
        toast.error(error.response?.data?.message || 'Erro ao extrair transacoes.');
      }
    }
  }

  async function handleExtractPdf() {
    if (!pdfFile) {
      toast.error('Selecione um extrato ou fatura em PDF.');
      return;
    }

    if (extractionLimits.remaining <= 0) {
      toast.error(`Você atingiu o limite diário de ${extractionLimits.limit} extrações. Tente novamente amanhã.`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const { data } = await api.post('/transactions/extract-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setExtractedTransactions(data.data.transactions);

      // Atualizar limites
      if (data.data.remainingExtractions !== undefined) {
        setExtractionLimits(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: data.data.remainingExtractions
        }));
      }

      toast.success(`${data.data.transactions.length} transacoes extraidas do PDF!`);
    } catch (error) {
      if (error.response?.status === 429 || error.response?.data?.message?.includes('limite')) {
        toast.error(error.response?.data?.message || 'Limite diário de extrações atingido.');
        await fetchExtractionLimits(); // Atualizar limites
      } else {
        toast.error(error.response?.data?.message || 'Erro ao extrair transacoes do PDF.');
      }
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
      toast.error(error.response?.data?.message || 'Erro ao extrair transacoes.');
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSaveExtracted() {
    try {
      setIsSaving(true);

      const { data } = await api.post('/transactions/extract-save', {
        transactions: extractedTransactions
      });

      toast.success(`${data.data.save.totalSaved} transacoes salvas com sucesso!`);
      resetModal();
      if (onTransactionsSaved) {
        onTransactionsSaved();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar transacoes.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
      >
        <Wand2 size={18} />
        <span>Extrair com IA</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Extracao de Transacoes com IA
            </h2>
          </div>
          <button
            onClick={resetModal}
            className="rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Limite de extrações */}
        {!loadingLimits && (
          <div className={`mb-4 rounded-xl p-3 ${extractionLimits.remaining === 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className={extractionLimits.remaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} />
              <p className={`text-sm font-medium ${extractionLimits.remaining === 0 ? 'text-red-800 dark:text-red-300' : 'text-blue-800 dark:text-blue-300'}`}>
                Extrações hoje: {extractionLimits.used}/{extractionLimits.limit} ({extractionLimits.remaining} restantes)
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full transition-all ${extractionLimits.remaining === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${(extractionLimits.used / extractionLimits.limit) * 100}%` }}
              />
            </div>
          </div>
        )}

        {extractedTransactions.length === 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  mode === 'text'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <FileText size={16} />
                <span>Texto</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('pdf')}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  mode === 'pdf'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Upload size={16} />
                <span>PDF</span>
              </button>
            </div>

            {mode === 'text' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Descreva suas transacoes em texto livre
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ex: salario 1800, mercado 300, transporte 150..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  rows={6}
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Fatura do cartao em PDF
                </label>
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-800">
                  <Upload className="mb-3 text-emerald-600" size={28} />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {pdfFile ? pdfFile.name : 'Selecionar PDF'}
                  </span>
                  <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ate 10 MB
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={resetModal}
                className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleExtract}
                disabled={isExtracting || extractionLimits.remaining <= 0}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Sparkles className="animate-spin" size={18} />
                    <span>Extraindo...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>{extractionLimits.remaining <= 0 ? 'Limite atingido' : 'Extrair Transacoes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                {extractedTransactions.length} transacoes extraidas com sucesso.
              </p>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {extractedTransactions.map((tx, index) => (
                <div
                  key={`${tx.title}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Título</label>
                          <input
                            type="text"
                            value={editingTransaction?.title || ''}
                            onChange={(e) => updateEditingField('title', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Valor</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingTransaction?.amount || ''}
                            onChange={(e) => updateEditingField('amount', parseFloat(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Categoria</label>
                          <input
                            type="text"
                            value={editingTransaction?.category || ''}
                            onChange={(e) => updateEditingField('category', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Tipo</label>
                          <select
                            value={editingTransaction?.type || 'expense'}
                            onChange={(e) => updateEditingField('type', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          >
                            <option value="expense">Despesa</option>
                            <option value="income">Receita</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Descrição</label>
                        <input
                          type="text"
                          value={editingTransaction?.description || ''}
                          onChange={(e) => updateEditingField('description', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Data</label>
                        <input
                          type="date"
                          value={editingTransaction?.transactionDate || ''}
                          onChange={(e) => updateEditingField('transactionDate', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                        <button
                          onClick={saveEditing}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <Save size={14} />
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {tx.title}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {tx.category}
                          {tx.transactionDate ? ` - ${dateBR(tx.transactionDate)}` : ''}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                            {tx.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`shrink-0 text-lg font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{currency(tx.amount)}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(index)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(index)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExtractedTransactions([])}
                className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveExtracted}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={18} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Todas'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
