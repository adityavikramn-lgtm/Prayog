import katex from "katex";
import Link from "next/link";
import "katex/dist/katex.min.css";

const quantities = [
  { name: "Velocity", symbol: "\\vec{v}", className: "text-velocity" },
  { name: "Acceleration", symbol: "\\vec{a}", className: "text-acceleration" },
  { name: "Force", symbol: "\\vec{F}", className: "text-force" },
  { name: "Displacement", symbol: "\\vec{s}", className: "text-displacement" },
];

const tex = (source: string, displayMode = false) => ({
  __html: katex.renderToString(source, { displayMode, throwOnError: true }),
});

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-5 py-14">
      <header className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-chalk-dim">
          Built for JEE teachers
        </p>
        <h1 className="text-5xl font-bold sm:text-6xl">Prayog Studio</h1>
        <p className="text-xl leading-relaxed text-chalk-dim">
          Physics-true animations and triple-verified JEE practice. AI for
          language, code for truth.
        </p>
      </header>

      <section
        className="rounded-xl border border-board-line bg-board-raised p-6 text-2xl"
        dangerouslySetInnerHTML={tex(
          "R = \\dfrac{u^{2}\\,\\sin 2\\theta}{g}",
          true,
        )}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">One colour per quantity</h2>
        <ul className="grid grid-cols-2 gap-3 text-lg">
          {quantities.map((q) => (
            <li
              key={q.name}
              className={`flex items-center gap-3 rounded-lg border border-board-line px-4 py-3 ${q.className}`}
            >
              <span dangerouslySetInnerHTML={tex(q.symbol)} />
              <span>{q.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/solve"
        className="rounded-xl bg-[#4ef0c4] px-6 py-5 text-xl font-bold text-board hover:opacity-90"
      >
        Ask a physics question, see it in 3D →
      </Link>

      <Link
        href="/lab/projectile"
        className="rounded-xl border border-velocity px-6 py-5 text-xl font-bold text-velocity hover:bg-board-raised"
      >
        Open the projectile lab →
      </Link>

      <footer className="mt-auto border-t border-board-line pt-5 text-sm text-chalk-dim">
        Work in progress: Phase 1 of 7.
      </footer>
    </main>
  );
}
