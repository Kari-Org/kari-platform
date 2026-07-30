# Kari — Agent context

> Front door for AI agents. Durable decisions live in `context/` (built by context-system).
> This file routes you there and states the rules that never bend.

## Authority
`context/foundation.md` is the top source of truth. When anything here or in the code
disagrees with it, **foundation wins**. Never re-decide a decision the foundation already
locked — cite it (`foundation.md §7 #N`) instead. Where a *doc* and the *code* disagree on an
implementation detail, the code embodies the decision (see foundation's preamble).

## Context files (read before you build)
- `context/foundation.md` — locked decisions + reasoning (authority)
- `context/project-overview.md` — product story, ride flows, user stories
- `context/architecture.md` — stack, shape, boundaries, ride-type matrix, invariants
- `context/code-standards.md` — how code is written here (read top-to-bottom)
- `context/library-docs.md` — approved dependencies + usage patterns; do not install outside this list
- `context/design-tokens.md` — colors, fonts, theming invariants (dark apps, light web)
- `context/provider-docs.md` — the 10 external-provider contracts (noop-first pattern)
- `context/build-graph.md` — what depends on what (the plan)
- `context/progress-log.md` — what's been built (newest first)
- `context/debug-guide.md` — diagnosis patterns + known non-bugs

Per-product deep dives: `backend/context/`, `rider/context/`, `driver/context/`, `admin/context/`,
`web/context/` (each has code-verified catalogs; per-app `ARCHITECTURE.md` files are design intent
and can lag the code).

## Agent skills
Skills installed for this build (open a skill's `SKILL.md` on demand; paths are `.claude/skills/<name>/`
or `.agents/skills/<name>/`, user- or project-level):
- `context-system` — builds and maintains the `context/` system (foundation, build-graph, progress-log).
- `architect` — designs a slice; writes its spec to `docs/specs/`.
- `develop` — builds a slice from its spec's `## Build plan`.
- `check` — `verify` proves behavior against the spec; `review` is a senior code review.

## Standing instructions
1. Before writing code: read `code-standards.md` and the relevant `context/` files.
2. After completing any work: prepend an entry to `context/progress-log.md`
   (category · area · what · notes · date). Mandatory — like reading context first.
3. A decision made mid-work updates the affected `context/` file immediately —
   and `foundation.md` first if it changes a locked decision.
4. After editing `@kari/types`: rebuild (`pnpm --filter @kari/types run build`) before typechecking.
