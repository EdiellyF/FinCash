export default function ProgressBar({ value = 0, color = 'bg-fincash-forest', showLabel = false, className = '' }) {
  const isExceeded = value > 100;
  const barColor = isExceeded
    ? 'bg-fincash-terracotta'
    : color.startsWith('bg-')
    ? color
    : `bg-${color}`;

  const fillWidth = `${Math.min(Math.max(value, 0), 100)}%`;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs font-medium text-fincash-ink/70">
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-md bg-fincash-ink/5">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: fillWidth }}
        />
      </div>
    </div>
  );
}
