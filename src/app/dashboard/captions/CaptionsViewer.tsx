"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

interface Flavor {
  id: number;
  slug: string;
}

interface Caption {
  id: number;
  image_id: string | null;
  content: string | null;
  humor_flavor_id: number | null;
  created_datetime_utc: string;
}

interface Props {
  flavors: Flavor[];
  captions: Caption[];
  totalCount: number;
  selectedFlavorId: number | null;
  page: number;
  totalPages: number;
  pageSize: number;
}

export default function CaptionsViewer({
  flavors,
  captions,
  totalCount,
  selectedFlavorId,
  page,
  totalPages,
  pageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigate(flavorId: number | null, toPage: number) {
    const params = new URLSearchParams();
    if (flavorId !== null) params.set("flavorId", String(flavorId));
    if (toPage > 1) params.set("page", String(toPage));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  const flavorMap = Object.fromEntries(flavors.map((f) => [f.id, f.slug]));

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className={isPending ? "opacity-60 pointer-events-none transition-opacity" : ""}>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by flavor:
        </span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(null, 1)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedFlavorId === null
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {flavors.map((f) => (
            <button
              key={f.id}
              onClick={() => navigate(f.id, 1)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedFlavorId === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f.slug}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalCount === 0
            ? "No captions found"
            : `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${totalCount.toLocaleString()} caption${totalCount !== 1 ? "s" : ""}`}
          {selectedFlavorId !== null && (
            <span className="ml-1 text-gray-400 dark:text-gray-500">
              for <span className="font-medium">{flavorMap[selectedFlavorId] ?? `Flavor ${selectedFlavorId}`}</span>
            </span>
          )}
        </p>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(selectedFlavorId, page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <button
              onClick={() => navigate(selectedFlavorId, page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Caption list */}
      {captions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No captions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {captions.map((caption) => (
            <div
              key={caption.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {caption.humor_flavor_id && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                      {flavorMap[caption.humor_flavor_id] ?? `Flavor ${caption.humor_flavor_id}`}
                    </span>
                  )}
                  {caption.image_id && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
                      img: {caption.image_id.slice(0, 8)}…
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                  {new Date(caption.created_datetime_utc).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                {caption.content ?? (
                  <span className="italic text-gray-400">No caption text</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => navigate(selectedFlavorId, page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages.toLocaleString()}
          </span>
          <button
            onClick={() => navigate(selectedFlavorId, page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
