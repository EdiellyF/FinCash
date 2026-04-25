export default function InputField({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <input {...props} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
