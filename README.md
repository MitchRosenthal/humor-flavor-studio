# Humor Flavor Studio

A web interface for building and testing multi-step LLM workflows that generate image captions.

## What it does

- Create and edit humor flavors: ordered chains of prompts with model and temperature settings.
- Configure step inputs and outputs and reference earlier step results.
- Upload an image using a signed URL and run a selected flavor through the shared caption-generation API.
- Inspect execution logs and generated captions.
- Block test runs for flavors without configured steps.

## Architecture and project scope

The application uses Next.js, TypeScript, Tailwind CSS, and Supabase. Supabase provides authentication and access to the shared project database. The test runner requests a signed upload URL, uploads image bytes directly to S3, registers the image, and requests captions from the shared pipeline API.

This repository implements the workflow editor, application data access, and testing interface. The caption-generation API and shared database infrastructure are provided by the broader class project.

## Access

Source code is public. The hosted app requires Google sign-in and access to its backing services; it is not an anonymous demo. Viewing the code does not require an account.

## Key implementation files

- `src/app/dashboard/flavors/[id]/StepsManager.tsx`: workflow-step editor.
- `src/app/dashboard/flavors/[id]/actions.ts`: create, update, delete, and reorder steps.
- `src/app/dashboard/test/TestRunner.tsx`: image-upload and caption-test flow with execution logs.
- `src/lib/supabase/`: browser and server database clients.

## Local development prerequisites

Running the app requires the environment variables described in `.env.example`, an authorized Supabase environment with the expected schema, and access to the compatible caption-generation API. A fresh clone alone does not provision these dependencies.

## Start the development server

With Node.js and npm installed:

```bash
npm install
cp .env.example .env.local
# Set the Supabase URL and anonymous key for an authorized project.
npm run dev
```

Open http://localhost:3000. The shared schema, Google OAuth configuration, database permissions, and caption API access must also be available. Installing dependencies alone does not provision those services.
