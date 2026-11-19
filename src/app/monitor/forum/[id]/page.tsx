import { ForumTopicPage, type ForumSearch } from "@/features/forum/page";

export { metadata } from "../page";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: ForumSearch;
}) {
  return (
    <ForumTopicPage
      role="monitor"
      params={params}
      searchParams={searchParams}
    />
  );
}
