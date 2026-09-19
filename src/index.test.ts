import { describe, expect, it } from "vitest";

import "./index.js";

describe("Auto-registration", () => {
  it("registers <git-diff> in customElements registry", () => {
    expect(customElements.get("git-diff")).toBeDefined();
  });

  it("registers <git-log> in customElements registry", () => {
    expect(customElements.get("git-log")).toBeDefined();
  });

  it("registers <git-show> in customElements registry", () => {
    expect(customElements.get("git-show")).toBeDefined();
  });
});
