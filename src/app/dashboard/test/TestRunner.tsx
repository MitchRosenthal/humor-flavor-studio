"use client";

import { useState, useRef } from "react";

interface Flavor {
  id: number;
  slug: string;
  description: string | null;
}

interface Props {
  flavors: Flavor[];
  accessToken: string | null;
}

interface LogEntry {
  ts: string;
  level: "info" | "success" | "error";
  message: string;
}

const API_BASE = "https://api.almostcrackd.ai";

export default function TestRunner({ flavors, accessToken }: Props) {
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (level: LogEntry["level"], message: string) => {
    const ts = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, { ts, level, message }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleRun = async () => {
    if (!selectedFlavorId) {
      addLog("error", "Please select a humor flavor.");
      return;
    }
    if (!imageFile) {
      addLog("error", "Please select an image.");
      return;
    }
    if (!accessToken) {
      addLog("error", "No access token — please refresh the page.");
      return;
    }

    setIsRunning(true);
    setLog([]);
    setCaptions([]);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    try {
      // Step 1: Get presigned upload URL
      addLog("info", "Step 1: Requesting presigned upload URL…");
      const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const contentType = imageFile.type || "image/jpeg";

      const presignRes = await fetch(
        `${API_BASE}/images/upload-url?file_extension=${ext}`,
        { method: "GET", headers }
      );
      if (!presignRes.ok) {
        const text = await presignRes.text();
        throw new Error(`Presigned URL failed (${presignRes.status}): ${text}`);
      }
      const presignData = await presignRes.json();
      const { upload_url, image_id } = presignData;
      addLog("success", `Got presigned URL. Image ID: ${image_id}`);

      // Step 2: Upload image to S3
      addLog("info", "Step 2: Uploading image to S3…");
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: imageFile,
        headers: { "Content-Type": contentType },
      });
      if (!uploadRes.ok) {
        throw new Error(`S3 upload failed (${uploadRes.status})`);
      }
      addLog("success", "Image uploaded to S3 successfully.");

      // Step 3: Register the image
      addLog("info", "Step 3: Registering image with the API…");
      const registerRes = await fetch(`${API_BASE}/images/register`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ image_id, file_extension: ext }),
      });
      if (!registerRes.ok) {
        const text = await registerRes.text();
        throw new Error(`Image registration failed (${registerRes.status}): ${text}`);
      }
      addLog("success", "Image registered successfully.");

      // Step 4: Generate captions
      addLog("info", `Step 4: Generating captions with flavor ID ${selectedFlavorId}…`);
      const generateRes = await fetch(`${API_BASE}/captions/generate`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id,
          humor_flavor_id: selectedFlavorId,
        }),
      });
      if (!generateRes.ok) {
        const text = await generateRes.text();
        throw new Error(`Caption generation failed (${generateRes.status}): ${text}`);
      }
      const generateData = await generateRes.json();
      addLog("success", "Captions generated!");

      // Extract captions from response
      const captionTexts: string[] = [];
      if (Array.isArray(generateData)) {
        generateData.forEach((item: { caption_text?: string; caption?: string }) => {
          const text = item.caption_text ?? item.caption;
          if (text) captionTexts.push(text);
        });
      } else if (generateData.captions && Array.isArray(generateData.captions)) {
        generateData.captions.forEach((item: { caption_text?: string; caption?: string } | string) => {
          if (typeof item === "string") {
            captionTexts.push(item);
          } else {
            const text = item.caption_text ?? item.caption;
            if (text) captionTexts.push(text);
          }
        });
      } else if (generateData.caption_text) {
        captionTexts.push(generateData.caption_text);
      } else if (generateData.caption) {
        captionTexts.push(generateData.caption);
      }

      if (captionTexts.length === 0) {
        addLog("info", `Raw response: ${JSON.stringify(generateData).slice(0, 300)}`);
      }

      setCaptions(captionTexts);
    } catch (err) {
      addLog("error", String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const selectedFlavor = flavors.find((f) => f.id === selectedFlavorId);

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Flavor selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Humor Flavor <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedFlavorId}
              onChange={(e) => setSelectedFlavorId(e.target.value ? parseInt(e.target.value, 10) : "")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— select a flavor —</option>
              {flavors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.slug}
                </option>
              ))}
            </select>
            {selectedFlavor?.description && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">{selectedFlavor.description}</p>
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Image <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
            >
              {imageFile ? imageFile.name : "Click to select image…"}
            </button>
          </div>
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 rounded-lg object-contain border border-gray-200 dark:border-gray-700"
            />
          </div>
        )}

        {/* Run button */}
        <div className="mt-4">
          <button
            onClick={handleRun}
            disabled={isRunning || !selectedFlavorId || !imageFile}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Running…
              </>
            ) : (
              "▶ Run Test"
            )}
          </button>
        </div>
      </div>

      {/* Log panel */}
      {log.length > 0 && (
        <div className="bg-gray-950 dark:bg-gray-950 border border-gray-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline Log</h2>
          <div className="space-y-1.5 font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-600 flex-shrink-0">{entry.ts}</span>
                <span
                  className={
                    entry.level === "error"
                      ? "text-red-400"
                      : entry.level === "success"
                      ? "text-green-400"
                      : "text-gray-300"
                  }
                >
                  {entry.level === "error" ? "✗" : entry.level === "success" ? "✓" : "→"} {entry.message}
                </span>
              </div>
            ))}
            {isRunning && (
              <div className="flex gap-3">
                <span className="text-gray-600 flex-shrink-0">…</span>
                <span className="text-gray-400 animate-pulse">Working…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Captions output */}
      {captions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Generated Captions
            <span className="ml-2 text-sm font-normal text-gray-400">({captions.length})</span>
          </h2>
          <div className="space-y-3">
            {captions.map((caption, i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 text-gray-800 dark:text-gray-200 text-sm leading-relaxed border border-gray-100 dark:border-gray-700"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 mr-2 font-mono">#{i + 1}</span>
                {caption}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
