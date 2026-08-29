"use client";

import type { LucideIcon } from "lucide-react";
import { Rows3, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

export type DataTableColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  cellClassName?: string;
};

type SearchableDataTableProps<Row> = {
  rows: readonly Row[];
  columns: readonly DataTableColumn<Row>[];
  getRowKey: (row: Row) => string;
  getRowHref?: (row: Row) => string;
  getSearchText: (row: Row) => string;
  searchLabel: string;
  searchPlaceholder: string;
  itemLabel: string;
  itemLabelPlural?: string;
  countIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  tableClassName?: string;
};

export function SearchableDataTable<Row>({
  rows,
  columns,
  getRowKey,
  getRowHref,
  getSearchText,
  searchLabel,
  searchPlaceholder,
  itemLabel,
  itemLabelPlural,
  countIcon: CountIcon = Rows3,
  emptyTitle,
  emptyDescription,
  tableClassName = "min-w-[760px]",
}: SearchableDataTableProps<Row>) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) =>
      getSearchText(row).toLowerCase().includes(normalizedQuery),
    );
  }, [getSearchText, query, rows]);

  const visibleItemLabel =
    filteredRows.length === 1 ? itemLabel : (itemLabelPlural ?? `${itemLabel}s`);

  return (
    <section className="col-span-12 min-w-0">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">{searchLabel}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-4 pl-11 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CountIcon aria-hidden="true" className="size-4" strokeWidth={1.8} />
            <span>
              <strong className="font-semibold text-slate-700">{filteredRows.length}</strong>{" "}
              {visibleItemLabel}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full border-collapse text-left ${tableClassName}`}>
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                {columns.map((column) => (
                  <th key={column.id} scope="col" className="px-5 py-3.5">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="transition-colors hover:bg-emerald-50/35"
                >
                  {columns.map((column) => (
                    <td key={column.id} className={`px-5 py-4 ${column.cellClassName ?? ""}`}>
                      {getRowHref ? (
                        <Link
                          href={getRowHref(row)}
                          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                        >
                          {column.cell(row)}
                        </Link>
                      ) : (
                        column.cell(row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRows.length === 0 ? (
            <div className="grid min-h-48 place-items-center px-6 text-center">
              <div>
                <p className="font-semibold text-slate-700">{emptyTitle}</p>
                <p className="mt-1 text-sm text-slate-400">{emptyDescription}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function IdentityCell({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
        {initials}
      </span>
      <span className="font-semibold text-slate-700">{name}</span>
    </div>
  );
}

export function TablePill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-slate-600">
      {children}
    </span>
  );
}
