export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-5 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {children}
        </tbody>
      </table>
    </div>
  );
}
