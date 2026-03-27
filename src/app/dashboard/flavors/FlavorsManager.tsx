"use client";

import { useTransition, useState } from "react";
import { createFlavor, updateFlavor, deleteFlavor } from "./actions";
import Link from "next/link";

interface Flavor {
  id: number;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
  _stepCount?: number;
}

export default function FlavorsManager({ flavors }: { flavors: Flavor[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createFlavor(formData);
      if (result?.error) setError(result.error);
      else setShowCreate(false);
    });
  };

  const handleUpdate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateFlavor(formData);
      if (result?.error) setError(result.error);
      else setEditingId(null);
    });
  };

  const handleDelete = (id: number, slug: string) => {
    if (!confirm(`Delete flavor "${slug}"? This will also delete all its steps.`)) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", String(id));
    startTransition(async () => {
      const result = await deleteFlavor(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Create form */}
      <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full flex items-center gap-2 px-5 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">{showCreate ? "−" : "+"}</span>
          <span>Create New Humor Flavor</span>
        </button>

        {showCreate && (
          <form action={handleCreate} className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  required
                  placeholder="e.g. dry-wit"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <input
                  name="description"
                  placeholder="Short description of this flavor"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating…" : "Create Flavor"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Flavor list */}
      <div className="space-y-3">
        {flavors.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            No humor flavors yet. Create one above.
          </p>
        )}

        {flavors.map((flavor) =>
          editingId === flavor.id ? (
            // Edit form inline
            <form key={flavor.id} action={handleUpdate} className="bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 rounded-xl px-5 py-4">
              <input type="hidden" name="id" value={flavor.id} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Slug</label>
                  <input
                    name="slug"
                    required
                    defaultValue={flavor.slug}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                  <input
                    name="description"
                    defaultValue={flavor.description ?? ""}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div key={flavor.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{flavor.slug}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                    ID {flavor.id}
                  </span>
                </div>
                {flavor.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{flavor.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/dashboard/flavors/${flavor.id}`}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  ⚙️ Steps
                </Link>
                <button
                  onClick={() => setEditingId(flavor.id)}
                  className="px-3 py-1.5 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(flavor.id, flavor.slug)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
