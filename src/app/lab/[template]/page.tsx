import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectileLab } from "../../../templates/projectile/Lab";

const LABS = {
  projectile: { title: "Projectile motion", Lab: ProjectileLab },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LABS).map((template) => ({ template }));
}

export default async function LabPage(props: PageProps<"/lab/[template]">) {
  const { template } = await props.params;
  const lab = LABS[template as keyof typeof LABS];
  if (!lab) notFound();
  const { title, Lab } = lab;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <Link href="/" className="text-chalk-dim underline underline-offset-4">
          Prayog Studio
        </Link>
      </header>
      <Lab />
    </main>
  );
}
