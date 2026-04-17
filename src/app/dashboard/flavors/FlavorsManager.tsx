"use client";

import { useTransition, useState } from "react";
import { createFlavor, updateFlavor, deleteFlavor, duplicateFlavor } from "./actions";
import Link from "next/link";

interface Flavor {
  id: number;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
  _stepCount?: number;
}

interface DuplicateTarget {
  id: number;
  slug: string;
  description: string | null;
}

export default function FlavorsManager({ flavors }: { flavors: Flavor[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [duplicateTarget, setDuplicateTarget] = useState<DuplicateTarget | null>(null);
  const [dupSlug, setDupSlug] = useState("");
  const [dupDescription, setDupDescription] = useState("");

  const handleCreate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createFlavor(formData);
      if (result && "error" in result) setError(result.error);
      else setShowCreate(false);
    });
  };

  const handleUpdate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateFlavor(formData);
      if (result && "error" in result) setError(result.error);
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
      if (result && "error" in result) setError(result.error);
    });
  };

  const openDuplicateModal = (flavor: Flavor) => {
    setDuplicateTarget({ id: flavor.id, slug: flavor.slug, description: flavor.description });
    setDupSlug(`${flavor.slug}-copy`);
    setDupDescription(flavor.description ?? "");
    setError(null);
  };

  const closeDuplicateModal = () => {
    setDuplicateTarget(null);
    setDupSlug("");
    setDupDescription("");
  };

  const handleDuplicateConfirm = () => {
    if (!duplicateTarget) return;
    const trimmedSlug = dupSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmedSlug) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", String(duplicateTarget.id));
    formData.set("newSlug", trimmedSlug);
    formData.set("newDescription", dupDescription.trim());
    startTransition(async () => {
      const result = await duplicateFlavor(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        closeDuplicateModal();
      }
    });
  };

  const filteredFlavors = flavors.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.slug.toLowerCase().includes(q) ||
      (f.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Duplicate rename modal */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Duplicate Flavor
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Copying &ldquo;{duplicateTarget.slug}&rdquo; and all its steps. Choose a new name below.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  New Slug <span className="text-red-500">*</span>
                </label>
                <input
                  value={dupSlug}
                  onChange={(e) => setDupSlug(e.target.value)}
                  placeholder="e.g. dry-wit-copy"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <input
                  value={dupDescription}
                  onChange={(e) => setDupDescription(e.target.value)}
                  placeholder="Short description of this flavor"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeDuplicateModal}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDuplicateConfirm}
                disabled={isPending || !dupSlug.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Duplicating…" : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
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

      {/* Search bar */}
      <div className="mb-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flavors by name or description…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Flavor list */}
      <div className="space-y-3">
        {filteredFlavors.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            {search ? `No flavors match "${search}".` : "No humor flavors yet. Create one above."}
          </p>
        )}

        {filteredFlavors.map((flavor) =>
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
                  onClick={() => openDuplicateModal(flavor)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors font-medium disabled:opacity-50"
                >
                  📋 Duplicate
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
