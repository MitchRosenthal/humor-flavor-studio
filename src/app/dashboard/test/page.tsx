import { createClient } from "@/lib/supabase/server";
import TestRunner from "./TestRunner";

export const revalidate = 0;

export default async function TestPage() {
  const supabase = await createClient();

  const [{ data: flavors }, sessionResult] = await Promise.all([
    supabase.from("humor_flavors").select("id, slug, description").order("slug"),
    supabase.auth.getSession(),
  ]);

  const accessToken = sessionResult.data.session?.access_token ?? null;

  // Fetch step counts for every flavor in parallel
  const flavorList = flavors ?? [];
  const stepCounts = await Promise.all(
    flavorList.map((f) =>
      supabase
        .from("humor_flavor_steps")
        .select("id", { count: "exact", head: true })
        .eq("humor_flavor_id", f.id)
        .then(({ count }) => ({ id: f.id, count: count ?? 0 }))
    )
  );
  const stepCountMap = Object.fromEntries(stepCounts.map(({ id, count }) => [id, count]));

  const flavorsWithCounts = flavorList.map((f) => ({
    ...f,
    stepCount: stepCountMap[f.id] ?? 0,
  }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test Runner</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Upload an image, select a humor flavor, and generate captions using the live API pipeline.
      </p>

      <TestRunner flavors={flavorsWithCounts} accessToken={accessToken} />
    </div>
  );
}
