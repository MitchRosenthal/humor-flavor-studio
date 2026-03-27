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
