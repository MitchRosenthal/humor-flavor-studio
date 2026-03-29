"use client";

import { useTransition, useState, useRef, useCallback } from "react";
import { createStep, updateStep, deleteStep, reorderStep } from "./actions";

interface Step {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  description: string | null;
  llm_model_id: number | null;
  llm_input_type_id: number | null;
  llm_output_type_id: number | null;
  humor_flavor_step_type_id: number | null;
  llm_temperature: number | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
}

interface Model { id: number; name: string }
interface InputType { id: number; description: string; slug: string }
interface OutputType { id: number; description: string; slug: string }
interface StepType { id: number; slug: string; description: string }

interface Props {
  flavorId: number;
  steps: Step[];
  models: Model[];
  inputTypes: InputType[];
  outputTypes: OutputType[];
  stepTypes: StepType[];
}

// Human-readable descriptions and smart defaults for each step type slug
const STEP_TYPE_META: Record<string, {
  label: string;
  hint: string;
  defaultInputSlug: string;
  defaultOutputSlug: string;
  systemPromptSuggestion: string;
  userPromptSuggestion: string;
}> = {
  "image-description": {
    label: "Image Description",
    hint: "Describes the image in detail. Its output becomes ${step1Output} for all downstream steps — this should always be Step 1.",
    defaultInputSlug: "image-and-text",
    defaultOutputSlug: "string",
    systemPromptSuggestion: "You are an expert at describing images in precise, vivid detail. Focus on what you see: people, setting, objects, expressions, and mood.",
    userPromptSuggestion: "Describe this image in detail.",
  },
  "celebrity-recognition": {
    label: "Celebrity Recognition",
    hint: "Identifies celebrities or notable people in the image. Uses the image description from Step 1.",
    defaultInputSlug: "image-and-text",
    defaultOutputSlug: "string",
    systemPromptSuggestion: "You are an expert at identifying celebrities and public figures. Be specific about who you see and provide context about who they are.",
    userPromptSuggestion: "Image description: ${step1Output}\n\nIdentify any celebrities or notable people in this image.",
  },
  "general": {
    label: "General",
    hint: "General-purpose LLM step. Typically used as the final step to generate caption output from the accumulated context.",
    defaultInputSlug: "text-only",
    defaultOutputSlug: "array",
    systemPromptSuggestion: "You are a witty caption writer. Generate funny, clever captions based on the provided context.",
    userPromptSuggestion: "Image description: ${step1Output}\n\nGenerate 5 funny captions for this image.",
  },
};

