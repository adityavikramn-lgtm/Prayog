import { Metadata } from "next";
import SolveApp from "../../solve3d/SolveApp";

export const metadata: Metadata = {
  title: "Prayog · Physics in 3D",
  description: "Type or photograph a physics question and watch it happen in 3D, with a checked step-by-step answer.",
};

export default function SolvePage() {
  return <SolveApp />;
}
