# latex-service

A standalone, dumb microservice that compiles `.tex` files to PDF using `pdflatex`.

## What it does

**One endpoint, one job:** accepts a LaTeX source string, runs `pdflatex`, returns the PDF.

```
POST /compile
Body:  { "tex": "<full LaTeX source>" }
Returns: application/pdf  |  { error, details } on failure
```

```
GET /health
Returns: { "status": "ok", "service": "latex-service" }
```

## Running locally (requires Docker)

```bash
# From repo root
docker compose up --build
```

Service runs on `http://localhost:4000`.

## Running in production

Build and push the Docker image, then run on any container host (Railway, Fly.io, ECS, etc.):

```bash
docker build -t latex-service ./latex-service
docker run -p 4000:4000 latex-service
```

## Environment

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Port to listen on |

## Architecture notes

- This service knows nothing about templates, resume data, or Handlebars — it only compiles whatever `.tex` it receives.
- The main backend is responsible for fetching the template, injecting data, and sending the rendered `.tex` here.
- `pdflatex` is run **twice** per job (standard practice to resolve cross-references).
- Each job runs in an isolated temp directory that is cleaned up after compilation.
- Compilation timeout: **60 seconds**.
