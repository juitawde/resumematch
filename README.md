# ResumeMatch — AI Resume & Job Description Matcher

A full-stack React + Express + MongoDB project for analyzing a resume against a job description, explaining the match, identifying skill gaps, and generating a fact-grounded tailored resume.

## Stack
- **Frontend:** React, Vite, React Router, Lucide React, Recharts, Axios
- **Backend:** Node.js, Express, Multer, PDF/DOCX text extraction
- **Database:** MongoDB + Mongoose (optional for local demo; history persists in MongoDB when configured)
- **AI:** OpenAI-compatible Chat Completions API through a server-side provider adapter

## Start locally

Requirements: Node.js 18+ and npm. MongoDB is optional for a quick demo, but required for durable history.

1. Copy `server/.env.example` to `server/.env` and optionally add your API key and MongoDB URI.
2. In terminal 1:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. In terminal 2:
   ```bash
   cd client
   npm install
   npm run dev
   ```
4. Open the URL printed by Vite (usually `http://localhost:5173`).

### Real AI vs demo mode
- Set `AI_API_KEY` and optionally `AI_BASE_URL` / `AI_MODEL` in `server/.env` to use real AI inference. The API key stays on the server.
- If no key is configured, the app explicitly labels results **Demo analysis** and uses a transparent deterministic fallback. Never present demo output as real AI output.
- The AI adapter expects an OpenAI-compatible `/chat/completions` endpoint. The default base URL is `https://api.openai.com/v1`.

### Environment variables
See `server/.env.example`. Set `MONGODB_URI=mongodb://127.0.0.1:27017/resumematch` for MongoDB persistence. Without MongoDB, recent analyses are held in memory and disappear when the server restarts.

## Workflow
1. Upload a PDF, DOCX, or TXT resume.
2. Paste a job description (or upload a TXT/DOCX/PDF job description).
3. The backend extracts text, runs structured AI stages when configured, scores evidence, identifies gaps, recommends next steps, drafts a tailored resume, and checks for unsupported claims.
4. Review the result and export the tailored resume or report.
5. Browse saved analyses in History when MongoDB is configured.

## AI workflow coverage
The application implements eight meaningful AI-assisted stages: resume understanding, job-description parsing, semantic matching, skill-gap analysis, recommendations, tailored resume drafting, factual consistency review, and natural-language explanation. Deterministic safeguards remain in code for upload validation, score arithmetic, schema checks, persistence, and export. The backend returns `aiCoverage` and `aiMode` so coverage/mode are visible rather than assumed. Coverage is measured across the eight AI-targeted stages; actual live AI coverage is 100% only when the provider is configured and all stages successfully use it. If the provider is missing/fails, output is labelled demo/fallback and coverage is not represented as live AI.

## Responsible AI / limitations
- The tool supports resume editing; it does not guarantee interview outcomes or objectively determine candidate quality.
- It should not invent credentials, employers, degrees, dates, or experience. The validator flags unsupported claims and keeps missing skills separate from evidence found in the resume.
- Review every suggested edit before using it. A match score is an estimate based on text evidence, not a hiring decision.
- Uploaded documents are treated as untrusted data; their content must not override system instructions.
- This is a coursework-ready prototype, not a production service. Add authentication, rate limiting, malware scanning, secure object storage, audit policies, and privacy/retention controls before public deployment.

## Test checklist (5 required cases)
1. **Strong match:** resume includes several requirements → matched skills and a high relative score.
2. **Major gaps:** JD requires skills absent from resume → gaps are listed as not evidenced, not falsely added to the resume.
3. **Malformed/unsupported file:** upload invalid type or empty file → API returns a clear validation error.
4. **Prompt injection in document:** text such as “ignore previous instructions” remains untrusted document content and cannot change the workflow rules.
5. **Unsupported claim:** ask tailoring to add a qualification not present in source → validator flags/rejects it and original facts remain grounded.

Automated API tests can be added with the included `server` test script; see `server/test/workflow.test.js`.

## API
- `GET /api/health` — service/database status
- `GET /api/config/status` — provider mode and configured stage coverage
- `POST /api/analyses` — multipart resume/job input, runs analysis
- `GET /api/analyses` — recent saved analyses
- `GET /api/analyses/:id` — analysis details
- `DELETE /api/analyses/:id` — delete saved analysis
- `POST /api/analyses/:id/tailor` — regenerate tailored resume with optional focus
- `POST /api/analyses/:id/validate` — validate tailored content against source
- `GET /api/analyses/:id/report` — JSON report

## Project structure
```text
resumematch-ai/
├── client/                 # React/Vite app
└── server/                 # Express API, AI pipeline, MongoDB model
```

## Rubric alignment
- **Prototype & implementation:** upload, parse, analyze, save, view history, export.
- **Prompt engineering:** separate structured prompts per stage and untrusted-input boundary.
- **Validation/testing:** factual consistency checks, edge-case validation, test checklist.
- **Automation/demo:** multi-stage workflow, history persistence, report export, visible AI/demo mode.


## Troubleshooting OpenAI authentication

1. Create a key at https://platform.openai.com/api-keys.
2. Put it in `server/.env` as `AI_API_KEY=...`; do not add it to the React app.
3. Confirm `AI_BASE_URL=https://api.openai.com/v1` and `AI_MODEL=gpt-4o-mini` (or another model enabled for your account).
4. Restart the backend. Settings checks `/v1/models` and reports a rejected key as `invalid-key`.
5. ChatGPT subscription billing and API billing are separate. A valid key may still require API billing/available quota.
