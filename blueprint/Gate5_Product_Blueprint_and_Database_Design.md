# LipiScript — Gate 5: Product Blueprint, Database Design & Security Architecture

**Document Status:** Gate 5 Design Blueprint  
**Verification Date:** November 6, 2026  
**Evaluator & Architect:** Senior SaaS Solution Architect & Indic AI/OCR Engineering Team  
**Gate 4 Status:** APPROVED ✅  
**Gate 5 Status:** REVIEW READY & PENDING USER SIGN-OFF  
**Application Code Generation:** LOCKED (Authorized upon Gate 5 approval for Gate 6)  

---

## Approval Gate Tracker

| Gate | Milestone | Status | Key Deliverables |
|---|---|---|---|
| **Gate 1** | **Phase 0 document review** | **APPROVED ✅** | Product scope, 4 language groups, zero-hallucination guardrail ratified. |
| **Gate 2** | **Sample & benchmark preparation** | **APPROVED ✅** | 30 notebook pages, 10 reference transcripts, metrics suite verified. |
| **Gate 3** | **Live OCR benchmark execution** | **APPROVED ✅** | Candidate models benchmarked on Indic metrics; safety lock verified. |
| **Gate 4** | **Feasibility report & candidate decision** | **APPROVED ✅** | Selected **Gemini 3.8 Flash** ($1.20/1k) + **Chromium HarfBuzz Vector PDF**. |
| **Gate 5** | **Product blueprint & database design** | **REVIEW READY (Current Gate)** | User-scoped Firestore schema, security rules, UI/UX flows, and API blueprint. |
| **Gate 6** | **Milestone-by-milestone development** | **LOCKED** | Full application implementation across 4 agile sprints. |
| **Gate 7** | **Final QA, security & deployment** | **LOCKED** | Production verification, multi-device testing, and release. |

---

## 1. Architectural Invariant: Strict User-Level Data Isolation

Per Section 2 of the approved LipiScript product requirements:
> Every user's notes and projects must remain private. Users can access only their own projects. No shared workspaces. No team access to personal notes. Institutions must not be able to inspect individual users' private note contents. Strict user-level data isolation is mandatory.

### Isolation Architecture Rules

1. **Subcollection Partitioning:**  
   Every data entity related to a user's notes is physically located under the user's root document:
   ```
   /users/{userId}/projects/{projectId}/...
   ```
   No top-level global `/projects` or `/notes` collections are permitted in the database design.

2. **Security Rules Enforcement:**  
   Firestore security rules will enforce `request.auth != null && request.auth.uid == userId` for all read, write, update, and delete requests. Any query attempting to read another user's project will fail at the database engine level.

3. **Institutional & School Separation:**  
   In B2B/institutional deployments (e.g. schools, colleges, coaching institutes), the institution receives an administrative dashboard containing **only aggregated license and billing metrics**:
   - `totalLicensedSeats`
   - `activeSeatsCount`
   - `totalPageAllowance`
   - `consumedPagesThisCycle`  
   Institutional administrators have **zero permissions** to read student project titles, view uploaded handwriting scans, read transcribed text, or download compiled e-books.

---

## 2. Firestore Database Schema Specification

All timestamps are stored as ISO-8601 strings or Firestore Timestamps. All text fields are strictly normalized to **Unicode NFC** before saving.

```
                    ┌─────────────────────────┐
                    │     users/{userId}      │
                    └────────────┬────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
        ┌──────────▼──────────┐     ┌──────────▼──────────┐
        │ projects/{projectId}│     │  usageLog/{logId}   │
        └──────────┬──────────┘     └─────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌─────────────────┐
│ pages/{pageId}  │ │chapters/{chapId}│ │exports/{exportId}│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2.1 User Profile & Quota Document
**Path:** `/users/{userId}`

```typescript
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
  
  // Subscription & Plan Economics
  planTier: 'free_trial' | 'student' | 'professional' | 'institutional';
  status: 'active' | 'suspended' | 'cancelled';
  monthlyPageLimit: number; // e.g. 15 (trial), 150 (student), 600 (pro), 3000 (inst)
  pagesProcessedThisCycle: number;
  cycleResetDate: string; // ISO 8601
  
  // User Preferences
  defaultLanguage: 'Marathi' | 'Hindi' | 'English' | 'Mixed';
  theme: 'light' | 'dark' | 'system';
}
```

### 2.2 Project Document
**Path:** `/users/{userId}/projects/{projectId}`

```typescript
export interface ProjectDocument {
  id: string;
  userId: string;
  title: string;
  description: string;
  primaryLanguage: 'Marathi' | 'Hindi' | 'English' | 'Mixed';
  
  // Metrics & Aggregates
  pageCount: number;
  chapterCount: number;
  totalWordCount: number;
  illegibleWordCount: number;
  
