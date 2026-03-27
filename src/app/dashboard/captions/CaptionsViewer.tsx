"use client";

import { useState } from "react";

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
  flavorCounts: Record<number, number>;
  totalCount: number;
}

export default function CaptionsViewer({ flavors, captions, flavorCounts, totalCount }: Props) {
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | "all">("all");

  const filtered =
    selectedFlavorId === "all"
      ? captions
      : captions.filter((c) => c.humor_flavor_id === selectedFlavorId);

  const flavorMap = Object.fromEntries(flavors.map((f) => [f.id, f.slug]));

  const selectedFlavorTotal =
    selectedFlavorId === "all" ? totalCount : (flavorCounts[selectedFlavorId] ?? 0);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by flavor:
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFlavorId("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedFlavorId === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All ({totalCount.toLocaleString()})
          </button>
          {flavors.map((f) => {
            const count = flavorCounts[f.id] ?? 0;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFlavorId(f.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFlavorId === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f.slug} ({count.toLocaleString()})
              </button>
            );
          })}
        </div>
      </div>

      {/* Caption count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Showing {filtered.length} of {selectedFlavorTotal.toLocaleString()} caption{selectedFlavorTotal !== 1 ? "s" : ""}
        {filtered.length < selectedFlavorTotal && (
          <span className="ml-1 text-gray-400 dark:text-gray-500">(most recent 200 loaded)</span>
        )}
      </p>

      {/* Caption list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          {selectedFlavorTotal > 0 ? (
            <>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                This flavor has {selectedFlavorTotal.toLocaleString()} caption{selectedFlavorTotal !== 1 ? "s" : ""}, but none appear in the most recent 200 loaded.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Older captions are not shown in this view.</p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No captions found.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((caption) => (
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
                {caption.content ?? <span className="italic text-gray-400">No caption text</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
