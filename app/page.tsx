import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = new URLSearchParams(await searchParams);
  const qs = params.toString();
  redirect(`/casino${qs ? `?${qs}` : ""}`);
}
