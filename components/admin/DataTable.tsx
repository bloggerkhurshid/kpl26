'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  emptyMessage?: string;
  loading?: boolean;
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys,
  emptyMessage = 'No records found.',
  loading = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let rows = [...data];
    if (query && searchKeys) {
      const q = query.toLowerCase();
      rows = rows.filter(row =>
        searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      rows.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const av = (a as any)[sortKey] ?? '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bv = (b as any)[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, query, searchKeys, sortKey, sortDir]);

  return (
    <div className="dt-wrapper">
      {searchable && (
        <div className="dt-search">
          <Search size={15} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}
      <div className="dt-scroll">
        <table className="dt-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={col.sortable ? 'dt-th-sortable' : ''}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span>{col.label}</span>
                  {col.sortable && (
                    <span className="dt-sort-icons">
                      <ChevronUp size={11} className={sortKey === col.key && sortDir === 'asc' ? 'dt-sort-active' : ''} />
                      <ChevronDown size={11} className={sortKey === col.key && sortDir === 'desc' ? 'dt-sort-active' : ''} />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="dt-empty">
                  <div className="dt-loading">Loading...</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="dt-empty">{emptyMessage}</td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={String(col.key)}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <div className="dt-footer">
          {filtered.length} of {data.length} records
        </div>
      )}
    </div>
  );
}
