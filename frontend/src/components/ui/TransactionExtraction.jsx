import { useState } from 'react';
import { Wand2, Sparkles, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { currency } from '../../utils/format';

export default function TransactionExtraction({ onTransactionsSaved }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  async function handleExtract() {
    if (!text || text.trim().length === 0) {
      toast.error('Por favor, digite um texto para extrair transações.');
      return;
    }

    try {
      setIsExtracting(true);
      const { data } = await api.post('/transactions/extract', { text });
      setExtractedTransactions(data.data.transactions);
      toast.success(`${data.data.transactions.length} transações extraídas com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao extrair transações.');
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSaveExtracted() {
    try {
      // Reconstruir o texto original para salvar
      const reconstructedText = extractedTransactions.map(t => 
        `${t.type === 'income' ? 'receita' : 'despesa'} de ${t.amount} com ${t.category}`
      ).join(', ');
      
      const { data } = await api.post('/transactions/extract-and-save', { 
        text: reconstructedText
      });
      
      toast.success(`${data.data.save.totalSaved} transações salvas com sucesso!`);
      setOpen(false);
      setText('');
      setExtractedTransactions([]);
      if (onTransactionsSaved) {
        onTransactionsSaved();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar transações.');
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition"
      >
        <Wand2 size={18} />
        <span>Extrair com IA</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Extração de Transações com IA
            </h2>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setText('');
              setExtractedTransactions([]);
            }}
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {extractedTransactions.length === 0 ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Descreva suas transações em texto livre
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: meu salário é 1800, gastei 300 com alimentação, 150 com transporte, 50 com lazer..."
                className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                rows={6}
              />
            </div>

            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <h3 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-300">
                💡 Dicas de uso:
              </h3>
              <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                <li>• Descreva várias transações em um único texto</li>
                <li>• Use linguagem natural, como se estivesse conversando</li>
                <li>• Inclua valores e contextos quando possível</li>
                <li>• A IA irá categorizar automaticamente cada transação</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setText('');
                }}
                className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExtract}
                disabled={isExtracting}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isExtracting ? (
                  <>
                    <Sparkles className="animate-spin" size={18} />
                    <span>Extraindo...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>Extrair Transações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                ✅ {extractedTransactions.length} transações extraídas com sucesso!
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {extractedTransactions.map((tx, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {tx.type === 'income' ? '↑' : '↓'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {tx.title}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {tx.category}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currency(tx.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExtractedTransactions([])}
                className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Editar
              </button>
              <button
                onClick={handleSaveExtracted}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 transition"
              >
                <Check size={18} />
                <span>Salvar Todas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}