/** Formats a number to 3 significant figures, keeping trailing zeros (1.20, not 1.2). */
export function sig3(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 1e-9) return "0.00";
  const s = value.toPrecision(3);
  // toPrecision switches to exponent form for large/small numbers; print those plainly.
  return s.includes("e") ? String(Number(s)) : s;
}
