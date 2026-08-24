import { describe, expect, it } from "vitest";

import { ADMIN_PAGE_SIZE, parseAdminListQuery } from "@/lib/admin/list-query";

describe("Admin Console list query", () => {
  it("normalizes search and calculates pagination offset", () => {
    expect(parseAdminListQuery({ search: "  admin  ", page: "3" })).toEqual({
      search: "admin",
      page: 3,
      limit: ADMIN_PAGE_SIZE,
      offset: ADMIN_PAGE_SIZE * 2,
    });
  });

  it("falls back to the first page for invalid values", () => {
    expect(parseAdminListQuery({ page: "-4" })).toMatchObject({
      page: 1,
      offset: 0,
    });
    expect(parseAdminListQuery({ page: "not-a-page" })).toMatchObject({
      page: 1,
      offset: 0,
    });
  });
});
