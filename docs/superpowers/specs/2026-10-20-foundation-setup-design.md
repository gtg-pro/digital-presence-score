# Foundation Setup Design — Service Business Digital Presence Report Card

**Date:** 2026-10-20  
**Status:** Approved (Sections 1–2)  
**Scope:** Task 1 — project architecture, global styling, UI foundations, route structure, placeholder pages only  
**Out of scope:** Backend APIs, database, auth, OpenAI, crawling, scoring calculations, email delivery, full marketing/audit/report UI

---

## 1. Product context

Long-term, production-oriented frontend for **Service Business Digital Presence Report Card**. Current phase is frontend-only scaffolding so features can grow without reshaping the tree.

Existing bootstrap: Next.js 16.4 (App Router), React 19, TypeScript, Tailwind CSS 4 at repo root (`app/`). Task 1 migrates to the approved `src/` layout.

---

## 2. Approach

**Chosen: Approach 1 — Full migrate to `src/` + scaffold routes + UI kit**

| Approach | Decision |
|---|---|
| 1. Migrate `app/` → `src/app/`, feature folders, tokens, layout shell, primitives, placeholders | **Selected** |
| 2. Keep root `app/`, add `src/` only for features | Rejected — mixed roots hurt long-term imports |
| 3. Empty folder shells only | Rejected — too thin for reusable UI foundations |

---

## 3. Architecture

### 3.1 Principles

- Server Components by default; Client Components only when interactivity requires it.
- Thin route `page.tsx` files that compose feature components.
- Feature-based structure: shared UI vs feature-specific components, types, config, mock data.
- Interfaces shaped for future API integration; no fetch clients or business logic in visual components.
- Avoid unnecessary abstractions and dependencies.
- All placeholder report/admin content clearly labeled **Demo** — never presented as verified results.

### 3.2 Folder structure

```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx
│   ├── (audit)/
│   │   ├── audit/
│   │   │   └── page.tsx
│   │   └── report/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       └── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── landing/
│   │   └── components/
│   ├── audit/
│   │   ├── components/
│   │   ├── types/
│   │   └── data/
│   ├── report/
│   │   ├── components/
│   │   ├── types/
│   │   └── data/
│   └── admin/
│       ├── components/
│       ├── types/
│       └── data/
│
├── config/
│   ├── site.ts
│   └── navigation.ts
│
├── hooks/
├── lib/
├── types/
└── styles/

public/
├── images/
└── icons/
```

### 3.3 Path alias

- Configure TypeScript `paths`: `@/*` → `./src/*`
- Update any Next/config references as required after the migrate

### 3.4 Routes

| Route | Group | Purpose |
|---|---|---|
| `/` | `(marketing)` | Landing placeholder |
| `/audit` | `(audit)` | Non-submitting audit form shell |
| `/report/[id]` | `(audit)` | Demo-labeled report placeholder |
| `/admin` | `(admin)` | Demo-labeled admin placeholder |
| (root) `not-found` | — | Shared 404 |

Route groups may share one `PageShell` in Task 1; Navbar/Footer stay reusable with room for future layout variations.

---

## 4. Design system

### 4.1 Theme decisions

| Decision | Choice |
|---|---|
| Theme | Light-only black & white |
| Dark mode | No auto dark mode for v1 |
| Styling | Tailwind CSS + CSS variables |
| Typography | Display: **Newsreader**; Body: **Geist Sans** (via `next/font`). Not Inter/Roboto/Arial. |
| Icons | Lucide React only |
| Heavy UI framework | None |

### 4.2 Design tokens

Centralize in `src/app/globals.css` (and `src/styles/` as needed). Map tokens into Tailwind via `@theme`.

**Token categories:**

- Surfaces: `--background`, `--foreground`, `--muted`, `--muted-foreground`
- Borders / focus: `--border`, `--ring`
- Interactive: `--primary`, `--primary-foreground` (black/white invert)
- Radius and spacing exposed through Tailwind theme

**Rule:** Components consume semantic utilities (`bg-background`, `text-foreground`, `border-border`, etc.). No hardcoded hex/rgb in feature or UI components.

### 4.3 Accessibility & responsiveness

