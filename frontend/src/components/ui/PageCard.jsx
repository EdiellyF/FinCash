export default function PageCard({ title, actions, children }) {
  return (
    <section className="rounded-lg border border-fincash-ink/10 bg-white p-5 dark:bg-slate-800">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-fincash-ink dark:text-fincash-cream">{title}</h2>
          <div>{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}
