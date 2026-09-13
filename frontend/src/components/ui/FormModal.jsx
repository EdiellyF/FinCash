import { X } from 'lucide-react';

export default function FormModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fincash-ink/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-fincash-ink/10 bg-white shadow-floating">
        <div className="flex items-center justify-between border-b border-fincash-ink/10 px-5 py-4">
          <h3 className="font-bold text-fincash-ink">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fincash-ink/40 transition hover:bg-fincash-ink/5 hover:text-fincash-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
