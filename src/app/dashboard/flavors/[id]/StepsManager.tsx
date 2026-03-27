"use client";

import { useTransition, useState } from "react";
import { createStep, updateStep, deleteStep, reorderStep } from "./actions";

interface Step {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  description: string | null;
  llm_model_id: number | null;
  llm_input_type_id: number | null;
  llm_temperature: number | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
}

interface Model {
  id: number;
  name: string;
}

interface InputType {
  id: number;
  name: string;
}

interface Props {
  flavorId: number;
  steps: Step[];
  models: Model[];
  inputTypes: InputType[];
}

function StepForm({
  flavorId,
  defaultOrderBy,
  step,
  models,
  inputTypes,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  flavorId: number;
  defaultOrderBy?: number;
  step?: Step;
  models: Model[];
  inputTypes: InputType[];
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      {step && <input type="hidden" name="id" value={step.id} />}
      <input type="hidden" name="humor_flavor_id" value={flavorId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!step && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Order # <span className="text-red-500">*</span>
            </label>
            <input
              name="order_by"
              type="number"
              required
              defaultValue={defaultOrderBy ?? 1}
              min={1}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Input Type <span className="text-red-500">*</span>
          </label>
          <select
            name="llm_input_type_id"
            required
            defaultValue={step?.llm_input_type_id ?? ""}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— select input type —</option>
            {inputTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">LLM Model</label>
          <select
            name="llm_model_id"
            defaultValue={step?.llm_model_id ?? ""}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— select model —</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Temperature</label>
          <input
            name="llm_temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            defaultValue={step?.llm_temperature ?? ""}
            placeholder="0.7"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
        <input
          name="description"
          defaultValue={step?.description ?? ""}
          placeholder="What does this step do?"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">System Prompt</label>
        <textarea
          name="llm_system_prompt"
          rows={3}
          defaultValue={step?.llm_system_prompt ?? ""}
          placeholder="Instructions for the model's behavior and persona…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">User Prompt</label>
        <textarea
          name="llm_user_prompt"
          rows={4}
          defaultValue={step?.llm_user_prompt ?? ""}
          placeholder="The prompt sent to the model. Use {{input}} to reference the previous step's output…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function StepsManager({ flavorId, steps, models, inputTypes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.order_by)) : 0;

  // Build a lookup map for display
  const inputTypeMap = Object.fromEntries(inputTypes.map((t) => [t.id, t.name]));

  const handleCreate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createStep(formData);
      if (result && "error" in result) setError(result.error);
      else setShowCreate(false);
    });
  };

  const handleUpdate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateStep(formData);
      if (result && "error" in result) setError(result.error);
      else setEditingId(null);
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this step?")) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("humor_flavor_id", String(flavorId));
    startTransition(async () => {
      const result = await deleteStep(formData);
      if (result && "error" in result) setError(result.error);
    });
  };

  const handleReorder = (step: Step, direction: "up" | "down") => {
    setError(null);
    const formData = new FormData();
    formData.set("id", String(step.id));
    formData.set("humor_flavor_id", String(flavorId));
    formData.set("current_order", String(step.order_by));
    formData.set("direction", direction);
    startTransition(async () => {
      const result = await reorderStep(formData);
      if (result && "error" in result) setError(result.error);
    });
  };

  const sortedSteps = [...steps].sort((a, b) => a.order_by - b.order_by);

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Steps list */}
      <div className="space-y-3 mb-6">
        {sortedSteps.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            No steps yet. Add the first step below.
          </p>
        )}

        {sortedSteps.map((step, idx) => (
          <div
            key={step.id}
            className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden ${
              editingId === step.id
                ? "border-blue-300 dark:border-blue-700"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            {editingId === step.id ? (
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Edit Step {step.order_by}</h3>
                <StepForm
                  flavorId={flavorId}
                  step={step}
                  models={models}
                  inputTypes={inputTypes}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  isPending={isPending}
                  submitLabel="Save Changes"
                />
              </div>
            ) : (
              <div>
                {/* Step header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                      {step.order_by}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {step.description ?? <span className="italic text-gray-400">No description</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <button
                      onClick={() => handleReorder(step, "up")}
                      disabled={isPending || idx === 0}
                      title="Move up"
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleReorder(step, "down")}
                      disabled={isPending || idx === sortedSteps.length - 1}
                      title="Move down"
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => setEditingId(step.id)}
                      className="px-2.5 py-1 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors ml-1"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(step.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Step details */}
                <div className="px-4 py-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Input Type: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {step.llm_input_type_id ? (inputTypeMap[step.llm_input_type_id] ?? step.llm_input_type_id) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Temp: </span>
                    <span className="text-gray-700 dark:text-gray-300">{step.llm_temperature ?? "—"}</span>
                  </div>
                  {step.llm_system_prompt && (
                    <div className="col-span-2">
                      <div className="text-gray-400 dark:text-gray-500 mb-1">System Prompt:</div>
                      <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs overflow-auto max-h-24">
                        {step.llm_system_prompt}
                      </pre>
                    </div>
                  )}
                  {step.llm_user_prompt && (
                    <div className="col-span-2">
                      <div className="text-gray-400 dark:text-gray-500 mb-1">User Prompt:</div>
                      <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs overflow-auto max-h-24">
                        {step.llm_user_prompt}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add step button / form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full flex items-center gap-2 px-5 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">{showCreate ? "−" : "+"}</span>
          <span>Add New Step</span>
        </button>

        {showCreate && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
            <StepForm
              flavorId={flavorId}
              defaultOrderBy={maxOrder + 1}
              models={models}
              inputTypes={inputTypes}
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isPending={isPending}
              submitLabel="Add Step"
            />
          </div>
        )}
      </div>
    </div>
  );
}
