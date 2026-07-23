# Ask the Image

A client-facing visual-analysis demo built with Next.js and Gemini. Upload a
JPEG, PNG, or WebP image to receive structured findings, an optional answer to
a focused question, explicit uncertainty, and safety notes.

## What it demonstrates

- Ephemeral, server-only multimodal analysis with `@google/genai`
- MIME, byte-size, image-signature, dimension, and schema validation
- Structured results instead of unbounded model text
- Accessible upload, progress, error, retry, and responsive result states
- Request IDs and redacted operational logs
- Vercel Preview and Production deployments with WAF rate limiting

Images are decoded and normalized in memory. They are not written to disk,
uploaded to a persistent file service, or included in application logs.

## Local development

Use Node.js 24 and pnpm 11.17.0.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Set `GEMINI_API_KEY` in `.env.local`. The key must be restricted to the Gemini
API and must never use a `NEXT_PUBLIC_` prefix.

The optional variables are:

```dotenv
GEMINI_MODEL=gemini-3.6-flash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests mock Gemini responses. A single controlled live-provider check is
performed during Vercel Preview QA.

## API

`POST /api/analyze-image` accepts `multipart/form-data`:

- `image`: required JPEG, PNG, or WebP; maximum 4 MB and 16 megapixels
- `question`: optional text; maximum 500 characters

Successful responses contain a request ID, summary, optional answer, detected
details with qualitative confidence, uncertainty, and safety notes. Errors use
a stable code, safe message, retryability flag, and request ID.

## Deployment

The production deployment is an isolated Vercel project. Configure these
variables for both Preview and Production:

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-3.6-flash`
- `NEXT_PUBLIC_SITE_URL` using the environment's public URL

Apply a Vercel WAF rate-limit rule to `/api/analyze-image`: five requests per
minute per IP. The route also has a 30-second function limit and a 25-second
provider timeout.

## Security history notice

On July 23, 2026, repository history was rewritten to remove a previously
tracked, invalid Google API key. Existing clones from before that rewrite must
be discarded and freshly cloned. Do not merge or push branches created from
the old history.
