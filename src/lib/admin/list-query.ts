export const ADMIN_PAGE_SIZE = 25;

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function parseAdminListQuery(searchParams: {
  search?: SearchParamValue;
  page?: SearchParamValue;
}) {
  const search = firstValue(searchParams.search).trim().slice(0, 100);
  const requestedPage = Number.parseInt(firstValue(searchParams.page), 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return {
    search,
    page,
    limit: ADMIN_PAGE_SIZE,
    offset: (page - 1) * ADMIN_PAGE_SIZE,
  };
}

export function formatAdminDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
        }
      : {}),
  }).format(new Date(value));
}
