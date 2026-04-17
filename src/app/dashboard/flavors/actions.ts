"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFlavor(formData: FormData): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const slug = (formData.get("slug") as string).trim().toLowerCase().replace(/\s+/g, "-");
  const description = (formData.get("description") as string).trim();

  const { error } = await supabase
    .from("humor_flavors")
    .insert({ slug, description });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/flavors");
  return { success: true };
}

export async function updateFlavor(formData: FormData): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const slug = (formData.get("slug") as string).trim().toLowerCase().replace(/\s+/g, "-");
  const description = (formData.get("description") as string).trim();

  const { error } = await supabase
    .from("humor_flavors")
    .update({ slug, description })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/flavors");
  revalidatePath(`/dashboard/flavors/${id}`);
  return { success: true };
}

export async function deleteFlavor(formData: FormData): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/flavors");
  return { success: true };
}

export async function duplicateFlavor(formData: FormData): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  // Fetch the original flavor
  const { data: original, error: fetchError } = await supabase
    .from("humor_flavors")
    .select("slug, description")
    .eq("id", id)
    .single();

  if (fetchError || !original) return { error: fetchError?.message ?? "Flavor not found" };

  // Fetch all existing slugs to find a unique one
  const { data: existingFlavors } = await supabase
    .from("humor_flavors")
    .select("slug");

  const existingSlugs = new Set((existingFlavors ?? []).map((f: { slug: string }) => f.slug));

  // Generate a unique slug by appending -copy, -copy-2, -copy-3, etc.
  let newSlug = `${original.slug}-copy`;
  let counter = 2;
  while (existingSlugs.has(newSlug)) {
    newSlug = `${original.slug}-copy-${counter}`;
    counter++;
  }

  // Insert the new flavor
  const { data: newFlavor, error: insertError } = await supabase
    .from("humor_flavors")
    .insert({ slug: newSlug, description: original.description })
    .select("id")
    .single();

  if (insertError || !newFlavor) return { error: insertError?.message ?? "Failed to create duplicate flavor" };

  // Fetch the original steps
  const { data: steps, error: stepsError } = await supabase
    .from("humor_flavor_steps")
    .select("order_by, description, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_temperature, llm_system_prompt, llm_user_prompt")
    .eq("humor_flavor_id", id)
    .order("order_by");

  if (stepsError) return { error: stepsError.message };

  // Insert copied steps if any exist
  if (steps && steps.length > 0) {
    const newSteps = steps.map((step) => ({ ...step, humor_flavor_id: newFlavor.id }));
    const { error: stepsInsertError } = await supabase.from("humor_flavor_steps").insert(newSteps);
    if (stepsInsertError) return { error: stepsInsertError.message };
  }

  revalidatePath("/dashboard/flavors");
  return { success: true };
}
