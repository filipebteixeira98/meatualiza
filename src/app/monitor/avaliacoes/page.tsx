import type { Metadata } from "next";
import { EvaluationsPage } from "@/features/evaluations/page";

export const metadata: Metadata = {
  title: "Avaliações dos atendimentos",
  robots: { index: false, follow: false },
};

export default function MonitorEvaluationsPage() {
  return <EvaluationsPage role="monitor" />;
}
