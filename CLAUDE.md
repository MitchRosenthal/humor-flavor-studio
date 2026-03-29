# CLAUDE.md — Humor Flavor Studio

This file is the persistent context document for all Claude sessions working on this project. Update it whenever meaningful changes are made.

---

## Project Overview

- **App**: Humor Flavor Studio — Next.js 15 App Router, Supabase (PostgREST)
- **Purpose**: Let users create "humor flavors" (multi-step LLM prompt chains) that generate captions for images via the AlmostCrackd pipeline API
- **Mitchell's Vercel deploy**: `https://humor-flavor-studio.vercel.app`
- **Class/shared project repo**: `The-Humor-Project/pun-intended`
- **Mitchell's project repo**: `MitchRosenthal/humor-flavor-studio`

### Environments

| | Staging | Production |
|---|---|---|
| Supabase project ref | `qihsgnfjqmkjmoowyfbn` | `uckvaiyrgouakgptuuzex` |
| Supabase URL | `https://qihsgnfjqmkjmoowyfbn.supabase.co` | `https://secure.thehumorproject.org` |
| Pipeline API base | `https://api.almostcrackd.ai` | `https://api.crackd.ai` |
| Supabase dashboard | Accessible (org: "The Humor Project - Staging") | Different org, no dashboard access |

- **Mitchell's app** hardcodes `API_BASE = https://api.almostcrackd.ai` in `TestRunner.tsx`
- **All student projects share the same production DB** (`uckvaiyrgouakgptuuzex`)
- **Production anon key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVja3ZqaXlyZ291a2dwdHV1emV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjU4NTIsImV4cCI6MjA4NDI0MTg1Mn0.8wJun6VMPBNm_v0UHsho37uJLHQvy642gRLNMpepYKY`

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/app/dashboard/flavors/page.tsx` | Flavor list page |
| `src/app/dashboard/flavors/actions.ts` | createFlavor / updateFlavor / deleteFlavor |
| `src/app/dashboard/flavors/[id]/page.tsx` | Flavor editor — fetches 6 data sources in Promise.all |
| `src/app/dashboard/flavors/[id]/actions.ts` | createStep / updateStep / deleteStep / reorderStep |
| `src/app/dashboard/flavors/[id]/StepsManager.tsx` | Full UX for managing flavor steps (controlled component) |
| `src/app/dashboard/test/page.tsx` | Test runner page — fetches step counts per flavor |
| `src/app/dashboard/test/TestRunner.tsx` | Client component for running pipeline tests; API_BASE hardcoded here |

---

## Caption Pipeline API

Base URL: `https://api.almostcrackd.ai`

All API routes require: `Authorization: Bearer <supabase-jwt>`

### Step 1 — Generate Presigned Upload URL

POST /pipeline/generate-presigned-url
Body: { "contentType": "image/jpeg" }
Response: { "presignedUrl": "https://...", "cdnUrl": "https://presigned-url-uploads.almostcrackd.ai/<userId>/<file>.jpg" }

- presignedUrl: direct upload target (S3 signed URL)
- cdnUrl: public URL of the uploaded image (used in Step 3)

### Step 2 — Upload Image Bytes to presignedUrl

PUT <presignedUrl>  (direct to S3, NOT to api.almostcrackd.ai)
Content-Type must match what you sent in Step 1.

### Step 3 — Register Image URL in the Pipeline

POST /pipeline/upload-image-from-url
Body: { "imageUrl": "<cdnUrl from step 1>", "isCommonUse": false }
Response: { "imageId": "uuid", "now": 1738690000000 }

Save imageId for the caption step.

### Step 4 — Generate Captions

POST /pipeline/generate-captions
Body: { "imageId": "uuid" }   (humorFlavorId is optional — include to target a specific flavor)
Response: array of caption records

Supported image types: image/jpeg, image/jpg, image/png, image/webp, image/gif, image/heic

---

## Database Domain Model

