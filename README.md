# ClaimCheck — Evidence Integrity Workbench

**ClaimCheck** is an evidence integrity workbench that analyzes short reports (≤ 300 words) against supplied primary source documents (1–3 sources, ≤ 300 words each) using live server-side Gemini AI. It verifies whether claims are genuinely supported, contradicted, or overreaching, protecting decision-makers from semantic traps, population leaps, and hallucinated proof.

---

## Overview for Judges

### 1. What ClaimCheck Does
ClaimCheck automates rigorous evidence integrity audits by decomposing continuous report prose into atomic claims, segmenting primary sources into canonical passages, and testing whether the empirical evidence strictly justifies the stated assertions.

### 2. Who It Is For
- **Students & Academics**: Evaluating research paper summaries and literature reviews against original primary studies.
- **Researchers & Fact-Checkers**: Checking whether scientific claims distort study scope, sample populations, or methodology.
- **Analysts & Decision-Makers**: Auditing executive briefings, policy memos, and intelligence summaries before acting on overreaching recommendations.

### 3. How to Use It
1. **Paste Report**: Enter report text containing factual assertions (up to 300 words).
2. **Paste Sources**: Add 1 to 3 primary source documents (up to 300 words each).
3. **Analyze Claims**: Click **Analyze claims** to initiate live decomposition and passage verification.
4. **Review Verdicts**: Inspect the 3-column review workbench:
   - Check the **Claims List** for outcome badges (*Supported*, *Overreach detected*, *Contradicted*, *Needs review*, *Unsupported*).
   - Trace the interactive **Evidence Chain** ($\text{Claim} \rightarrow \text{Source Passage ID} \rightarrow \text{Reasoning Issue} \rightarrow \text{Review Action}$) with verbatim quoted source text.
   - Use Reviewer Actions: **Revise** (grounded suggestion), **Find Evidence** (gap guidance), **Inspect Source** (highlighted passage context), and **Review Manually** (human auditor override with session logging).
   - Alternatively, test competing claims in the interactive **Compare Two Claims** adversarial twin suite.

### 4. Honest Limitation
> **“ClaimCheck evaluates claims against supplied sources only; it does not verify universal truth.”**  
> If an inaccurate fact is asserted and the provided source also asserts that same inaccuracy, ClaimCheck will report that the claim is corroborated *by that source*. It tests document-evidence fidelity, not external ground truth.

---

## What Was Built During LovHack Season 3

1. **Live Evidence Integrity Engine (`src/evidenceEngine.ts` & `server.ts`)**:
   - **Atomic Claim Extraction**: Extracts discrete, falsifiable claims while strictly preserving quantifiers and population targets (e.g., *"all corporate personnel"*, *"permanently"*).
   - **Canonical Passage Segmentation**: Segments source documents into verifiable passage IDs (`S1-P1`, `S1-P2`).
   - **Verbatim Excerpt Retrieval**: Every quoted evidence passage is retrieved directly from the canonical source passage map—never synthesized or invented by the model.
   - **Semantic Stress Testing**: Detects metric mismatches, population leaps, causal overreach, temporal leaps, and magnitude inflation.
   - **Non-Overreach Invariant**: A claim with partial support, contradiction, or reasoning flaws can never be marked `Supported`.
   - **Unsupported by Supplied Sources**: When no passage substantiates a claim, the system clearly outputs:
     - Badge: `UNSUPPORTED BY SUPPLIED SOURCES`
     - Description: *"No passage in the supplied sources establishes this full claim."*
     - Displayed calmly as a valid analytical finding, visibly distinct from application errors.

2. **Interactive "Compare Two Claims" Tool (Live Adversarial Twin)**:
   - Interactive testing suite comparing two competing claims against the same source passage live.
   - Specifically built to catch semantic traps where lexical overlap or identical percentages mask a logical flaw (e.g., *40% student satisfaction* conflated with *40% academic performance improvement*).
   - Displays side-by-side verification cards and synthesizes the exact reasoning divergence.

3. **3-Column Editorial Review Dashboard**:
   - **Column 1 — Claims List**: Displays extracted claims with text outcome badges and session review indicators.
   - **Column 2 — Claim Detail**: Interactive visual pipeline flow, verbatim passage quote, reasoning issue, and empirical guidance.
   - **Column 3 — Document Audit Panel**: Document-level audit scorecard (Supported, Overreach, Contradicted, Needs review, Unsupported) and empirical evidence coverage percentage.

4. **Reviewer Action Workflows**:
   - **Revise**: Preserves the original claim and displays the grounded suggested revision in a separate editable field with one-click copy and apply.
   - **Find Evidence**: Outlines missing empirical proof and recommended research criteria.
   - **Inspect Source**: Full-document context modal that automatically scrolls to and highlights the exact cited passage.
   - **Review Manually**: Enables human auditor overrides, logs notes, and marks the claim with a persistent session badge.

5. **Hardened UI/UX States**:
   - **Workspace Readiness**: Initial load displays: *"Paste a report and at least one source to begin an evidence review."*
   - **Inline Accessible Form Validation**: Word counters, inline error messages with `aria-describedby` and `role="alert"`, and disabled submission until minimum valid input is provided.
   - **Multi-Stage Loading**: Progress indicator cycles through *"Extracting claims…"*, *"Segmenting source passages…"*, *"Matching evidence…"*, and *"Checking reasoning gaps…"* with `aria-live="polite"` screen-reader announcements.
   - **Slow Network & Timeout (> 8s)**: Prompts user that review is taking longer than expected; includes a `"Cancel"` action backed by `AbortController` and a `"Retry"` button.
   - **Offline Detection**: Real-time browser connection tracking via `navigator.onLine`. Displays an alert banner and disables submission until reconnected.
   - **Honest Error Handling**: If the API key is missing or unavailable, displays: *"Live AI analysis is unavailable right now. Check the server configuration or try again shortly."* Never leaks stack traces, secrets, or internal server errors to the browser.
   - **Accessibility & Responsive**: Baseline 16px body font size, `:focus-visible` outline rings, and tabbed single-column collapse on mobile viewports (375px).

---

## Tech Stack

- **Model**: `gemini-3.1-flash-lite` (via `@google/genai` TypeScript SDK)
- **Backend**: Node.js 22, Express, TypeScript (`server.ts`)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Build & Dev Tooling**: Vite 8, `tsx`
- **Deployment**: Google Cloud Run / Node.js container / Render

---

## How to Set GEMINI_API_KEY as a Server-Side Environment Variable

The application strictly executes AI inference server-side in `server.ts`. The API key is **never** bundled or exposed to client browsers.

### Local Setup
Create a `.env` file in the project root:
```bash
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3000
```

### Production Setup (Render / Cloud Run / Railway / Vercel)
1. In your hosting platform's dashboard, navigate to **Environment Variables** or **Secrets**.
2. Add a new variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `your_gemini_api_key_here`
3. Ensure the variable name is strictly `GEMINI_API_KEY` (do not add `VITE_` prefix, as `VITE_` exposes variables to client bundles).

---

## Local Development & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your GEMINI_API_KEY
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build and Run in Production Mode
```bash
npm run build
npm start
```

### 5. Run Typechecking & Lint
```bash
npm run lint
```

---

## Production Deployment Commands

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: Listens on `process.env.PORT` or `3000`.
- **Health Check**: `GET /api/health` returns:
  ```json
  {
    "status": "ok",
    "hasApiKey": true,
    "model": "gemini-3.1-flash-lite",
    "mode": "live"
  }
  ```
