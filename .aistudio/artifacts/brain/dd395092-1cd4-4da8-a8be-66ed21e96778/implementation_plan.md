# LipiScript: Final Corrected Phase 0 Feasibility, Indic Handwriting Benchmark & System Architecture Plan

**Document Status:** Gate 1 Review Document  
**Research Verification Date:** November 3, 2026  
**Approval Status:** GATE 1 PENDING USER APPROVAL  
**Live OCR Experiments:** NOT AUTHORIZED  
**Application Code Generation:** NOT AUTHORIZED  
**Production OCR Provider:** NOT SELECTED

---

# Approval Gate Tracker

| Gate | Milestone | Status |
|---|---|---|
| **Gate 1** | **Phase 0 document review** | **Pending user approval** |
| Gate 2 | Sample and benchmark preparation | Locked |
| Gate 3 | OCR benchmark execution | Locked |
| Gate 4 | Feasibility report and candidate decision | Locked |
| Gate 5 | Product blueprint and database design | Locked |
| Gate 6 | Milestone-by-milestone development | Locked |
| Gate 7 | Final QA, security and deployment | Locked |

**Gate dependencies:**
- Gate 2 requires 30 handwritten image pages and 10 manually prepared transcripts for 10 of those same pages.
- Gate 3 requires Gate 2 preparation, test credentials where applicable, and explicit user authorization.
- Gate 4 requires actual benchmark evidence.
- Gate 5 requires Gate 4 approval.
- Gate 6 requires Gate 5 approval.
- Gate 7 requires implementation and testing completion.

*Rule: No gate is automatically approved by completing the previous gate.*

---

# 1. Executive Summary and Product Alignment

LipiScript is an individual-user SaaS platform that converts handwritten notes in Marathi, Hindi, English and mixed languages into editable digital text and professionally formatted e-books.

The intended workflow:
1. Upload handwritten notes.
2. Recognize handwritten content.
3. Convert it into editable digital text.
4. Review and edit recognized text.
5. Organize content into chapters and headings.
6. Generate a professional PDF or DOCX document.

## Core principles

### 1.1 Real digital text
The final PDF must contain searchable, selectable digital text. It must not use entire original handwritten notebook pages as the final document body.

### 1.2 Strict transcription fidelity
The system must not silently:
- Correct spelling.
- Correct grammar.
- Change punctuation.
- Rewrite sentences.
- Summarize content.
- Translate content.
- Guess unclear words.
- Complete cut-off sentences.

Unrecognizable content must be marked `[illegible]` according to the transcription rules in Section 6.

### 1.3 Four equally important language categories
- Marathi.
- Hindi.
- English.
- Mixed-language handwriting, including Maranglish and Hinglish.

### 1.4 Privacy and data isolation
- Every user's notes remain private.
- Users can access only their own projects.
- No shared workspaces.
- No team access to private notes.
- No institutional admin access to individual note contents.

### 1.5 Neutral technical evaluation
No OCR provider, PDF engine, backend framework or database is preselected. All production choices must be based on verified requirements, testing and measured evidence.

---

# 2. Technical Feasibility Audit

## Gap 1: Devanagari complex text shaping

**Risk:** A PDF library accepting a TTF font does not automatically guarantee correct Devanagari rendering.

Devanagari requires shaping operations involving consonants, viramas, vowel signs, conjuncts and glyph reordering. For example, a vowel sign (*matra* `ि`) may appear visually before its base consonant even though its Unicode order differs.

**Roman Marathi explanation:**
> *"Marathi madhe pratyek akshar fakta ekmekanchya bajula thevun chalat nahi. Jodakshare, matra ani velanti yanchi yogya arrangement karavi lagte. Fakt font add kelyane sagla text barobar disel yachi guarantee nahi."*

**Feasibility approach:**
Evaluate:
- Headless Chromium.
- CSS-based print layout (`@page` rules and `@media print`).
- Chromium's text-shaping pipeline (HarfBuzz).
- Noto Sans Devanagari and Noto Serif Devanagari fonts.

Verify:
1. No broken matras or detached diacritics.
2. Correct conjunct rendering.
3. Correct text selection.
4. Ctrl+F search for Marathi and Hindi words.
5. Copy/paste into a plain text editor.
6. Unicode normalization consistency.

