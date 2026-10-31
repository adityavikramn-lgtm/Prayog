// ASE102 Unit II: imperfections in solids and strengthening of metals. Every number shown comes
// from here and is checked a second way in tests/defects.test.ts. Book values: Callister Ch. 5 and 8.

export const K_BOLTZ_EV = 8.62e-5; // eV/K (book value)
export const N_A = 6.022e23;

// ---------- vacancies: Nv = N exp(−Qv / kT) ----------

/** Atom sites per m³ from density (g/cm³) and atomic weight (g/mol): N = N_A ρ / A. */
export const sitesPerM3 = (rhoGcm3: number, aGmol: number) => (N_A * rhoGcm3 * 1e6) / aGmol;
export const vacancyFraction = (qEv: number, K: number) => Math.exp(-qEv / (K_BOLTZ_EV * K));

/** Book Example 5.1: copper at 1000 °C, Qv = 0.9 eV, ρ = 8.40 g/cm³, A = 63.5 g/mol. */
export const CU_VAC = (() => {
  const qEv = 0.9;
  const K = 1000 + 273;
  const N = sitesPerM3(8.4, 63.5);
  const frac = vacancyFraction(qEv, K);
  const roomFrac = vacancyFraction(qEv, 300);
  return { qEv, K, N, Nv: N * frac, frac, oneIn: 1 / frac, roomFrac };
})();

// ---------- atomic vibrations ----------

export const VIBRATION = { perSecond: 1e13 };
/** Vibration amplitude grows as √T (equipartition: ½ k_s x² ~ ½ kT). Relative to room temperature. */
export const amplitudeRatio = (K: number, refK = 300) => Math.sqrt(K / refK);

// ---------- edge dislocation (Peierls–Nabarro shape) ----------

/** How far (in spacings) an atom just above the slip plane at x has slipped when the dislocation core is at xd. 0 → 1. */
export const slipped = (x: number, xd: number, width: number) => 0.5 - Math.atan((x - xd) / width) / Math.PI;

// ---------- Hall–Petch: σy = σ0 + ky d^(−1/2) ----------

/** Example values for a steel (σ0 in MPa, ky in MPa·m^½). Shown on screen as "example values". */
export const HALL_PETCH = { sigma0: 70, ky: 0.74 };
export const yieldMPa = (dMicron: number) => HALL_PETCH.sigma0 + HALL_PETCH.ky / Math.sqrt(dMicron * 1e-6);
export const HP_EX = { coarse: 100, fine: 10, coarseMPa: yieldMPa(100), fineMPa: yieldMPa(10) };

// ---------- cold work: %CW = (A0 − Ad) / A0 × 100 ----------

export const circleArea = (dMm: number) => (Math.PI * dMm * dMm) / 4;
export const percentCW = (d0: number, dd: number) => ((circleArea(d0) - circleArea(dd)) / circleArea(d0)) * 100;
/** Book Example 8.2: copper rod 15.2 mm → 12.2 mm → 35.6 %CW. */
export const CW_EX = { d0: 15.2, dd: 12.2, pct: percentCW(15.2, 12.2) };
export const QUIZ = { d0: 10, dd: 8, pct: percentCW(10, 8) };

// ---------- annealing ----------

export const RECRYST = { brassC: 450, lowFrac: 1 / 3, highFrac: 1 / 2, critLow: 2, critHigh: 20 };
/** Recrystallized fraction from nucleation and growth (Avrami): X = 1 − exp(−(t/τ)^n), n = 3 here. */
export const avrami = (t: number, tau: number, n = 3) => (t <= 0 ? 0 : 1 - Math.exp(-((t / tau) ** n)));
/** Grain growth d^n − d0^n = K t with n = 2. */
export const grainGrowth = (d0: number, K: number, t: number, n = 2) => (d0 ** n + K * Math.max(0, t)) ** (1 / n);

export const fmtSci = (x: number, digits = 2) => {
  const e = Math.floor(Math.log10(x));
  const m = x / 10 ** e;
  return { mantissa: m.toPrecision(digits), exp: e };
};
