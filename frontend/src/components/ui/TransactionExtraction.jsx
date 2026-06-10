import { useState } from 'react';
import { Check, FileText, Sparkles, Upload, Wand2, X } from 'lucide-react';
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

  function resetModal() {
    setOpen(false);
    setText('');
    setPdfFile(null);
    setExtractedTransactions([]);
    setMode('text');
  }

  async function handleExtractText() {
    if (!text || text.trim().length === 0) {
      toast.error('Digite um texto para extrair transacoes.');
      return;
    }

    const { data } = await api.post('/transactions/extract', { text });
    setExtractedTransactions(data.data.transactions);
    toast.success(`${data.data.transactions.length} transacoes extraidas com sucesso!`);
  }

  async function handleExtractPdf() {
    if (!pdfFile) {
      toast.error('Selecione um extrato ou fatura em PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('file', pdfFile);

    const { data } = await api.post('/transactions/extract-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setExtractedTransactions(data.data.transactions);
    toast.success(`${data.data.transactions.length} transacoes extraidas do PDF!`);
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
                disabled={isExtracting}
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
                    <span>Extrair Transacoes</span>
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {tx.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {tx.category}
                        {tx.transactionDate ? ` - ${dateBR(tx.transactionDate)}` : ''}
                      </p>
                    </div>
                    <p className={`shrink-0 text-lg font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currency(tx.amount)}
                    </p>
                  </div>
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
