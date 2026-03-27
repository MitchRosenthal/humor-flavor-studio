import { createClient } from "@/lib/supabase/server";
import FlavorsManager from "./FlavorsManager";

export const revalidate = 0;

export default async function FlavorsPage() {
  const supabase = await createClient();

  const { data: flavors, error } = await supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .order("id");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Humor Flavors</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Create, edit, and manage humor flavors. Click ⚙️ Steps to manage a flavor&apos;s prompt chain.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">
          Error loading flavors: {error.message}
        </div>
      )}

      <FlavorsManager flavors={flavors ?? []} />
    </div>
  );
}
