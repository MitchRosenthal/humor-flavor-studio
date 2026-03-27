"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStep(formData: FormData) {
  const supabase = await createClient();
  const humor_flavor_id = parseInt(formData.get("humor_flavor_id") as string, 10);
  const order_by = parseInt(formData.get("order_by") as string, 10);
  const description = (formData.get("description") as string).trim() || null;
  const llm_model_id = formData.get("llm_model_id") ? parseInt(formData.get("llm_model_id") as string, 10) : null;
  const llm_temperature = formData.get("llm_temperature") ? parseFloat(formData.get("llm_temperature") as string) : null;
  const llm_system_prompt = (formData.get("llm_system_prompt") as string).trim() || null;
  const llm_user_prompt = (formData.get("llm_user_prompt") as string).trim() || null;

  const { error } = await supabase.from("humor_flavor_steps").insert({
    humor_flavor_id,
    order_by,
    description,
    llm_model_id,
    llm_temperature,
    llm_system_prompt,
    llm_user_prompt,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/flavors/${humor_flavor_id}`);
  return { success: true };
}

export async function updateStep(formData: FormData) {
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const humor_flavor_id = parseInt(formData.get("humor_flavor_id") as string, 10);
  const description = (formData.get("description") as string).trim() || null;
  const llm_model_id = formData.get("llm_model_id") ? parseInt(formData.get("llm_model_id") as string, 10) : null;
  const llm_temperature = formData.get("llm_temperature") ? parseFloat(formData.get("llm_temperature") as string) : null;
  const llm_system_prompt = (formData.get("llm_system_prompt") as string).trim() || null;
  const llm_user_prompt = (formData.get("llm_user_prompt") as string).trim() || null;

  const { error } = await supabase
    .from("humor_flavor_steps")
    .update({ description, llm_model_id, llm_temperature, llm_system_prompt, llm_user_prompt })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/flavors/${humor_flavor_id}`);
  return { success: true };
}

export async function deleteStep(formData: FormData) {
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const humor_flavor_id = formData.get("humor_flavor_id") as string;

  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/flavors/${humor_flavor_id}`);
  return { success: true };
}

export async function reorderStep(formData: FormData) {
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const humor_flavor_id = parseInt(formData.get("humor_flavor_id") as string, 10);
  const current_order = parseInt(formData.get("current_order") as string, 10);
  const direction = formData.get("direction") as "up" | "down";

  const new_order = direction === "up" ? current_order - 1 : current_order + 1;

  // Find the step that currently has new_order
  const { data: swapTarget } = await supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("humor_flavor_id", humor_flavor_id)
    .eq("order_by", new_order)
    .single();

  if (swapTarget) {
    // Swap order_by values
    await supabase.from("humor_flavor_steps").update({ order_by: current_order }).eq("id", swapTarget.id);
  }
  await supabase.from("humor_flavor_steps").update({ order_by: new_order }).eq("id", id);

  revalidatePath(`/dashboard/flavors/${humor_flavor_id}`);
  return { success: true };
}
