export default function Badge({ children, tone = 'neutral', className = '' }) {
  const toneMap = {
    forest: 'bg-fincash-forest/15 text-fincash-forest',
    gold: 'bg-fincash-gold/20 text-[#6F5019]',
    terracotta: 'bg-fincash-terracotta/15 text-fincash-terracotta',
    neutral: 'bg-fincash-ink/10 text-fincash-ink/80',
  };

  const selectedTone = toneMap[tone] || toneMap.neutral;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedTone} ${className}`}>
      {children}
    </span>
  );
}
