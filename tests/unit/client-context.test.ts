import { describe, expect, it } from "vitest";

import { resolveClientContext, type ClientContextOption } from "@/lib/client-context";

const contexts: ClientContextOption[] = [
  { id: "client-a", code: "A", name: "Alpha" },
  { id: "client-b", code: "B", name: "Beta" },
];

describe("client context resolution", () => {
  it("uses only an internal employee's available requested context", () => {
    expect(resolveClientContext("internal", "client-b", contexts)).toBe("client-b");
    expect(resolveClientContext("internal", "outside-scope", contexts)).toBeNull();
  });

  it("keeps provider context when no client is requested", () => {
    expect(resolveClientContext("internal", undefined, contexts)).toBeNull();
  });

  it("forces a client user into the user's own membership context", () => {
    expect(resolveClientContext("client", "client-b", contexts)).toBe("client-a");
    expect(resolveClientContext("client", undefined, [])).toBeNull();
  });
});
