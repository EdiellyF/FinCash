export default function BasicTable({ columns, rows, renderActions }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold">{col.label}</th>
            ))}
            {renderActions && <th className="px-4 py-3 text-left font-semibold">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-t border-slate-200 dark:border-slate-800">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">{col.render ? col.render(row) : row[col.key]}</td>
              ))}
              {renderActions && <td className="px-4 py-3">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
