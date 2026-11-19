import type { Metadata } from "next";
import { ForumPage, type ForumSearch } from "@/features/forum/page";

export const metadata: Metadata = {
  title: "Fórum",
  robots: { index: false, follow: false },
};

export default function Page({ searchParams }: { searchParams: ForumSearch }) {
  return <ForumPage role="student" searchParams={searchParams} />;
}
