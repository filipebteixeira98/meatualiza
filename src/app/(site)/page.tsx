import { Faq } from "@/features/landing/faq";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { Topics } from "@/features/landing/topics";

export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1}>
      <Hero />
      <HowItWorks />
      <Topics />
      <Faq />
    </main>
  );
}
