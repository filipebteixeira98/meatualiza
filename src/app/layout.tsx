import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-sans.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "meatualiza — Monitoria de Lógica de Programação",
    template: "%s | meatualiza",
  },
  description:
    "Um espaço para perguntar, praticar e avançar em Lógica de Programação. Monitoria presencial às segundas e quartas, no SENAI Dendezeiros, laboratório L7.",
  openGraph: {
    title: "meatualiza — Deu um nó na lógica?",
    description:
      "Conheça a monitoria de Lógica de Programação no SENAI Dendezeiros.",
    siteName: "meatualiza",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground focus:translate-y-0 focus:outline-2 focus:outline-offset-4 focus:outline-ring"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
