---
paths:
  - "apps/frontend/**/*.ts"
  - "apps/portal/**/*.ts"
---

# Angular smart/presentational split (apps/frontend, apps/portal)

**Hard rule — always applies, even for small features.** Split Angular UI into:

- **Smart (container) components** — own state, inject services (`inject(...)`), hold business logic and routing concerns. Routed page components are smart components.
- **Presentational (dumb) components** — pure UI. Only signal `input()`/`output()`, no service injection, no business logic.

Never build a single monolithic component that mixes both concerns.

**How to apply:**

- Default to this split any time a new Angular component is created — don't wait until a component "grows enough to justify it."
- Presentational components live nested under (or alongside) the smart component that composes them, not in a shared `components/`/`containers/` directory — e.g. `pages/login/auth-form/` as a child of `pages/login/`. This is the only structural convention established so far in the repo (`apps/portal/src/app/pages/login/auth-form/auth-form.component.ts` as child of `apps/portal/src/app/pages/login/login.component.ts`); `apps/frontend` has no components yet, so start it there the same way.
- Reference example: `apps/portal/src/app/pages/login/auth-form/auth-form.component.ts` (presentational — `input.required<'login'|'register'>()`, `output<LoginPayload>()`, no `inject()`) composed by `apps/portal/src/app/pages/login/login.component.ts` (smart — `inject(AuthService)`, `inject(Router)`).
