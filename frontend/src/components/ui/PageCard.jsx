export default function PageCard({ title, actions, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          <div>{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}
