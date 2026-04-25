export default function SelectField({ label, error, children, ...props }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <select {...props}>{children}</select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