*Do not declare Chromium the final PDF engine until the test passes.*

## Gap 2: Printed OCR versus handwritten Indic text

Printed text recognition does not prove accurate cursive handwriting recognition.

Unconstrained handwriting may include:
- Broken shirorekhas.
- Irregular spacing.
- Slanted characters.
- Inconsistent pen pressure.
- Overlapping characters.
- Unusual abbreviations.

**Roman Marathi explanation:**
> *"Printed Marathi pustak vachane ani handwritten notebook vachane vegle aahe. Model la Marathi language support asla tari to handwritten Marathi changla vachnarach asa nahi."*

**Feasibility approach:**
Compare the currently eligible candidates in Section 3. Do not assign an accuracy percentage before testing.

## Gap 3: Hallucination and unsupported guessing

Generative models may infer a plausible word when handwriting is unclear. This behavior is unacceptable for LipiScript.

**Feasibility approach:**
- Freeze a strict transcription prompt.
- Mark unclear content as `[illegible]`.
- Record unsupported guesses.
- Test cut-off words and ambiguous handwriting.
- Do not reward fluent but inaccurate transcription.

## Gap 4: Indic character scoring

Conventional CER and grapheme-cluster CER measure different units. A Unicode code point is not necessarily equivalent to a complete visually perceived Marathi akshara.

**Feasibility approach:**
Report both:
- Code-point CER.
- Extended Grapheme-Cluster CER (GC-CER).

