import { describe, expect, it } from "vitest";
import { AIResult, AI_JSON_SCHEMA, cleanParams, extractText, readerInstructions } from "../src/solver/ai";
import { TEMPLATES, solveTemplate } from "../src/solver";

describe("AI reader: everything it returns is checked before use", () => {
  it("finds the text in the interactions response shape and older shapes", () => {
    expect(extractText({ steps: [{ type: "model_output", content: [{ type: "text", text: '{"a":1}' }] }] })).toBe('{"a":1}');
    expect(extractText({ output_text: "x" })).toBe("x");
    expect(extractText({ candidates: [{ content: { parts: [{ text: "y" }] } }] })).toBe("y");
    expect(extractText({})).toBeNull();
  });
  it("rejects a reply in the wrong shape", () => {
    expect(AIResult.safeParse({ kind: "maybe" }).success).toBe(false);
    expect(AIResult.safeParse({ kind: "supported", params: { u: "twenty" } }).success).toBe(false);
  });
  it("keeps only numbers the chosen template knows, and drops nulls", () => {
    expect(cleanParams("projectile", { u: 20, angleDeg: 37, k: 50, h: null })).toEqual({ u: 20, angleDeg: 37 });
    expect(cleanParams("nonsense", { u: 1 })).toEqual({});
  });
  it("a reader result for a supported question is then solved by code, not by the AI", () => {
    const r = AIResult.parse({ kind: "supported", template: "projectile", params: { u: 20, angleDeg: 37 }, asked: ["range"], question: "q", answer_text: "" });
    const s = solveTemplate("projectile", cleanParams(r.template, r.params));
    expect(s.verified).toBe(true);
    expect(s.solution.quantities.find((q) => q.key === "R")!.value).toBeCloseTo(38.4, 10);
  });
  it("the instructions list every template and its numbers, and the schema allows only known templates", () => {
    const text = readerInstructions();
    for (const t of TEMPLATES) expect(text).toContain(`"${t.id}"`);
    expect(AI_JSON_SCHEMA.properties.template.enum).toEqual(["", ...TEMPLATES.map((t) => t.id)]);
    expect(text).toContain("Never put a final answer");
  });
});
