import { Metadata } from "next";
import SolveApp from "../solve3d/SolveApp";

// The main address is the student platform: ask any physics question, see it in 3D.
export const metadata: Metadata = {
  title: "Prayog · Physics in 3D",
  description: "Type or photograph any physics question and watch it happen in 3D, with a step-by-step answer checked by simulation. Free for every student.",
};

export default function Home() {
  return <SolveApp />;
}
