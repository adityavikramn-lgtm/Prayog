import { describe, expect, it } from "vitest";
import { AIResult, AI_JSON_SCHEMA, extractText, fixLatexEscapes, paramsFromGiven, readerInstructions } from "../src/solver/ai";
import { TEMPLATES, solveTemplate } from "../src/solver";

describe("AI reader: everything it returns is checked before use", () => {
  it("keeps LaTeX written with single backslashes inside the JSON reply, without breaking real line breaks", () => {
    const raw = String.raw`{"a":"R = 10\text{ }\Omega, \frac{1}{2}, \rho, ok \\theta, line\nu = 20"}`;
    const a = JSON.parse(fixLatexEscapes(raw)).a as string;
    expect(a).toContain(String.raw`\text{ }\Omega`);
    expect(a).toContain(String.raw`\frac{1}{2}`);
    expect(a).toContain(String.raw`\rho`);
    expect(a).toContain(String.raw`\theta`);
    expect(a).toContain("line\nu = 20"); // a real new line before "u = 20", not Greek nu
  });
  it("finds the text in the interactions response shape and older shapes", () => {
    expect(extractText({ steps: [{ type: "model_output", content: [{ type: "text", text: '{"a":1}' }] }] })).toBe('{"a":1}');
    expect(extractText({ output_text: "x" })).toBe("x");
    expect(extractText({ candidates: [{ content: { parts: [{ text: "y" }] } }] })).toBe("y");
    expect(extractText({})).toBeNull();
  });
  it("rejects a reply in the wrong shape", () => {
    expect(AIResult.safeParse({ kind: "maybe" }).success).toBe(false);
    expect(AIResult.safeParse({ kind: "supported", given: [{ name: "u", value: "twenty" }] }).success).toBe(false);
  });
  it("keeps only numbers the chosen template knows; drops a banked speed of 0 (the asked quantity)", () => {
    expect(paramsFromGiven("projectile", [{ name: "u", value: 20 }, { name: "angleDeg", value: 37 }, { name: "k", value: 50 }, { name: "h", value: NaN }])).toEqual({ u: 20, angleDeg: 37 });
    expect(paramsFromGiven("nonsense", [{ name: "u", value: 1 }])).toEqual({});
    expect(paramsFromGiven("banked", [{ name: "r", value: 200 }, { name: "v", value: 0 }])).toEqual({ r: 200 });
  });
  it("a reader result for a supported question is then solved by code, not by the AI", () => {
    const r = AIResult.parse({ kind: "supported", template: "projectile", given: [{ name: "u", value: 20, from_text: "20 m/s" }, { name: "angleDeg", value: 37, from_text: "37°" }], asked: ["range"], question: "q", answer_text: "" });
    const s = solveTemplate("projectile", paramsFromGiven(r.template, r.given));
    expect(s.verified).toBe(true);
    expect(s.solution.quantities.find((q) => q.key === "R")!.value).toBeCloseTo(38.4, 10);
  });
  it("the instructions list every template and its numbers, and the schema allows only known templates", () => {
    const text = readerInstructions();
    for (const t of TEMPLATES) expect(text).toContain(`"${t.id}"`);
    expect(AI_JSON_SCHEMA.properties.template.enum).toEqual(["", ...TEMPLATES.map((t) => t.id)]);
    expect(text).toContain("Never put a final answer");
    expect(text).toContain(String.raw`$F = \dfrac`); // the LaTeX example keeps its backslash
  });
});
