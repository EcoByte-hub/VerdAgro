import { describe, expect, it } from "vitest";
import { cn, formatHectares, formatNumber } from "./utils";

describe("utils", () => {
  it("formata números no padrão brasileiro", () => {
    expect(formatNumber(1234.5, 1)).toBe("1.234,5");
  });

  it("formata hectares", () => {
    expect(formatHectares(200)).toBe("200,0 ha");
  });

  it("resolve conflitos de classes do Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