Use a pinned Unicode segmentation version (UAX #29) and clearly document the method. Do not describe every extended grapheme cluster as exactly one Marathi akshara.

## Gap 5: Diagram handling

Automatic recreation of hand-drawn scientific diagrams can introduce incorrect connections, shapes or labels.

**Feasibility approach:**
The user chooses one of three project-level options:
1. Recreate the diagram digitally.
2. Retain only the original diagram crop.
3. Extract labels and text only.

*Never embed the entire original notebook page as the final document body.*

---

# 3. OCR Candidates and Verified Specifications

**Verification date:** November 3, 2026.

All candidates remain unselected. A model's language support, image input capability or document parsing benchmark must not be treated as proof of handwritten Marathi/Hindi accuracy.

## 3.1 Candidate comparison

| Candidate | Exact identifier | Modality and availability | Handwriting status |
|---|---|---|---|
| **Gemini 3.8 Flash** | `gemini-3.8-flash` | Stable; text, image, video, audio and PDF input; text output | Unverified |
| **Gemini 4 Argon** | `gemini-4-argon` | Stable; text, image, video, audio and PDF input; text output | Unverified |
| **Google Cloud Vision** | `DOCUMENT_TEXT_DETECTION` | Document/image OCR API; handwriting feature documented | Devanagari experimental |
| **OpenAI GPT-4o** | `gpt-4o` / `gpt-4o-2024-11-20` | Text and image input; deprecated, shutdown announced | Unverified |
| **OpenAI o1** | `o1` / `o1-2024-12-17` | Text and image modality documented historically; API model shut down | Not eligible for live testing |
| **PaddleOCR-VL-1.6** | `PaddleOCR-VL-1.6` | Open-source document parsing model; self-hostable | Indic cursive handwriting unverified |

---

## 3.2 Google Gemini 3.8 Flash

- **Model ID:** `gemini-3.8-flash`  
- **Availability:** Stable according to the official model documentation.  
- **Input:** Text, image, video, audio and PDF.  
- **Output:** Text.

Official model documentation:  
https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash

Official pricing:  
https://ai.google.dev/gemini-api/docs/pricing

### Standard paid-tier pricing

| Pricing period | Input / 1M tokens | Output / 1M tokens |
|---|---:|---:|
| Through December 31, 2026 | $0.75 | $3.75 |
| From January 1, 2027 | $1.50 | $7.50 |

Context-caching read input: $0.075 / 1M tokens (through Dec 2026); $0.15 / 1M (from Jan 2027).  
Batch / Flex tier: Input $0.375 / 1M ($0.75 in 2027), Output $1.875 / 1M ($3.75 in 2027).

**Free versus paid data handling:**
- Free-tier data may be used to improve Google products.
- Paid-tier prompts and responses are **not** used to improve Google's products.
- Paid-tier abuse-monitoring retention still applies (default retention up to **55 days** in developer-owned operational logs before deletion, unless zero-data-retention is configured via Vertex AI).
- Do not assume paid-tier usage automatically means zero data retention.

Official retention documentation:  
https://ai.google.dev/gemini-api/docs/zdr

**Handwriting accuracy:** Unverified. Must be measured.

---

## 3.3 Google Gemini 4 Argon

- **Model ID:** `gemini-4-argon`  
- **Availability:** Stable according to official documentation.  
- **Input:** Text, image, video, audio and PDF.  
- **Output:** Text.

Official model documentation:  
https://ai.google.dev/gemini-api/docs/models/gemini-4-argon

Official pricing:  
https://ai.google.dev/gemini-api/docs/pricing

### Standard paid-tier pricing

| Pricing period | Input / 1M tokens | Output / 1M tokens |
|---|---:|---:|
| Through November 30, 2026 | $2.00 | $10.00 |
| From December 1, 2026 | $4.00 | $20.00 |

Context-caching (implicit): $0.10 / 1M tokens (through Nov 2026); $0.20 / 1M (from Dec 2026).  
Gemini 4 Argon is not available on the free tier.

**Data handling:** Paid-tier prompts and responses are not used to improve Google's products. Abuse monitoring retention up to 55 days applies.

**Handwriting accuracy:** Unverified. Must be measured.

---

## 3.4 Google Cloud Vision

- **Feature:** `DOCUMENT_TEXT_DETECTION`

Official documentation:  
https://cloud.google.com/vision/docs/handwriting

Handwriting language support:  
https://cloud.google.com/vision/docs/languages

### Devanagari support
The official handwriting script table identifies Devanagari (`Deva`) as **Experimental**.  
This does not establish proven Marathi or Hindi cursive handwriting accuracy. Language support and handwriting accuracy must be treated separately.

### Standard pricing
Official pricing:  
https://cloud.google.com/vision/pricing

For Document Text Detection:
- First 1,000 units per month: Free.
- 1,001 to 5,000,000 units: $1.50 per 1,000 units ($0.0015 / page).
- Above 5,000,000 units: $0.60 per 1,000 units.

A page in a multi-page PDF is billed as an individual image unit. Actual account billing, currency and applicable discounts must be checked before testing.

### Data privacy and retention
Official documentation:  
https://cloud.google.com/vision/docs/data-usage

Google states:
- Images are not used to train or improve Cloud Vision features.
- For online immediate-response operations, image data is processed in memory and not persisted to disk.
- Asynchronous batch processing may temporarily store images; they are typically deleted after processing, with a failsafe TTL of a few hours.
- Some request metadata is temporarily logged for operations and security.

*Do not describe all Cloud Vision operations as having zero retention.*

**Handwriting accuracy:** Devanagari support is experimental; actual accuracy remains unverified.

---

## 3.5 OpenAI GPT-4o

- **Model ID:** `gpt-4o`  
- **Historical snapshot:** `gpt-4o-2024-11-20`

Official model documentation:  
https://developers.openai.com/api/docs/models/gpt-4o

### Availability & Deprecation Status
The official model documentation marks GPT-4o as deprecated.  
OpenAI's deprecation notice dated October 14, 2026, announces API removal on January 14, 2027 for:
- `gpt-4o-2024-08-06`
- `gpt-4o-2024-11-20`

Therefore:
- It may be considered only as a temporary exploratory benchmark candidate while API access remains available.
- It must not be selected as a long-term production provider without a migration plan.
- Live API access must be verified before any test.

Official deprecation documentation:  
https://developers.openai.com/api/docs/deprecations

### Published pricing

| Metric | Price per 1M tokens |
|---|---:|
| Input | $2.50 |
| Cached input | $1.25 |
| Output | $10.00 |

Image input is supported. Actual image cost depends on image tokenization (~170 tokens/tile + 85 base tokens).

### Data privacy
Official documentation:  
https://developers.openai.com/api/docs/guides/your-data

OpenAI states:
- API data is not used for model training by default unless the customer opts in.
- Abuse-monitoring logs may contain prompts and responses.
- Default abuse-monitoring retention is up to 30 days.
- Zero Data Retention is subject to organizational eligibility and explicit agreement.

*Do not equate no-training with zero retention.*

**Handwriting accuracy:** Unverified.

---

## 3.6 OpenAI o1

- **Historical model ID:** `o1`  
- **Historical snapshot:** `o1-2024-12-17`

Official documentation:  
https://developers.openai.com/api/docs/models/o1

### Availability
The official model page marks o1 as shut down.

Therefore:
- **Do not include o1 in live OCR experiments.**
- Do not request API credentials for this model.
- Retain its published historical information only for reference.
- Do not replace it with a different model without updating and approving this document.

### Historical published pricing
- Input: $15.00 / 1M tokens (Cached: $7.50 / 1M).
- Output: $60.00 / 1M tokens.

**Status:** Shut down; not eligible for the planned benchmark.

---

## 3.7 PaddleOCR-VL-1.6

- **Model identifier:** `PaddleOCR-VL-1.6`  
- **Model family:** PaddleOCR-VL  
- **Deployment option:** Self-hosted inference.

Official documentation:  
https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/algorithm/PaddleOCR-VL/PaddleOCR-VL.en.md

Official repository:  
https://github.com/PaddlePaddle/PaddleOCR

The official documentation lists Hindi and Marathi under Devanagari language coverage.

However:
- Language listing does not prove cursive handwriting accuracy.
- No LipiScript-specific handwritten Marathi/Hindi accuracy has been established.
- Handwriting performance must remain unverified until tested.

### Pricing and licensing
There is no fixed per-page hosted API price assumed in this plan for local self-hosted inference.  
Costs may include:
- GPU or CPU compute.
- Memory.
- Storage.
- Hosting infrastructure.
- Maintenance.

The PaddleOCR repository uses Apache License 2.0. Verify the exact model weights, dependencies and any additional components' licenses independently before commercial deployment.

### Data privacy
For a fully local self-hosted deployment, customer images need not be sent to an external OCR API.  
Verify network behavior, telemetry, logging, and storage before commercial operation.

**Handwriting accuracy:** Unverified.

---

# 4. Benchmark Dataset and Ground-Truth Methodology

## 4.1 Total dataset: 30 handwritten pages

There will be exactly 30 handwritten image pages.  
The 10 manually transcribed pages are selected from these same 30 pages.  
The 10 transcripts are reference files, not additional handwritten pages.

### Full dataset allocation

| Language category | Total pages | Gold pages | Qualitative-only pages |
|---|---:|---:|---:|
| **Marathi** | 8 | 3 | 5 |
| **Hindi** | 8 | 3 | 5 |
| **English** | 7 | 2 | 5 |
| **Mixed language** | 7 | 2 | 5 |
| **Total** | **30** | **10** | **20** |

This gives all four language categories nearly equal representation while preserving the 30-page limit.

---

## 4.2 Ten quantitative ground-truth pages

The user will manually transcribe exactly 10 of the 30 pages.

| Page | Language | Difficulty | Characteristics |
|---|---|---|---|
| GT-01 | Marathi | Easy | Clear handwriting |
| GT-02 | Marathi | Moderate | Lecture notes and conjuncts |
| GT-03 | Marathi | Difficult | Cursive writing and broken lines |
| GT-04 | Hindi | Easy | Clear script |
| GT-05 | Hindi | Moderate | Abbreviations and everyday notes |
| GT-06 | Hindi | Difficult | Broken shirorekha and cursive writing |
| GT-07 | English | Easy | Clear study notes |
| GT-08 | English | Moderate | Formulas and symbols |
| GT-09 | Mixed | Moderate | Maranglish / Hinglish |
| GT-10 | Mixed | Difficult | Mixed script, tables and figures |

**Benchmark limitation:** Ten scored pages provide exploratory evidence. They do not establish statistically conclusive accuracy for every language or handwriting population.

---

## 4.3 Remaining 20 qualitative pages

Use the remaining five pages per language category for qualitative assessment:
- Mathematical expressions and formulas.
- Tables.
- Diagram labels.
- Faint ink.
- Skewed images.
- Layout retention.
- Language switching.
- Unsupported guesses.
- `[illegible]` behavior.

These pages must not be included in quantitative CER/WER calculations unless ground truth is separately created and approved.

---

# 5. Evaluation Metrics and Reproducible Scoring

## 5.1 Unicode normalization

Before scoring:
1. Decode text as Unicode.
2. Normalize reference and hypothesis to NFC.
3. Apply the same documented whitespace normalization.
4. Preserve the original raw OCR response separately.
5. Record the Unicode library and version.

*Do not normalize away meaningful spelling or punctuation differences.*

---

## 5.2 Conventional code-point CER

Calculate Levenshtein edit distance over Unicode code points:

$$\text{CER} = \frac{S_{\text{code}} + D_{\text{code}} + I_{\text{code}}}{N_{\text{code}}}$$

Where $S, D, I$ are substitutions, deletions, and insertions of code points, and $N$ is the total number of reference code points. Report as a percentage.

---

## 5.3 Extended Grapheme-Cluster CER

Calculate edit distance over extended grapheme clusters using Unicode Standard Annex #29:

$$\text{GC-CER} = \frac{S_{\text{cluster}} + D_{\text{cluster}} + I_{\text{cluster}}}{N_{\text{cluster}}}$$

Pin the Unicode version used for segmentation.

**Important:** An extended grapheme cluster is a Unicode segmentation unit. It is **not** guaranteed to correspond exactly to one Marathi akshara or one linguistic syllable. Report code-point CER and GC-CER separately.

---

## 5.4 Word Error Rate (WER)

For reproducibility:
- Normalize to NFC.
- Normalize line breaks to whitespace.
- Split lexical content using Unicode-aware whitespace boundaries.
- Remove punctuation-only tokens from lexical WER.
- Preserve word spelling and order.
- Do not silently correct spelling.
- Do not translate.
- Do not normalize away meaningful characters.

$$\text{WER} = \frac{S_{\text{word}} + D_{\text{word}} + I_{\text{word}}}{N_{\text{word}}}$$

Report punctuation separately.

---

## 5.5 Punctuation Error Rate (PER)

Extract punctuation sequences using a documented Unicode punctuation-category rule. Compare reference and predicted punctuation sequences using edit distance.

Report:
- Missing punctuation.
- Extra punctuation.
- Incorrect punctuation.
- Punctuation Error Rate.

This prevents punctuation results from being hidden inside the lexical WER score.

---

## 5.6 Ambiguous and illegible regions

This is a mandatory annotation procedure.

Before running any OCR candidate:
1. The user or evaluator reviews the 10 ground-truth pages.
2. Every ambiguous visual region is marked on the original image.
3. Assign each region a unique ID, such as `GT03-R02`.
4. Record its page number and image coordinates.
5. Record the corresponding transcript position.
6. Mark the unreadable content as `[illegible]`.
7. Freeze these annotations before comparing OCR outputs.

### Partial unreadability
If part of a word is readable:
- Preserve the readable part.
- Mark only the unreadable portion if it can be isolated reliably (e.g. `महा[illegible]`).
- If the unreadable portion cannot be isolated confidently, mark the entire word `[illegible]`.
- Never complete the word using grammar or context.

### Scoring masked regions
For the primary readable-text CER, GC-CER and WER:
- Exclude the pre-annotated ambiguous visual regions.
- Apply the same region mask to every candidate.
- Do not let a candidate define its own excluded regions.
- Keep all excluded region IDs in the report.

For ambiguous regions, separately record:
- Correct `[illegible]` handling.
- Unsupported guessed text.
- Extra invented words.
- Incorrectly marking readable text as `[illegible]`.

If a model invents text inside a masked region, count it as an **unsupported guess** even though that region is excluded from the primary readable-text edit-distance calculation.

If a model marks a readable word as `[illegible]`, count it as a **recognition deletion/error**.

*Do not remove difficult reference words after seeing model outputs.*

---

## 5.7 Additional measurements

Record:
- Language preservation.
- Missing words.
- Unsupported guesses.
- Script changes.
- Character substitutions.
- Paragraph-order errors.
- Equation transcription correctness.
- Table structure correctness.
- Processing latency.
- Input and output tokens.
- Cost per page.
- Failure rate.

Report both averages and individual page-level results.

---

# 6. Frozen OCR Transcription Prompt

Freeze the following prompt before scored experiments. Do not change it during the benchmark without documenting the change and restarting the affected comparisons consistently.

## System instruction

You are a handwriting transcription engine specializing in Marathi, Hindi, English and mixed-language handwritten notes.

Your task is to transcribe only the content visibly present in the supplied image.

Your priority is transcription fidelity, not fluency.

### Strict rules

1. Preserve the author's original spelling.
2. Do not correct grammar.
3. Do not rewrite sentences.
4. Do not summarize.
5. Do not translate.
6. Do not complete cut-off sentences.
7. Do not infer missing content from context.
8. Do not invent words, symbols, labels or numbers.
9. Use `[illegible]` for unreadable content.
10. Preserve the language and script used by the author.

### Partially unreadable and cut-off words

- Preserve clearly visible characters or word portions.
- Use `[illegible]` for an unreadable portion only when it can be separated confidently (e.g. `महा[illegible]`).
- If the unreadable portion cannot be isolated, use `[illegible]` for the whole word.
- Never guess missing letters or words based on grammar or sentence context.

### Formulas and mathematics

- Transcribe mathematical expressions and chemical formulas in standard LaTeX.
- Enclose inline formulas in single dollar signs ($...$) and block equations in double dollar signs ($$...$$).
- Transcribe only visible symbols; do not complete equations or infer missing exponents.

### Tables

- Transcribe visible tables into standard Markdown table format (`| Header | Header |`).
- If a cell is empty or illegible, use `[illegible]` or leave it empty; do not fabricate values.

### Diagram labels

- If a visual diagram, sketch, or drawing is present, do not write a subjective description of the drawing.
- Transcribe all text labels, titles, figure numbers, annotations, and callouts visible inside or around the diagram under a markdown heading: `### Diagram Labels`.

### Structure and lists

- Preserve headings using Markdown `#` and `##`.
- Preserve bullet points using `-` and numbered lists using numerals (`1.`, `2.`).

---

# 7. Diagram Handling Policy

Diagram handling is a per-project user choice. The user must be able to choose one of these three approaches for a project:

1. **Recreate diagram digitally:** Reconstruct a digital diagram from the original where technically feasible (structured SVG or tables).
2. **Retain original diagram crop:** Retain only the selected original diagram region as an isolated high-resolution image crop embedded in-line with the digital text.
3. **Extract labels/text only:** Extract diagram labels and related visible text into notes without retaining the visual drawing.

**Rules:**
- Never embed the entire original handwritten page as the final document body.
- The final document must otherwise contain digital, editable text.
- If diagram reconstruction is unreliable, do not silently invent missing connections, labels, or shapes.
- Preserve the user's selected diagram policy for that project.

---

# 8. PDF and DOCX Feasibility Tests

## 8.1 PDF test
Potential approach: Chromium-based PDF rendering with appropriate Unicode fonts and shaping support.

*This is a candidate pipeline, not a confirmed solution.*

Required test cases:
- Marathi paragraphs.
- Hindi paragraphs.
- English paragraphs.
- Mixed-language paragraphs.
- Conjuncts and ligatures (*Jodakshare* like `क्ष`, `त्र`, `ष्ट्र`).
- Matras and reph.
- Bullets and numbered lists.
- Headings and chapter titles.
- Table of contents.
- Page numbering.
- Font embedding (*Noto Sans Devanagari*).
- Text selection.
- Search inside the PDF (Ctrl+F for Marathi words).
- Copy-paste into a plain text editor.
- Extracted Unicode text comparison.

**Acceptance:** The generated PDF must be visually correct and preserve usable digital text. Any failure must be documented.

## 8.2 DOCX test
Generate sample DOCX files with explicit complex-script tags (`w:rFonts w:cs="Noto Sans Devanagari"`) and test in:
- Microsoft Word (Windows/macOS).
- LibreOffice Writer (Linux/cross-platform).

Check the same script-shaping, formatting, font, and text-extraction requirements as the PDF test.

*DOCX feasibility is not confirmed until both applications have been tested.*

## 8.3 Formatting scope
Keep document formatting intentionally simple:
- Readable fonts and font sizes.
- Clear headings.
- Paragraphs and bullets.
- Automatic page numbers.
- Chapter-wise table of contents.
- One simple professional cover.

*Do not introduce a complex page-design editor or unnecessary visual customization.*

---

# 9. Provisional System Architecture

**Architecture status: PROVISIONAL — NOT APPROVED.**

No provider, backend framework, database, cloud-storage service, or hosting platform is locked in this phase. The architecture must be evaluated after the OCR benchmark and technical feasibility tests.

## 9.1 Provisional high-level system flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROVISIONAL HIGH-LEVEL SYSTEM FLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ CLIENT TIER (Provisional: React 19 + Tailwind CSS)                          │
│ • Multi-page ingestion (Drag-and-drop, PDF split, Camera capture)           │
│ • Page-wise transcription review editor (thumbnails + side-by-side text)    │
│ • Project management & document export controls                             │
│                                      ▲                                      │
│                                      │ Encrypted Session API                │
│                                      ▼                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ BACKEND SERVICES TIER (Provisional: Node.js/TS or Python FastAPI)           │
│ • Strict Per-User Authorization Middleware (Zero Cross-Account Access)      │
│ • Ingestion & Page Normalization Service                                    │
│ • Asynchronous Page-Wise OCR Dispatcher & Retry Handler                     │
│ • Document Generator (Tested Vector PDF & OpenXML DOCX engines)             │
│                                      ▲                                      │
│                                      │ Private Worker Pipe                  │
│                                      ▼                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ STORAGE & PERSISTENCE TIER (Provisional)                                    │
│ • User Account & Project Metadata Database                                  │
│ • Private Encrypted Storage: Raw page scans (deleted upon user request)     │
│ • Page-Wise OCR Transcript Store (raw extraction + user edits)              │
│ • Generated PDF and DOCX Artifact Store                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9.2 Privacy and data isolation
The following are mandatory product requirements:
- A user can access only their own projects and notes.
- A user cannot access another user's uploaded documents or generated output.
- No shared workspaces.
- No institutional access to an individual's private notes.
- No unnecessary administrator access to note contents.
- Storage must be private by default.
- File access must be authorized server-side.
- Temporary processing files must follow a defined deletion policy.
- Account and project deletion must be supported in the data lifecycle.

---

# 10. Seven-Day Phase 0 Execution Plan & Gate Alignment

The seven-day schedule begins only after the required samples, credentials, and approval are available.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       7-DAY PHASE 0 EXECUTION SCHEDULE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 1: Benchmark Framework & Evaluation Harness Setup (Internal Setup)      │
│ • Build standalone research utility scripts for Levenshtein CER, GC-CER,    │
│   and WER with Unicode NFC normalization.                                   │
│ • Implement the reference-masking logic for [illegible] spans.              │
│ • NOTE: These are standalone research scripts, NOT production code.         │
│ ➔ DEPENDENCY: None (Can be completed prior to sample submission).           │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 2: Ingestion of Samples & Ground-Truth Freezing (GATE 2 PREREQUISITE)   │
│ • Ingest the 30 handwritten image pages (8 Marathi, 8 Hindi, 7 En, 7 Mix).  │
│ • Ingest the 10 reference ground-truth transcripts.                         │
│ • Annotate ambiguous visual regions (e.g. GT03-R02) and freeze masks.       │
│ ➔ DEPENDENCY: REQUIRES RECEIPT OF 30 PAGES & 10 TRANSCRIPTS FROM USER.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 3: Candidate Verification & Test Credential Check                       │
│ • Verify active API access, model IDs, and rate limits for Gemini, OpenAI   │
│   (temporary exploratory check), and Cloud Vision using test tokens.        │
│ • Verify local environment dependencies for PaddleOCR-VL-1.6.               │
│ ➔ DEPENDENCY: USER-SUPPLIED API KEYS & TEST CREDENTIALS.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 4: Quantitative OCR Benchmark Run (REQUIRES EXPLICIT GATE 3 APPROVAL)   │
│ • Execute candidate OCR engines against the 10 scored pages.                │
│ • Log latency (seconds/page) and API token payloads.                       │
│ • Compute CER, GC-CER, and WER across all candidates.                       │
│ ➔ DEPENDENCY: EXPLICIT GATE 3 USER APPROVAL BEFORE RUNNING LIVE CALLS.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 5: Qualitative Content & Error Analysis                                 │
│ • Inspect the remaining 20 pages across all candidates:                     │
│   - Mathematical equation extraction (LaTeX syntax validity).               │
│   - Table layout parsing (Markdown table structure).                        │
│   - Diagram label extraction and diagram crop quality.                      │
│   - Count hallucinations, language drift, and [illegible] adherence.        │
│ ➔ DEPENDENCY: Execution relies on Day 2 sample pages.                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 6: PDF & DOCX Shaping Feasibility Test & Preliminary Cost Modeling      │
│ • Run Chromium vector print pipeline test with Noto Sans Devanagari.        │
│ • Run DOCX generation test across MS Word and LibreOffice Writer.           │
│ • Test text selection, Ctrl+F search, and clipboard copy-paste integrity.   │
│ • Calculate exact API cost per page; model for 100, 250, and 500 users.     │
│ ➔ DEPENDENCY: None (Uses standardized Devanagari test strings).             │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 7: Final OCR Feasibility Report & Presentation (GATE 4 SUBMISSION)      │
│ • Synthesize all measured data into the formal OCR Bake-off Report.         │
│ • Present candidate comparison matrix and objective recommendation.         │
│ • Present Gate 4 report and await explicit approval before Gate 5.          │
│ ➔ DEPENDENCY: User review and approval.                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 11. Benchmark Reporting Template

The final report must include the following for every candidate:

| Field | Result |
|---|---|
| Provider | |
| Exact model/service ID | |
| Model version or release | |
| Test date | |
| API availability | |
| Language support evidence | |
| Marathi scored results | |
| Hindi scored results | |
| English scored results | |
| Mixed-language scored results | |
| Code-point CER | |
| Grapheme CER (GC-CER) | |
| Lexical WER | |
| Punctuation Error Rate | |
| Hallucination / Unsupported Guess Count | |
| `[illegible]` behavior & masking logs | |
| Average processing time (latency) | |
| Estimated cost per page | |
| Privacy and retention review | |
| Technical limitations | |

---

# 12. Official Research References

Verified as of **November 3, 2026**:

### Google
- Gemini model catalogue: https://ai.google.dev/gemini-api/docs/models
- Gemini 3.8 Flash: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- Gemini 4 Argon: https://ai.google.dev/gemini-api/docs/models/gemini-4-argon
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini data retention & ZDR: https://ai.google.dev/gemini-api/docs/zdr
- Cloud Vision handwriting support: https://cloud.google.com/vision/docs/handwriting
- Cloud Vision language support: https://cloud.google.com/vision/docs/languages
- Cloud Vision pricing: https://cloud.google.com/vision/pricing
- Cloud Vision data usage: https://cloud.google.com/vision/docs/data-usage

### OpenAI
- Model catalogue: https://developers.openai.com/api/docs/models
- Deprecations notice: https://developers.openai.com/api/docs/deprecations
- API pricing: https://platform.openai.com/pricing
- API data controls & privacy: https://developers.openai.com/api/docs/guides/your-data
- Business data privacy: https://openai.com/business-data/

### PaddleOCR
- Official repository: https://github.com/PaddlePaddle/PaddleOCR
- PaddleOCR-VL documentation: https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/algorithm/PaddleOCR-VL/PaddleOCR-VL.en.md

### Unicode
- Unicode Standard Annex #29 — Text Segmentation: https://unicode.org/reports/tr29/
- Unicode Normalization Forms (UAX #15): https://unicode.org/reports/tr15/

---

# 13. Final Phase 0 Decision & Approval Status

**Current Status:** Gate 1 Review Document.  
- **Production OCR Provider:** NOT SELECTED.  
- **System Architecture:** PROVISIONAL.  
- **Live OCR Experiments:** NOT AUTHORIZED.  
- **Application Code:** NOT AUTHORIZED (0 lines written).

The next action is to obtain your explicit review and approval of **Gate 1**. Only then may Gate 2 preparation begin. Live experiments still require their own explicit authorization at Gate 3.
