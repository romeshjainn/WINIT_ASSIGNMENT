interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 4) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-600">
        {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors">←</button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={i} className="px-2 py-1.5 text-sm text-gray-400">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors">→</button>
      </div>
    </div>
  );
}
