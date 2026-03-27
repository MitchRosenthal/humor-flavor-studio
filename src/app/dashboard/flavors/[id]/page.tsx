import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import StepsManager from "./StepsManager";

export const revalidate = 0;

export default async function FlavorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flavorId = parseInt(id, 10);

  const supabase = await createClient();

  const [
    { data: flavor },
    { data: steps },
    { data: models },
    { data: inputTypes },
    { data: outputTypes },
    { data: stepTypes },
  ] = await Promise.all([
    supabase
      .from("humor_flavors")
      .select("id, slug, description")
      .eq("id", flavorId)
      .single(),
    supabase
      .from("humor_flavor_steps")
      .select("id, humor_flavor_id, order_by, description, llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id, llm_temperature, llm_system_prompt, llm_user_prompt")
      .eq("humor_flavor_id", flavorId)
      .order("order_by"),
    supabase
      .from("llm_models")
      .select("id, name")
      .order("name"),
    supabase
      .from("llm_input_types")
      .select("id, description, slug")
      .order("id"),
    supabase
      .from("llm_output_types")
      .select("id, description, slug")
      .order("id"),
    supabase
      .from("humor_flavor_step_types")
      .select("id, slug, description")
      .order("id"),
  ]);

  if (!flavor) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/flavors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
      >
        ← Back to Humor Flavors
      </Link>

      {/* Flavor header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{flavor.slug}</h1>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded font-mono">
            ID {flavor.id}
          </span>
        </div>
        {flavor.description && (
          <p className="text-gray-500 dark:text-gray-400">{flavor.description}</p>
        )}
      </div>

      {/* Steps section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Prompt Steps
          <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
            ({steps?.length ?? 0} step{steps?.length !== 1 ? "s" : ""})
          </span>
        </h2>
        <StepsManager
          flavorId={flavorId}
          steps={steps ?? []}
          models={models ?? []}
          inputTypes={inputTypes ?? []}
          outputTypes={outputTypes ?? []}
          stepTypes={stepTypes ?? []}
        />
      </div>
    </div>
  );
}