  // Lifecycle Status
  status: 'draft' | 'processing' | 'reviewed' | 'exported';
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Page / Scan Document
**Path:** `/users/{userId}/projects/{projectId}/pages/{pageId}`

```typescript
export interface PageDocument {
  id: string;
  projectId: string;
  userId: string;
  pageNumber: number;
  
  // Image Storage
  sourceImageUri: string; // Secure Cloud Storage URL or data URI
  thumbnailUri?: string;
  imageMimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  imageDimensions?: { width: number; height: number };
  
  // OCR Transcription
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrEngineUsed: 'gemini-3.8-flash' | 'gemini-4-argon';
  ocrRawText: string; // Unedited transcript directly from model
  reviewedText: string; // User-reviewed editable text
  
  // Linguistic & Quality Diagnostics
  confidenceScore: number; // 0.0 - 1.0
  detectedLanguage: 'Marathi' | 'Hindi' | 'English' | 'Mixed';
  illegibleTokens: Array<{
    id: string;
    spanIndex: number;
    surroundingContext: string;
  }>;
  hasFormulas: boolean;
  hasTables: boolean;
  hasDiagrams: boolean;
  
  // Timestamps & Assignment
  assignedChapterId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Chapter Document
**Path:** `/users/{userId}/projects/{projectId}/chapters/{chapterId}`

```typescript
export interface ChapterDocument {
  id: string;
  projectId: string;
  userId: string;
  order: number; // 1, 2, 3... for ordering in Table of Contents
  
  title: string;
  level: 1 | 2 | 3; // H1 (Chapter), H2 (Section), H3 (Subsection)
  
  // Content Composition
  assignedPageIds: string[]; // Ordered list of page IDs in this chapter
  contentMarkdown: string; // The unified chapter text
  wordCount: number;
  
  createdAt: string;
  updatedAt: string;
}
```

### 2.5 Export / E-Book Document
**Path:** `/users/{userId}/projects/{projectId}/exports/{exportId}`

```typescript
export interface ExportDocument {
  id: string;
  projectId: string;
  userId: string;
  format: 'vector_pdf' | 'docx';
  
  // Formatting Configuration
  title: string;
  authorName: string;
  fontFamily: 'Noto Sans Devanagari' | 'Noto Serif Devanagari' | 'Inter';
  fontSizePt: 10 | 11 | 12;
  lineSpacing: 1.15 | 1.5 | 2.0;
  
  // E-book Layout Features
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  pageNumberPosition: 'bottom_center' | 'bottom_right' | 'top_right';
  pageSize: 'A4' | 'Letter';
  
