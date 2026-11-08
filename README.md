# Humor Flavor Studio

An editor and test runner for multi-step LLM caption workflows. A "humor flavor" is a chain of prompt steps (each with its own model, input type and prompt) that turns an image into captions. This app lets you build and reorder those steps, run a flavor against an uploaded image, and inspect what each step produced. Built for Columbia's Humor Project course (spring 2026).

**Live app: [humor-flavor-studio.vercel.app](https://humor-flavor-studio.vercel.app)** (sign-in required)

## Features

- Create, edit, duplicate, search and delete flavors
- Step editor: add, reorder and configure prompt-chain steps, with guidance on how outputs feed into the next step and a model list filtered to models that actually work
- Test runner: uploads an image through the caption pipeline API (presigned upload, image registration, caption generation) and shows the generated captions and a step-by-step run log, with a pre-flight check that the flavor has steps
- Captions browser with accurate per-flavor counts
- Light and dark themes

## Tech

Next.js 15 (App Router, server actions), React, TypeScript, Tailwind CSS, Supabase (Postgres + Auth), deployed on Vercel.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev
```
