import katex from "katex";
import { describe, expect, it } from "vitest";
import { z } from "zod";

// Phase 0: proves the test runner and the core libraries load.
// The physics verification suite starts in Phase 1.
describe("toolchain", () => {
  it("renders a JEE formula with KaTeX", () => {
    const html = katex.renderToString("R = \\dfrac{u^{2}\\sin 2\\theta}{g}", {
      throwOnError: true,
    });
    expect(html).toContain("katex");
  });

  it("validates data with zod", () => {
    const Answer = z.object({
      value: z.number(),
      unit: z.string(),
      exact: z.string().optional(),
    });
    expect(Answer.safeParse({ value: 40, unit: "m" }).success).toBe(true);
    expect(Answer.safeParse({ value: "40", unit: "m" }).success).toBe(false);
  });
});