  // Build Status & Download
  buildStatus: 'queued' | 'rendering' | 'ready' | 'failed';
  downloadUrl?: string;
  fileSizeBytes?: number;
  generatedAt?: string;
  errorMessage?: string;
}
```

---

## 3. Firestore Security Rules Specification

This configuration provides security and privacy, guaranteeing that no unauthorized read or cross-user leak is possible.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Deny all access by default
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Helper function: Authenticated check
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    
    // Helper function: Strictly verify user identity
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User Profile & Isolation Root
    match /users/{userId} {
      // User can read and edit only their own profile
      allow read, update: if isOwner(userId);
      allow create: if isOwner(userId);
      allow delete: if false; // Deletion requires account closure RPC
      
      // Projects Subcollection
      match /projects/{projectId} {
        allow read, write: if isOwner(userId);
        
        // Pages Subcollection
        match /pages/{pageId} {
          allow read, write: if isOwner(userId);
        }
        
        // Chapters Subcollection
        match /chapters/{chapterId} {
          allow read, write: if isOwner(userId);
        }
        
        // Exports Subcollection
        match /exports/{exportId} {
          allow read, write: if isOwner(userId);
        }
      }
      
      // Usage Log Subcollection
      match /usageLog/{logId} {
        allow read: if isOwner(userId);
        allow write: if false; // Server-side admin only
      }
    }
  }
}
```

---

## 4. End-to-End System Workflow & UI/UX Wireframes

### Workflow Overview

```
1. Upload & Ingest  -->  2. OCR Engine  -->  3. Dual-Pane Editor  -->  4. Chapter Organizer  -->  5. E-Book Export
   - Photos / Scans      - Gemini 3.8 Flash   - Image on Left         - Drag & Drop Tree         - Vector PDF
   - Multi-page PDF      - Frozen Prompt      - Text on Right         - Headings (#, ##)         - OpenXML DOCX
   - Camera Capture      - Zero Auto-Correct  - [illegible] tags      - Table of Contents        - Noto Devanagari
```

### Flow 1: Upload & Ingestion Studio
- **Dropzone:** Drag and drop batches of images (`.jpg`, `.png`, `.webp`) or scanned handwritten PDFs.
- **Auto-Splitter:** Uploaded multi-page PDFs are automatically sliced into distinct page items.
- **Camera Integration:** Direct mobile/desktop webcam capture with live alignment guidelines and instant perspective cropping.
- **Fair-Use Queue:** Displays real-time quota remaining (e.g., "12 of 150 pages used this month").

### Flow 2: Live OCR Processing Engine
- **Engine:** Server-side proxy calls `gemini-3.8-flash` with the approved frozen fidelity prompt.
- **Visual Progress:** Per-page processing badges (`Pending` $\rightarrow$ `Extracting Text` $\rightarrow$ `Ready for Review`).
- **Zero Hallucination Guarantee:** Misspellings in student handwriting are preserved as-is. Cut-off or unreadable words become interactive `[illegible]` chips.

### Flow 3: Dual-Pane Review & Text Editor
- **Left Pane:** Zoomable, pan-enabled viewer for the original handwritten notebook page scan.
- **Right Pane:** Full-featured rich text editor initialized with the recognized text:
  - Markdown headings (`#`, `##`, `###`)
  - Bullet points and numbered lists
  - LaTeX mathematical equations ($\int f(x) dx$)
  - Markdown tables
  - **Illegible Highlighter:** All `[illegible]` tags appear with an amber pill highlighting the unreadable region, allowing the user to inspect the scan and type the correct word or leave it flagged.

### Flow 4: Chapter & Outline Organizer
- **Interactive Outline Tree:** Drag-and-drop hierarchy manager to structure disparate notebook pages into cohesive chapters.
- **Multi-Page Merging:** Combine 3 lecture note pages into "Chapter 1: Fluid Dynamics".
- **Heading Levels:** Set chapter levels (H1, H2, H3) for automatic nesting in the Table of Contents.

### Flow 5: Professional Vector E-Book / PDF Generator
- **Theme Selection:** Clean Academic, Modern Serif, or Technical Handbook styling.
- **Cover Page Customizer:** Book title, author name, institution/course name, and optional notebook scan thumbnail.
- **Table of Contents Engine:** Automatically compiled with accurate roman numeral and arabic page numbering.
- **Vector PDF Output:** Rendered via Chromium HarfBuzz with selectable, copyable Unicode NFC text.
- **Word Document Output:** Downloadable `.docx` formatted with `Noto Sans Devanagari` complex script tags.

---

## 5. API Route Specification (Server Architecture)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/user/profile` | Fetches active user quota and plan status | Yes |
| `GET` | `/api/projects` | Lists user's private projects | Yes |
| `POST` | `/api/projects` | Creates a new notebook project | Yes |
| `GET` | `/api/projects/:id` | Fetches project details, pages, and chapters | Yes |
| `POST` | `/api/projects/:id/upload-pages` | Uploads batch of images or PDF | Yes |
| `POST` | `/api/projects/:id/process-ocr` | Triggers Gemini 3.8 Flash OCR on pending pages | Yes |
| `PUT` | `/api/pages/:id/review` | Saves human-reviewed transcription text | Yes |
| `PUT` | `/api/projects/:id/reorder-chapters` | Updates chapter order and hierarchy | Yes |
| `POST` | `/api/projects/:id/generate-ebook` | Renders Vector PDF (Chromium HarfBuzz) or DOCX | Yes |
| `GET` | `/api/exports/:id/download` | Secure streaming of final PDF / DOCX file | Yes |

---

## 6. Gate 6 Agile Implementation Roadmap (Sprint Plan)

Upon Gate 5 sign-off by the user, Gate 6 development will proceed across four structured sprints:

1. **Sprint 1 — Core Ingestion & Storage Foundation:**
   - User authentication state and private project workspace.
   - Batch image upload, camera capture, and PDF page splitter.
   - Firestore database integration with strict security rules.

2. **Sprint 2 — Gemini 3.8 Flash Indic OCR Engine:**
   - Production multimodal pipeline with frozen prompt.
   - Queue manager with quota monitoring.
   - Streaming progress indicators.

3. **Sprint 3 — Dual-Pane Editor & Chapter Organizer:**
   - Side-by-side synchronized zoom & pan scan viewer.
   - Markdown editor with `[illegible]` ambiguity chips.
   - Drag-and-drop chapter hierarchy and outline builder.

4. **Sprint 4 — Vector PDF & DOCX E-Book Engine:**
   - Chromium HarfBuzz HTML-to-PDF vector renderer.
   - Automatic Table of Contents and page numbering.
   - OpenXML DOCX export generator.

---

## 7. Gate 5 Review & Sign-Off Recommendation

This blueprint fulfills every requirement specified in the LipiScript Master Project Brief:
- **True digital vector text** (no scans as final body).
- **Zero auto-correct / zero hallucination** strict transcription fidelity.
- **Four equal language categories** (Marathi, Hindi, English, Mixed).
- **Strict per-user data isolation** with zero cross-user leaks.
- **Economically viable SaaS model** (>88% gross margins).

**Recommendation:** Sign off on **Gate 5** to unlock **Gate 6 (Milestone-by-Milestone Development)**.
