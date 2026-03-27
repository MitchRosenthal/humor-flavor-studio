import { createClient } from "@/lib/supabase/server";
import TestRunner from "./TestRunner";

export const revalidate = 0;

export default async function TestPage() {
  const supabase = await createClient();

  const { data: flavors } = await supabase
    .from("humor_flavors")
    .select("id, slug, description")
    .order("slug");

  // Get the access token to pass to the client component
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test Runner</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Upload an image, select a humor flavor, and generate captions using the live API pipeline.
      </p>

      <TestRunner flavors={flavors ?? []} accessToken={accessToken} />
    </div>
  );
}