- Primitives support keyboard focus, visible focus rings (`--ring`), and sufficient contrast.
- Form controls associate labels correctly.
- Layouts work across mobile, tablet, and desktop.
- Avoid unnecessary animations.

---

## 5. UI foundations

### 5.1 Dependencies to add (Task 1)

- `lucide-react`
- `clsx`
- `tailwind-merge`

No Radix, shadcn, form libraries, chart libraries, or auth SDKs in Task 1.

### 5.2 `cn()` utility

`src/lib/cn.ts` — compose `clsx` + `tailwind-merge`.

### 5.3 UI primitives (`src/components/ui/`)

Hand-rolled, typed props:

| Component | Notes |
|---|---|
| `Button` | Variants: primary / secondary / ghost / outline; supports button or link usage |
| `Input` | Accessible text field |
| `Label` | Form labels |
| `Textarea` | Multi-line for audit shell |
| `Badge` | Status and “Demo” labels |
| `Card` | Only where interaction/grouping needs a container — not decorative hero cards |
| `Container` | Max-width + horizontal padding |
| `Separator` | Subtle horizontal rule |

### 5.4 Layout (`src/components/layout/`)

- `SiteHeader` — brand + primary nav from `config/navigation.ts`
- `SiteFooter` — links/copyright from `config/site.ts`
- `PageShell` — header + main + footer; reusable across pages

### 5.5 Shared (`src/components/shared/`)

- `DemoBanner` — clear demo-data callout for report/admin
- `PlaceholderPage` — optional thin helper if useful; prefer feature components where content differs

---

## 6. Config, types, and mock data (API-ready)

### 6.1 Config

- `config/site.ts` — product name, description, copyright
- `config/navigation.ts` — main nav items

### 6.2 Shared types (`src/types/`)

Stub interfaces only (examples; exact names may refine during implementation):

- `AuditRequest`
- `ReportSummary`
- `ScoreCategory`

No scoring algorithms, validators that call APIs, or persistence.

### 6.3 Feature data

- Centralize placeholders in feature `data/` files.
- Report/admin mocks include an explicit demo flag / messaging (e.g. `isDemo: true`).
- Never fabricate or imply verified audit results.

---

## 7. Page content scope (placeholders)

| Page | Content |
|---|---|
| `/` | Product name, one-line value prop, CTA to `/audit`, note that full landing comes later |
| `/audit` | Title, short copy, **non-submitting visual form shell** (fields look functional; submit does not call APIs or navigate as a real audit) |
| `/report/[id]` | `DemoBanner` + realistic placeholder report layout; show `id`; label scores/sections as Demo |
| `/admin` | `DemoBanner` + empty/demo table or list shell |
| `not-found` | Simple 404 with link home |

**Audit form rule:** Must look functional but must not trigger actual submissions or API requests (e.g. `onSubmit` preventDefault only, or button `type="button"` with no side effects beyond optional local UI state).

---

## 8. Explicit non-goals (Task 1)

- Complete landing marketing sections
- Working multi-step audit wizard
- Real report charts or scoring
- Admin CRUD
- Auth, email, crawling, OpenAI
- API routes or database
- Dark mode / theme toggle

---

## 9. Implementation sequence (for the plan phase)

1. Add dependencies (`lucide-react`, `clsx`, `tailwind-merge`).
2. Migrate to `src/app/` and fix `@/*` alias.
3. Establish tokens, fonts, `globals.css`.
4. Add `lib/cn`, config, shared types.
5. Build UI primitives + layout + shared DemoBanner.
6. Scaffold feature folders and placeholder feature components.
7. Wire thin route pages + `not-found`.
8. Verify build/lint; document structure briefly for the next task.

---

## 10. Success criteria

- App runs with routes `/`, `/audit`, `/report/[id]`, `/admin`, and a 404 page.
- Black-and-white light theme via CSS variables; no system dark mode override.
- Reusable header/footer and hand-rolled primitives in place.
- Demo labeling visible on report and admin.
- Audit form does not submit to any backend.
- Folder structure matches Section 3.2; pages stay thin and feature-based.
- No backend or scoring implementation present.
