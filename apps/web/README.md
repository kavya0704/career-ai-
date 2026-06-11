# Resume Shapeshifter: JD-to-Resume Tailoring Engine

👉 **Live Demo:** [resume-shapeshifter-zeta.vercel.app](https://resume-shapeshifter-zeta.vercel.app)

Resume Shapeshifter is a powerful, production-grade Next.js application designed to analyze the alignment between a candidate's resume and a target job description. Using advanced AI-powered pipeline integration, the engine extracts key metadata, scores resume alignment across multiple dimensions, identifies structural gaps, and provides truthful, high-quality, and context-aware bullet rewrites with built-in hallucination guardrails.

---

## 🚀 Key Features

* **Advanced Matching & Alignment Scoring:** SVG gauges visualising overall match alongside five sub-scores (Skill Coverage, Responsibility Alignment, Keyword Presence, Seniority Fit).
* **Deep Gap Analysis:** Identifies discrepancies between the resume and target JD, categorizing priorities (High, Medium, Low) and supplying concrete, actionable remedies.
* **Truthful Bullet Rewriting:** Rewrites experience bullets to align with target role qualifications while strictly avoiding hallucinations (new dates, company names, fake certifications, or fabricated metrics).
* **Visual Confidence & Risk Labels:** Side-by-side comparison editor highlighting changes, displaying AI confidence labels (High/Medium/Low), and listing yellow warning risk flags for manual verification.
* **Polished PDF Export Engine:** Outputs PDF documents using headless server-side browser rendering, allowing exports of either side-by-side comparison proofs or clean, customized resumes ready for submission.
* **Stately Dark Mode & Smooth Transitions:** Elegant custom UI containing responsive glassmorphic cards, custom animations, and a floating custom toast notification provider.
* **Interactive Stepper & Demo Mode:** One-click demo functionality populated with sample resume and JD data for instantaneous testing.

---

## 🛠 Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React server components, static rendering, and integrated dynamic API routes |
| **Language** | TypeScript | Strong typing boundaries for compile-time safety and IDE checks |
| **Styling** | Tailwind CSS + Shadcn UI | Custom glassmorphic components, fluid transitions, and responsive grid layouts |
| **Validation** | Zod | End-to-end schema parsing and input sanity validation |
| **LLM Engine** | Groq Cloud SDK | Structured JSON chat completions (via `llama-3.3-70b-versatile`) |
| **PDF Generation** | Playwright (Chromium) | High-fidelity server-side HTML-to-PDF compiler |
| **Document Parsing** | `pdf-parse` + `mammoth` | Robust text extraction for PDF and Word DOCX formats |
| **Testing** | Vitest | Comprehensive suite checking schemas, PDF generation, and validators |

---

## 📁 Directory Structure

```
resume-shapeshifter/
├── src/
│   ├── app/                    # Next.js App Router folders
│   │   ├── api/                # API routes (parse-file, analyze, tailor, export)
│   │   ├── input/              # Pasting/uploading documents page
│   │   ├── analyze/            # Match scoring and gap accordion page
│   │   ├── editor/             # Side-by-side comparison proof page
│   │   ├── layout.tsx          # Root structure and Toast Provider wrapper
│   │   └── page.tsx            # Animated landing page
│   ├── components/             # React visual components (ScoreCard, GapAnalysis, Diff, etc.)
│   │   └── ui/                 # Atomic Shadcn components (button, card, dialog, etc.)
│   ├── lib/                    # Shared utilities, Context, and configurations
│   │   ├── __tests__/          # Vitest suite (schemas, validators, PDF)
│   │   ├── context.tsx         # Toast management and sessionStorage caching state
│   │   ├── groq.ts             # Groq SDK client wrapper and prompt retry wrapper
│   │   ├── pdf.ts              # Headless browser configuration
│   │   ├── pdf-template.ts     # HTML template layout compilers
│   │   └── validators.ts       # Truthfulness validations post-processor
│   └── prompts/                # Interpolated LLM prompt files
├── eslint.config.mjs           # ESLint configuration
├── package.json                # Project dependencies and deployment scripts
└── tsconfig.json               # TypeScript compiler config
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory and configure the following variables:

```bash
# Groq API Configuration
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 💻 Installation & Setup

### Prerequisites
* Node.js v18+
* NPM or Yarn

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/kavya0704/Resume-Shapeshifter-JD-to-Resume-Tailoring-Engine.git
   cd Resume-Shapeshifter-JD-to-Resume-Tailoring-Engine
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Install Headless Browser Dependencies (Playwright):**
   ```bash
   npx playwright install chromium --with-deps
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the application.

---

## 🧪 Testing

We use **Vitest** for testing schemas, parser outputs, and validators.

Run tests:
```bash
npx vitest run
```

---

## 📦 Production Build & Deployment

To compile the application for production:
```bash
npm run build
```

### Vercel Deployment
Next.js projects deploy seamlessly to Vercel. Connect your repository to Vercel, configure `GROQ_API_KEY` inside Vercel's Environment Variables, and the platform will automatically build and distribute the app globally.

> **Note on Playwright PDF Generation:** Vercel serverless environments have function size limitations. When deploying Playwright to Vercel, ensure you deploy inside a Region/runtime that supports serverless Chromium, or use an external PDF microservice/API if needed for large volumes.

---

## 🔮 Future Improvements

1. **AI Chat Editor:** Interactive inline chat allowing candidates to modify bullet rewrites via natural language instructions.
2. **Multi-resume Storage:** User account dashboard storing historical resumes, target job descriptions, and past comparison proofs.
3. **Automatic Keyword Matcher:** Interactive checklist highlighting matched/unmatched keywords in real-time as the user edits bullets.