**Official stance**: "All students have read-only access to Supabase." — however, the Matrix platform (and Mitchell's app) explicitly writes to humor_flavors and humor_flavor_steps via authenticated server actions. In practice, RLS grants write access to those two tables for authenticated users; everything else is read-only. The official docs mean: don't try to write to backend-owned tables (captions, images, llm_model_responses, etc.).

### Core Tables

**profiles** — 1-to-1 with auth.users. Key fields: id, name, email, is_enabled, is_superadmin. Nearly every user action references profiles.id.

**images** — Foundational input. Fields: id, url, profile_id, is_public, is_common_use, image_description (cached AI output), celebrity_recognition (cached), embeddings. Expensive AI attributes are cached here and reused across requests.

**captions** — Core output artifact. Links image + profile + humor_flavor_id + llm_prompt_chain_id + caption_request_id. Has is_public, is_featured, is_study_linked.

**caption_requests** — Entry point for all AI activity. One request -> multiple prompt chains -> multiple model responses -> multiple candidate captions.

**llm_prompt_chains** — Groups a sequence of LLM steps for a single caption_request.

**llm_model_responses** — Low-level execution log: system/user prompts, model used, provider, processing time, temperature, which humor_flavor_step_id produced it. Treat as trace/debug data.

### Humor Flavor Tables (writeable by students)

**humor_flavors** — Columns: id, slug, description, created_by_user_id, modified_by_user_id, created_datetime_utc, modified_datetime_utc.
- No profile_id column — join via created_by_user_id

**humor_flavor_steps** — Columns: id, humor_flavor_id, order_by, humor_flavor_step_type_id, llm_model_id, llm_input_type_id, llm_output_type_id, llm_temperature, llm_system_prompt, llm_user_prompt.
- All type ID columns are NOT NULL — must always be set on insert/update

**humor_flavor_step_types** — Slugs: image-description, celebrity-recognition, general

**llm_models** — Only query id, name (no slug column). Proven working IDs: 1,2,3,5,6,7,9,10,13,14,15,16,17,19. Broken IDs (crash with 502): 4,8,11,12,18,20.

**llm_input_types** — Slugs: image-and-text, text-only

**llm_output_types** — Slugs: string, array

---

## The Matrix

The Matrix is Crackd's internal platform for flavor experimentation and testing.

- **Develop flavors in staging, not production** (official recommendation)
- Access is restricted — request via #need-access in Slack
- Supports study image sets: curated image collections for controlled testing
- Testing runs asynchronously (multiple images process in parallel)
- Captions view exposes full prompt chain outputs including intermediate step responses, model used, temperature, and processing time

### Loaded Values (Cost Optimization)

image-description and celebrity-recognition step types are designed to reuse pre-computed results from Admin when available. If the same image was previously processed, these steps consume cached image_description / celebrity_recognition values from the images table rather than re-issuing LLM calls. If no cached value exists, the LLM call is made normally.

**Implication for debugging**: If you see unexpected behavior on image-description or celebrity-recognition steps, the pipeline may be using a cached result from a previous run rather than re-running your prompt. This is by design.

---

## Pipeline Rules (CRITICAL)

1. Step 1 MUST be image-description type with order_by = 1
2. Step 1's output is stored as ${step1Output} — all downstream steps must reference ${step1Output} in their user prompt
3. Step N's output -> ${stepNOutput} for step N+1 (e.g., ${step2Output})
4. Missing order_by=1 step -> 502 "No output found for step1Output"
5. Unsupported model ID -> 502 "Cannot read properties of undefined (reading 'specificationVersion')"

---

## StepsManager UX

Auto-fills input/output types and starter prompts on step type selection (STEP_TYPE_META):

| Step type | Input type | Output type | Notes |
|---|---|---|---|
| image-description | image-and-text | string | Always Step 1; describes the image |
| celebrity-recognition | image-and-text | string | Identifies people in image |
| general | text-only | array | References ${step1Output} |

- order_by is hidden — auto-assigned as maxOrder + 1
- Template variable insert buttons appear above User Prompt for available upstream outputs
- Red banner if no order_by=1 step exists
- Step 1 shown with indigo accent + "anchor" badge

---

## actions.ts Key Details

- llm_temperature defaults to 0.7 server-side if field is empty or blank
- createFlavor inserts only { slug, description } — created_by_user_id is auto-set by DB trigger/RLS
- Model dropdown filters to safe IDs only: .in("id", [1, 2, 3, 5, 6, 7, 9, 10, 13, 14, 15, 16, 17, 19])

---

## Test Runner

- API_BASE = "https://api.almostcrackd.ai" (hardcoded in TestRunner.tsx)
- Dropdown shows slug (N steps) — 0-step flavors are disabled
- Pre-flight guard blocks run if 0 steps
- Step 4 payload logged in cyan

---

## Known Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 502 specificationVersion | Unsupported LLM model ID | Filter models to proven 14 IDs; re-save any steps using bad models |
| 502 No output found for step1Output | Step 1 missing or wrong order_by | Ensure order_by=1 image-description step exists |
| 500 Humor flavor steps not found | Flavor has 0 steps in DB | Add steps via flavor editor |
| 502 presigned URL 405 | Wrong HTTP method | Use POST (not GET) for /pipeline/generate-presigned-url |
| null value in column llm_input_type_id | Input type not set | STEP_TYPE_META auto-fills; ensure step is saved |
| column profile_id does not exist | Wrong column name | Use created_by_user_id not profile_id |
| column slug does not exist on llm_models | No slug column | Query id, name only |
| _crypto_aead_det_decrypt SQL error | Supabase editor wraps encrypted columns | Avoid joining on encrypted cols in SQL editor; use Management API instead |

---

## Other Domain Tables (read-only reference)

These are read-only — written by backend services. Listed here for query context.

- caption_likes, caption_votes, caption_saved, shares — behavioral engagement logs
- reported_captions, reported_images — moderation
- communities, community_contexts, community_context_tags — situational awareness / insider cultural context
- study_caption_mappings, study_image_sets — research/study associations
- terms, term_types — Gen-Z vocabulary reference
- news_snippets, news_entities — real-world grounding
- personalities, transcripts — style and voice research
- allowed_signup_domains, invitations — access control

---

## Mitchell's Account

- Email: yankeedude6050@gmail.com
- Profile ID in staging DB: 33e5dd98-9071-4b07-9734-f1b62b2dd21f
- Mitchell has 0 flavors in staging — all his data is in the production DB (uckvaiyrgouakgptuuzex)
- Flavor 293 (dark-humor2) in staging: 0 steps, owned by a different user — always fails

### If His Flavors Still 502

Steps created before the model filter was deployed likely use a broken model ID. Quickest fix: delete existing steps and recreate from scratch using the current StepsManager (which now auto-fills everything and only shows safe models).

---

## Supabase Debugging Tips

**Staging DB (accessible)** — use Management API from Supabase dashboard browser console:

    const token = JSON.parse(localStorage.getItem('supabase.dashboard.auth.token')).access_token;
    fetch('https://api.supabase.com/v1/projects/qihsgnfjqmkjmoowyfbn/database/query', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'SELECT ...' })
    }).then(r => r.json()).then(d => { window.__r = d; });
    // then check: JSON.stringify(window.__r)

**Production DB (read-only via PostgREST, RLS applies)** — run from the app's domain (CORS blocks GitHub pages):

    fetch('https://secure.thehumorproject.org/rest/v1/humor_flavors?select=id,slug', {
      headers: {
        'apikey': '<anon key above>',
        'Authorization': 'Bearer <user jwt>'
      }
    })
