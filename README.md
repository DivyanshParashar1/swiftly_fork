# Swiftly

Swiftly is an AI-assisted resume management and job-application autofill platform.

It consists of three deployable parts:

1. `web` - a Next.js application for authentication, resume upload, editing, and dashboard workflows.
2. `backend` - an Express + Prisma API that handles auth, session cookies, resume parsing, persistence, and AI mapping endpoints.
3. `extension` - a WXT-based browser extension (Chrome/Firefox) that reads saved resumes and autofills external job forms.

The platform solves a practical workflow:

1. User signs in on the web app.
2. User uploads a resume (PDF, DOCX, or TEX).
3. Backend parses the file and converts it into structured JSON using Gemini.
4. Data is stored in PostgreSQL using Prisma models.
5. User can review and edit the structured resume in the dashboard.
6. Browser extension loads user session + selected resume and sends form context to backend.
7. Backend AI mapping returns field-value mapping.
8. Extension fills the target job application form.

## Table of Contents

- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [How the System Works End to End](#how-the-system-works-end-to-end)
- [Backend Deep Dive](#backend-deep-dive)
- [Web App Deep Dive](#web-app-deep-dive)
- [Extension Deep Dive](#extension-deep-dive)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Security and Auth Notes](#security-and-auth-notes)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Current Limitations and Next Improvements](#current-limitations-and-next-improvements)

## System Architecture

Swiftly is a cookie-authenticated client-server architecture with an extension client.

### High-level components

1. Browser (Web App)
	- Runs user account flows and resume CRUD UI.
	- Talks to backend over REST with `withCredentials` enabled.
2. Browser Extension
	- Runs sidepanel UI + content script on job sites.
	- Reuses authentication state via browser cookies.
	- Requests backend AI mapping for target page fields.
3. Backend API
	- Issues and refreshes JWT-backed session cookies.
	- Stores users, auth accounts, sessions, and resume data.
	- Parses resumes and transforms content via LLM services.
4. PostgreSQL + Prisma
	- Source of truth for user identities and structured resume entities.

### Runtime request boundaries

1. `web -> backend` for auth, resume upload, fetch, update, delete.
2. `extension sidepanel -> backend` for profile/session + resume fetch.
3. `extension content -> extension background -> backend` for autofill mapping.

## Repository Structure

```text
swiftly/
  backend/      Express API + Prisma schema/migrations + AI services
  web/          Next.js application (landing + auth + dashboard + edit flows)
  extension/    WXT browser extension (background, sidepanel, content script)
```

### Backend structure summary

- `src/index.ts` - server bootstrap, middleware, route mounting.
- `src/routes/*` - route registration by domain (`auth`, `resume`, `update`, `fetch`, `extension`).
- `src/controllers/*` - request orchestration.
- `src/services/*` - business logic, DB operations, AI integration.
- `src/middlewares/*` - auth middleware, multer upload middleware.
- `prisma/schema.prisma` - normalized relational data model.
- `prisma/migrations/*` - database migration history.

### Web structure summary

- `app/signin`, `app/signup` - authentication pages.
- `app/upload-resume` - file upload + parse trigger.
- `app/dashboard` - resume list and management.
- `app/dashboard/resume/[id]` - detailed resume editing.
- `lib/api.ts` - typed API client + refresh interceptor.
- `lib/authSession.ts` - local browser profile session helpers.

### Extension structure summary

- `entrypoints/background.ts` - runtime message bridge + sidepanel behavior.
- `entrypoints/sidepanel/App.tsx` - extension UI, session resolution, selected resume, autofill trigger.
- `entrypoints/content.ts` - DOM field extraction + fill execution.
- `lib/api.ts` - extension-side backend integration.
- `utils/makeHTMLElementObjForLLM.ts` - structured field metadata extraction.
- `utils/autofill.ts` - robust field assignment logic for input/select/checkbox/radio/textarea.

## Tech Stack

### Backend

- Runtime: Bun (dev script uses `bun --watch`).
- Language: TypeScript (ESM).
- HTTP layer: Express 5.
- Database: PostgreSQL.
- ORM: Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`).
- Auth: JWT + httpOnly cookies + DB-backed refresh sessions.
- File ingestion: Multer, `file-type`, `pdf-parse`, `mammoth`.
- AI providers: Google Gemini (`@google/genai`) and Groq (`groq-sdk`).

### Web

- Framework: Next.js 16 (App Router).
- UI: React 19.
- Styling: Tailwind CSS 4.
- Data/API client: Axios with refresh-token retry interceptor.
- Auth UX: Google OAuth button + credential auth forms.
- Notifications: `notistack`.

### Browser Extension

- Framework: WXT + React.
- Target browsers: Chrome MV3 and Firefox builds.
- APIs: `chrome.runtime`, `chrome.tabs`, `chrome.scripting`, `chrome.cookies`, `chrome.storage`, sidepanel.
- Autofill strategy: semantic DOM extraction + AI mapping + event-driven value injection.

## How the System Works End to End

### 1. Sign up / sign in

1. User submits credentials or Google OAuth code from web app.
2. Backend validates identity and creates/fetches user + auth account relation.
3. Backend issues:
	- `accessToken` cookie (short-lived).
	- `refreshToken` cookie (DB-backed session entry).
4. Web app persists lightweight profile data for fast client-side UI rendering.

### 2. Resume upload and parsing

1. Authenticated user uploads file via `multipart/form-data`.
2. Backend validates file type (`pdf`, `docx`, `tex`).
3. Backend extracts text:
	- PDF via `pdf-parse`.
	- DOCX via `mammoth`.
	- TEX via custom cleaner.
4. Extracted text is sent to Gemini parsing prompt to produce schema-compatible JSON.
5. Backend stores resume root + related arrays (education, experience, projects, skills, achievements, POR, publications) in PostgreSQL.
6. Temporary upload file is removed.

### 3. Resume dashboard and editing

1. Web dashboard calls protected fetch endpoints.
2. On 401, Axios interceptor attempts `/api/v1/auth/refresh` once and retries original request.
3. Resume detail page edits individual sections via update endpoints.
4. Changes are written directly to relational tables.

### 4. Extension autofill flow

1. Sidepanel checks auth/session state by probing protected resume endpoints.
2. User selects resume in sidepanel.
3. Sidepanel sends `AUTOFILL_FORM` message to active tab content script.
4. Content script scans form elements and builds semantic field objects (`label`, `placeholder`, `name`, DOM context metadata).
5. Content script requests backend mapping endpoint `/api/v1/extension/getAutofillData` with:
	- selected resume JSON
	- page field object array
6. Backend Gemini mapping service returns JSON key-value mapping.
7. Content script applies values to elements and dispatches `input`/`change` events for framework compatibility.

## Backend Deep Dive

### Routes mounted

- `/api/v1/auth`
- `/api/v1/resume`
- `/api/v1/update`
- `/api/v1/fetch`
- `/api/v1/extension`

### Core responsibilities

1. Identity and account linking
	- Supports both credentials and Google provider per user.
	- Can attach additional provider auth to existing email account.
2. Session lifecycle
	- Refresh token is hashed before storing in `Session` table.
	- Session lookup verifies hash match.
	- Refresh rotates token and session row.
3. Resume parsing pipeline
	- Accept file -> extract text -> LLM transform -> persist normalized entities.
4. Extension AI mapping
	- Prompt-driven key mapping from resume JSON to arbitrary form field descriptors.

## Web App Deep Dive

### Main user journeys

1. Landing -> signup/signin.
2. Authenticated users reach dashboard.
3. Upload resume and parse.
4. Open specific resume and update section data.
5. Delete resumes when needed.

### API strategy

- Single typed client in `web/lib/api.ts`.
- `withCredentials: true` enables cookie-auth across domains/origins.
- Response interceptor retries once after refresh on protected-route 401.

### Session and profile UX

- Profile snapshot is cached client-side (`localStorage`) for fast navbar/dashboard rendering.
- True auth status still depends on protected backend requests.

## Extension Deep Dive

### Why a sidepanel architecture

1. Persistent user interaction surface while browsing job portals.
2. Cleaner UX than popup for multi-step operations (choose resume, inspect detail, trigger autofill).

### Runtime responsibilities

1. `background` entrypoint
	- relays login/logout window messages to extension UI listeners.
	- configures sidepanel behavior.
2. `sidepanel` entrypoint
	- resolves session status.
	- fetches user resumes.
	- loads selected resume detail.
	- triggers active tab autofill command.
3. `content` entrypoint
	- captures form fields from current webpage.
	- requests AI mapping through extension->backend path.
	- writes values into live DOM safely.

### Permissions used

- `storage`, `activeTab`, `scripting`, `tabs`, `sidePanel`, `cookies`, `<all_urls>`.

These are required for reading auth cookies, injecting content script when needed, and filling fields on third-party job application pages.

## API Reference

### Auth

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/signin`
- `GET /api/v1/auth/google/callback?code=...`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout` (protected)
- `GET /api/v1/auth/userProfile` (protected)

### Resume ingest

- `POST /api/v1/resume/uploadAndParse` (protected, multipart field: `resume`)

### Resume fetch

- `GET /api/v1/fetch/fetchResumeForUser` (protected)
- `GET /api/v1/fetch/fetchResumeById/:resumeId` (protected)
- `DELETE /api/v1/fetch/deleteResumeById/:resumeId` (protected)

### Resume update

- `POST /api/v1/update/updateResume`
- `POST /api/v1/update/updateEducation`
- `POST /api/v1/update/updateExperience`
- `POST /api/v1/update/updateProjects`
- `POST /api/v1/update/updateSkills`
- `POST /api/v1/update/updateAchievements`
- `POST /api/v1/update/updatePor`
- `POST /api/v1/update/updatePublications`

All update routes are protected.

### Extension mapping

- `POST /api/v1/extension/getAutofillData` (protected)

## Data Model

The Prisma schema is normalized around `User` and `Resume`.

### Main entities

1. `User`
	- email identity, profile metadata, relations to auth accounts, resumes, sessions.
2. `AuthAccount`
	- provider-specific auth record (`credentials`, `google`) per user.
3. `Session`
	- hashed refresh token storage with expiry and optional device/ip metadata.
4. `Resume`
	- top-level profile information and one-to-many relations for resume sections.
5. `Education`, `Experience`, `Projects`, `Skills`, `Achievements`, `Por`, `Publications`
	- structured resume sections with `resumeId` foreign keys and cascade behavior.

### Notable types

- `Experience.type` uses enum `ExperienceType`.
- `Projects.techStack` is a string array.

## Local Development Setup

Prerequisites:

1. Bun (for backend runtime and scripts).
2. Node.js 20+ (recommended for web/extension tooling).
3. PostgreSQL instance.
4. Google OAuth client (for Google sign-in).
5. Gemini API key (required for resume parse and autofill mapping).

### 1. Clone and enter project

```bash
git clone https://github.com/nakshjoshi/swiftly
cd swiftly
```

### 2. Configure backend

```bash
cd backend
bun install
```

Create `.env` in `backend/` with required keys (see Environment Variables section).

Generate Prisma client and run migrations:

```bash
bunx prisma generate
bunx prisma migrate dev
```

Start backend:

```bash
bun run dev
```

Backend runs on `http://localhost:3001` by default.

### 3. Configure web app

```bash
cd ../web
npm install
```

Create `web/.env`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_google_client_id>
```

Start web app:

```bash
npm run dev
```

Web runs on `http://localhost:3000` by default.

### 4. Configure extension

```bash
cd ../extension
npm install
```

Start extension dev build:

```bash
npm run dev
```

Load unpacked extension in browser:

1. Chrome: open `chrome://extensions`, enable Developer Mode, load unpacked from generated dev output.
2. Firefox: run `npm run dev:firefox` or `npm run build:firefox` depending on workflow.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `PORT` | No | API port (defaults to `3001`). |
| `ACCESS_TOKEN_SECRET` | Yes | JWT signing secret for access token. |
| `ACCESS_TOKEN_EXPIRY` | Yes | Access token expiry (format expected by JWT library). |
| `REFRESH_TOKEN_SECRET` | Yes | JWT signing secret for refresh token. |
| `REFRESH_TOKEN_EXPIRY` | Yes | Refresh token expiry. |
| `GOOGLE_CLIENT_ID` | Yes (if Google auth enabled) | OAuth client id used by backend token verification. |
| `GOOGLE_CLIENT_SECRET` | Yes (if Google auth enabled) | OAuth client secret. |
| `GEMINI_API_KEY` | Yes | Gemini calls for resume parse and form mapping. |
| `GROQ_API_KEY` | Optional | Alternate LLM provider support. |

### Web (`web/.env`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL consumed by web client. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes (if Google auth enabled) | Google OAuth client for web sign-in UI. |

### Extension

Current extension API/web URLs are production constants in source. For local-only extension development, update those constants in extension API/session files or add a small env-based resolver.

## Security and Auth Notes

1. Access + refresh token cookies are used for auth.
2. Protected routes validate access token in middleware.
3. Refresh endpoint verifies refresh token hash against DB sessions.
4. Refresh rotation invalidates previous session token entry.
5. Web API client auto-refreshes once for non-auth endpoints on 401.

Important local development caveat:

- Cookie options differ between sign-in and refresh code paths. For cross-site cookie auth to work consistently in production and localhost, keep `secure`, `sameSite`, and domain settings environment-aware and aligned.

## Deployment Notes

### Backend

1. Set all secrets and DB URL in deployment environment.
2. Run Prisma migrations during deployment.
3. Ensure CORS origin list includes deployed web app domain.
4. Configure cookie policy per environment (localhost vs production domain).

### Web

1. Set `NEXT_PUBLIC_API_URL` to deployed backend URL.
2. Set valid Google OAuth client id.
3. Verify cookie-based auth over HTTPS and production domain setup.

### Extension

1. Build with `npm run build` (or Firefox variant).
2. Verify manifest permissions and target API/web URLs.
3. Publish packaged zip if required (`npm run zip`).

## Troubleshooting

### 401 loops on web requests

Check:

1. Backend CORS `origin` and `credentials` values.
2. Browser cookie flags (`secure`, `sameSite`, domain).
3. Correct API base URL in web env.

### Upload parse fails

Check:

1. File extension/type is one of `pdf`, `docx`, `tex`.
2. `GEMINI_API_KEY` is valid.
3. Resume text extraction did not return empty content.

### Extension does not autofill

Check:

1. You are on a normal webpage (not browser internal pages).
2. Content script is connected to active tab.
3. Selected resume is loaded in sidepanel.
4. Backend extension endpoint is reachable and authenticated.

## Current Limitations and Next Improvements

1. Extension API base URLs are currently static production constants.
2. Backend health endpoint response is placeholder text and can be standardized.
3. Add dedicated environment templates for all required backend keys.
4. Add unified workspace scripts for running all three apps together.
5. Add automated tests for auth refresh, resume parse pipeline, and extension mapping contract.

---

If you are onboarding a new developer, start with `Local Development Setup`, then read `How the System Works End to End` before diving into module-level files.
