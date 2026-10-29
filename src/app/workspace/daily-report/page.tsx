import { redirect } from "next/navigation";

export default async function WorkspaceDailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const query = params.date ? `?date=${params.date}` : "";
  redirect(`/workspace/report${query}`);
}
