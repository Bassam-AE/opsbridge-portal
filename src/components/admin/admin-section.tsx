import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminSectionHeaderProps = {
  title: string;
  description: string;
  total?: number;
};

export function AdminSectionHeader({
  title,
  description,
  total,
}: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Admin Console
        </Link>
        <h2 className="text-xl font-bold tracking-[-0.025em] text-slate-800">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {typeof total === "number" ? (
        <span className="w-fit rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          {total} total
        </span>
      ) : null}
    </div>
  );
}

type AdminSearchProps = {
  action: string;
  defaultValue: string;
  placeholder: string;
  hiddenFields?: Record<string, string>;
};

export function AdminSearch({
  action,
  defaultValue,
  placeholder,
  hiddenFields = {},
}: AdminSearchProps) {
  return (
    <form action={action} method="get" className="relative w-full max-w-xl">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Search
        aria-hidden="true"
        className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-slate-400"
        strokeWidth={1.8}
      />
      <input
        name="search"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-24 pl-11 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 cursor-pointer rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600"
      >
        Search
      </button>
    </form>
  );
}

type AdminTableProps = {
  columns: readonly string[];
  children: ReactNode;
  empty: boolean;
  emptyMessage: string;
};

export function AdminTable({
  columns,
  children,
  empty,
  emptyMessage,
}: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

type AdminPaginationProps = {
  basePath: string;
  search: string;
  page: number;
  limit: number;
  total: number;
  additionalParams?: Record<string, string>;
};

function pageHref(
  basePath: string,
  search: string,
  page: number,
  additionalParams: Record<string, string>,
) {
  const params = new URLSearchParams(additionalParams);
  if (search) {
    params.set("search", search);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminPagination({
  basePath,
  search,
  page,
  limit,
  total,
  additionalParams = {},
}: AdminPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, pageCount);

  return (
    <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
      <span>
        Page {currentPage} of {pageCount}
      </span>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={pageHref(basePath, search, currentPage - 1, additionalParams)}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </Link>
        ) : null}
        {currentPage < pageCount ? (
          <Link
            href={pageHref(basePath, search, currentPage + 1, additionalParams)}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function AdminStatusBadge({ value }: { value: string }) {
  const positive = value === "active" || value === "success" || value === "grant";
  const negative = value === "disabled" || value === "denied" || value === "restriction";

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${
        positive
          ? "bg-emerald-50 text-emerald-700"
          : negative
            ? "bg-rose-50 text-rose-700"
            : "bg-amber-50 text-amber-700"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

const noticeMessages: Record<string, string> = {
  user_created: "User created with invited status and their role was assigned.",
  user_status_changed: "User status updated immediately.",
  client_created: "Client company created successfully.",
  client_updated: "Client company details updated successfully.",
  client_status_changed: "Client company status updated immediately.",
};

const errorMessages: Record<string, string> = {
  validation: "Some submitted details were invalid. Review the form and try again.",
  conflict: "That email, username, or client ID is already in use.",
  not_found: "The record no longer exists. Refresh the page and try again.",
  invalid_relationship: "The selected role, account type, or client company is incompatible.",
  self_access_change: "You cannot change the enabled status of your own account.",
  permission_denied: "Your account does not have permission to perform that action.",
  unexpected: "The change could not be completed. Please try again.",
};

export function AdminActionFeedback({
  notice,
  error,
}: {
  notice?: string;
  error?: string;
}) {
  const message = error
    ? (errorMessages[error] ?? errorMessages.unexpected)
    : notice
      ? noticeMessages[notice]
      : null;

  if (!message) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
        error
          ? "border-rose-100 bg-rose-50 text-rose-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
      }`}
    >
      {message}
    </div>
  );
}

export function AdminFormPanel({
  summary,
  description,
  children,
}: {
  summary: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-slate-100 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-slate-700 marker:content-none">
        <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Plus aria-hidden="true" className="size-4" />
        </span>
        <span className="flex-1">
          {summary}
          <span className="mt-0.5 block text-xs font-normal text-slate-400">{description}</span>
        </span>
        <span className="text-xs font-medium text-emerald-600 group-open:hidden">Open</span>
        <span className="hidden text-xs font-medium text-slate-400 group-open:inline">Close</span>
      </summary>
      <div className="border-t border-slate-100 p-5">{children}</div>
    </details>
  );
}

export const adminLabelClassName =
  "grid gap-1.5 text-xs font-semibold text-slate-600";
export const adminInputClassName =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
export const adminPrimaryButtonClassName =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600";
export const adminSecondaryButtonClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600";
