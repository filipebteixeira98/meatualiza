import type { Metadata } from "next";
import { EvaluationsPage } from "@/features/evaluations/page";

export const metadata: Metadata = {
  title: "Avaliações dos meus atendimentos",
  robots: { index: false, follow: false },
};

export default function StudentEvaluationsPage() {
  return <EvaluationsPage role="student" />;
}
