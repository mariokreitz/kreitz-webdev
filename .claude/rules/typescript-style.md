---
paths:
  - "**/*.ts"
---

# TypeScript & general engineering rules (repo-wide)

- **No pattern without a concrete requirement.** Don't add Strategy/Factory/Adapter/etc. speculatively — apply one only when a real, present need drives it (e.g. Strategy for `LOG_FORMAT` selection). Before building a custom abstraction over a library already in use, verify the library doesn't already solve it (check its source/docs first) — don't duplicate what's already provided.
- **DI over global mutable singletons.** No module-level `let instance` + getter/setter pairs. Use the framework's DI container (Nest's, in `apps/api`).
- **Explicit access modifiers, always.** Write `public`/`private`/`protected` explicitly on every class member — never rely on implicit `public`. Constructors are exempt (no `public` needed on constructor itself). Enforced by `@typescript-eslint/explicit-member-accessibility` — `eslint.config.mjs:116-124` and `apps/api/eslint.config.mjs:91-99`, both `{ accessibility: 'explicit', overrides: { constructors: 'no-public' } }`; `apps/frontend`/`apps/portal` inherit this via `eslint.base.config.mjs`.
- `readonly` on config/options objects.
- Discriminated unions over loose `Record<string, unknown>` bags when variants actually differ.
- Interfaces, not abstract classes, when there's no shared implementation to inherit — just a contract.
- Isolate unavoidable `any` (forced by a framework interface) to a single boundary file — never let it leak further.
- **Zero comments by default.** The only acceptable comment is a one-line WHY (a non-obvious tradeoff/constraint) — never a WHAT.
- **Delete no-op shells** (empty modules, dead re-export files) instead of keeping them "just in case."