function StepForm({
  flavorId,
  orderBy,
  step,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  flavorId: number;
  orderBy: number;
  step?: Step;
  models: Model[];
  inputTypes: InputType[];
  outputTypes: OutputType[];
  stepTypes: StepType[];
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const selectClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  // Resolve initial IDs → slugs for smart defaults
  const initStepTypeId = String(step?.humor_flavor_step_type_id ?? "");
  const initStepTypeSlug = stepTypes.find((t) => t.id === step?.humor_flavor_step_type_id)?.slug ?? "";

  const [stepTypeId, setStepTypeId] = useState(initStepTypeId);
  const [stepTypeSlug, setStepTypeSlug] = useState(initStepTypeSlug);
  const [inputTypeId, setInputTypeId] = useState(String(step?.llm_input_type_id ?? ""));
  const [outputTypeId, setOutputTypeId] = useState(String(step?.llm_output_type_id ?? ""));
  const [systemPrompt, setSystemPrompt] = useState(step?.llm_system_prompt ?? "");
  const [userPrompt, setUserPrompt] = useState(step?.llm_user_prompt ?? "");
  const [temperature, setTemperature] = useState(String(step?.llm_temperature ?? "0.7"));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const userPromptRef = useRef<HTMLTextAreaElement>(null);

  const meta = STEP_TYPE_META[stepTypeSlug];

  // When step type changes: auto-fill input/output types and suggest prompts
  const handleStepTypeChange = useCallback((newId: string) => {
    setStepTypeId(newId);
    const found = stepTypes.find((t) => String(t.id) === newId);
    const slug = found?.slug ?? "";
    setStepTypeSlug(slug);

    const m = STEP_TYPE_META[slug];
    if (!m) return;

    // Auto-set input type if not already set or if user hasn't customised it
    const newInputType = inputTypes.find((t) => t.slug === m.defaultInputSlug);
    if (newInputType) setInputTypeId(String(newInputType.id));

    // Auto-set output type
    const newOutputType = outputTypes.find((t) => t.slug === m.defaultOutputSlug);
    if (newOutputType) setOutputTypeId(String(newOutputType.id));

    setShowSuggestions(true);
  }, [stepTypes, inputTypes, outputTypes]);

  // Insert a template variable at cursor position in the user prompt
  const insertVariable = (variable: string) => {
    const el = userPromptRef.current;
    if (!el) return;
    const start = el.selectionStart ?? userPrompt.length;
    const end = el.selectionEnd ?? userPrompt.length;
    const newVal = userPrompt.slice(0, start) + variable + userPrompt.slice(end);
    setUserPrompt(newVal);
    // Restore cursor after the inserted text
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // Apply the suggested prompts from the meta
  const applySuggestions = () => {
    if (!meta) return;
    setSystemPrompt(meta.systemPromptSuggestion);
    setUserPrompt(meta.userPromptSuggestion);
    setShowSuggestions(false);
  };

  // Available template variables based on step position
  const availableVars = Array.from({ length: orderBy - 1 }, (_, i) => `\${step${i + 1}Output}`);

  return (
    <form action={onSubmit} className="space-y-4">
      {step && <input type="hidden" name="id" value={step.id} />}
      <input type="hidden" name="humor_flavor_id" value={flavorId} />
      {/* order_by is auto-managed — never shown to the user */}
      <input type="hidden" name="order_by" value={orderBy} />

      {/* Row 1: Step Type + Model + Temperature */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Step Type <span className="text-red-500">*</span>
          </label>
          <select
            name="humor_flavor_step_type_id"
            required
            value={stepTypeId}
            onChange={(e) => handleStepTypeChange(e.target.value)}
            className={selectClass}
          >
            <option value="">— select step type —</option>
            {stepTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {STEP_TYPE_META[t.slug]?.label ?? t.slug}
              </option>
            ))}
          </select>
          {meta && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 leading-snug">{meta.hint}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            LLM Model <span className="text-red-500">*</span>
          </label>
          <select
            name="llm_model_id"
            required
            defaultValue={step?.llm_model_id ?? ""}
            className={selectClass}
          >
            <option value="">— select model —</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Temperature
            <span className="ml-1 text-gray-400 font-normal">(0–2, default 0.7)</span>
          </label>
          <input
            name="llm_temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Row 2: Input Type + Output Type (auto-filled by step type) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Input Type <span className="text-red-500">*</span>
            {meta && <span className="ml-1 text-gray-400 font-normal">(auto-set)</span>}
          </label>
          <select
            name="llm_input_type_id"
            required
            value={inputTypeId}
            onChange={(e) => setInputTypeId(e.target.value)}
            className={selectClass}
          >
            <option value="">— select input type —</option>
            {inputTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.description}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Output Type <span className="text-red-500">*</span>
            {meta && <span className="ml-1 text-gray-400 font-normal">(auto-set)</span>}
          </label>
          <select
            name="llm_output_type_id"
            required
            value={outputTypeId}
            onChange={(e) => setOutputTypeId(e.target.value)}
            className={selectClass}
          >
            <option value="">— select output type —</option>
            {outputTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.description}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          name="description"
          defaultValue={step?.description ?? ""}
          placeholder={meta?.label ? `e.g. "${meta.label} for humor generation"` : "What does this step do?"}
          className={selectClass}
        />
      </div>

      {/* Prompt suggestions banner */}
      {showSuggestions && meta && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3 text-xs text-green-700 dark:text-green-300">
          <span className="flex-shrink-0 mt-0.5">✨</span>
          <span className="flex-1">
            Starter prompts are available for the <strong>{meta.label}</strong> step type.
          </span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={applySuggestions}
              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="px-2.5 py-1 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 rounded text-xs hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* System Prompt */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">System Prompt</label>
        <textarea
          name="llm_system_prompt"
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for the model's behavior and persona…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* User Prompt with template variable inserter */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">User Prompt</label>
          {availableVars.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Insert:</span>
              {availableVars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded text-xs font-mono hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  title={`Insert ${v} at cursor`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
        <textarea
          ref={userPromptRef}
          name="llm_user_prompt"
          rows={5}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder={
            orderBy === 1
              ? "Prompt for the model. Step 1 has no prior output to reference."
              : `Use the Insert buttons above to reference ${availableVars[0] ?? "${step1Output}"} from a prior step.`
          }
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          <span className="font-medium text-gray-500 dark:text-gray-400">Chaining:</span>{" "}
          Step N&apos;s output is available as{" "}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-xs">{"${stepNOutput}"}</code>{" "}
          in later steps. Step 1 (<code className="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-xs">image-description</code>) must exist for downstream steps to work.
        </p>
      </div>

      <div className="flex gap-2 pt-1">
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

export default function StepsManager({ flavorId, steps, models, inputTypes, outputTypes, stepTypes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedSteps = [...steps].sort((a, b) => a.order_by - b.order_by);
  const maxOrder = sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1].order_by : 0;
  const minOrder = sortedSteps.length > 0 ? sortedSteps[0].order_by : 1;
  const missingStep1 = sortedSteps.length > 0 && minOrder !== 1;

  // Lookup maps for display
  const inputTypeMap = Object.fromEntries(inputTypes.map((t) => [t.id, t.description]));
  const outputTypeMap = Object.fromEntries(outputTypes.map((t) => [t.id, t.description]));
  const stepTypeMap = Object.fromEntries(stepTypes.map((t) => [t.id, t.slug]));
  const modelMap = Object.fromEntries(models.map((m) => [m.id, m.name]));

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

  const sharedFormProps = { models, inputTypes, outputTypes, stepTypes };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Hard error: no step 1 */}
      {missingStep1 && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 text-xs text-red-700 dark:text-red-300">
          <span className="flex-shrink-0 mt-0.5 text-base">🚨</span>
          <span>
            <strong>Pipeline broken: no Step 1.</strong> Your first step has order #{minOrder} — the pipeline requires order #1 to exist.
            Use the ▼ button to move a step down or delete and re-add your steps so they start at 1.
            Without Step 1, every call to generate captions will fail with a 502 error.
          </span>
        </div>
      )}

      {/* Pipeline tip */}
      <div className="mb-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <span>
          <strong>How the pipeline works:</strong> Steps run in order. Each step&apos;s output is stored as{" "}
          <code className="bg-blue-100 dark:bg-blue-800/40 px-1 rounded font-mono">{"${stepNOutput}"}</code> and
          can be referenced in later steps&apos; prompts.{" "}
          <strong>Step 1 must use <code className="bg-blue-100 dark:bg-blue-800/40 px-1 rounded font-mono">Image Description</code></strong>{" "}
          — it produces the base context for all downstream steps. Selecting a step type auto-fills sensible defaults.
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {sortedSteps.length === 0 && (
          <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No steps yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Add your first step below. Start with <strong>Image Description</strong>.</p>
          </div>
        )}

        {sortedSteps.map((step, idx) => {
          const stepTypeSlug = step.humor_flavor_step_type_id ? (stepTypeMap[step.humor_flavor_step_type_id] ?? "") : "";
          const meta = STEP_TYPE_META[stepTypeSlug];

          return (
            <div
              key={step.id}
              className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden ${
                editingId === step.id
                  ? "border-blue-300 dark:border-blue-700"
                  : step.order_by === 1
                  ? "border-indigo-200 dark:border-indigo-800"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {editingId === step.id ? (
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Edit Step {step.order_by}
                  </h3>
                  <StepForm
                    flavorId={flavorId}
                    orderBy={step.order_by}
                    step={step}
                    {...sharedFormProps}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${
                    step.order_by === 1
                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                        step.order_by === 1
                          ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      }`}>
                        {step.order_by}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {step.description ?? (meta?.label ?? <span className="italic text-gray-400">No description</span>)}
                        </span>
                        {meta && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-mono">{stepTypeSlug}</span>
                        )}
                        {step.order_by === 1 && (
                          <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                            anchor
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorder(step, "up")}
                        disabled={isPending || idx === 0}
                        title="Move up"
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                      >▲</button>
                      <button
                        onClick={() => handleReorder(step, "down")}
                        disabled={isPending || idx === sortedSteps.length - 1}
                        title="Move down"
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                      >▼</button>
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

                  {/* Config summary */}
                  <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Step Type</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono">
                        {meta?.label ?? stepTypeSlug ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Model</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {step.llm_model_id ? (modelMap[step.llm_model_id] ?? `ID ${step.llm_model_id}`) : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Input → Output</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {step.llm_input_type_id ? (inputTypeMap[step.llm_input_type_id] ?? "—") : "—"}
                        {" → "}
                        {step.llm_output_type_id ? (outputTypeMap[step.llm_output_type_id] ?? "—") : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Temperature</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {step.llm_temperature != null ? step.llm_temperature : "0.7 (default)"}
                      </span>
                    </div>
                    {step.llm_system_prompt && (
                      <div className="col-span-2 sm:col-span-4">
                        <div className="text-gray-400 dark:text-gray-500 mb-1">System Prompt</div>
                        <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs overflow-auto max-h-20">
                          {step.llm_system_prompt}
                        </pre>
                      </div>
                    )}
                    {step.llm_user_prompt && (
                      <div className="col-span-2 sm:col-span-4">
                        <div className="text-gray-400 dark:text-gray-500 mb-1">User Prompt</div>
                        <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs overflow-auto max-h-20">
                          {step.llm_user_prompt}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add step */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full flex items-center gap-2 px-5 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg leading-none">{showCreate ? "−" : "+"}</span>
          <span>
            Add Step {maxOrder + 1}
            {maxOrder === 0 && <span className="ml-2 text-xs text-gray-400 font-normal">— start with Image Description</span>}
          </span>
        </button>

        {showCreate && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
            <StepForm
              flavorId={flavorId}
              orderBy={maxOrder + 1}
              {...sharedFormProps}
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isPending={isPending}
              submitLabel={`Add Step ${maxOrder + 1}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
