---
paths:
  - "apps/frontend/**/*.ts"
  - "apps/portal/**/*.ts"
  - "libs/ui/**/*.ts"
  - "apps/frontend/**/*.html"
  - "apps/portal/**/*.html"
  - "libs/ui/**/*.html"
---

# Angular smart/presentational split (apps/frontend, apps/portal, libs/ui)

**Hard rule — always applies, even for small features.** Split Angular UI into:

- **Smart (container) components** — own state, inject services (`inject(...)`), hold business logic and routing concerns. Routed page components are smart components.
- **Presentational (dumb) components** — pure UI. Only signal `input()`/`output()`, no service injection, no business logic.

Never build a single monolithic component that mixes both concerns.

**How to apply:**

- Default to this split any time a new Angular component is created — don't wait until a component "grows enough to justify it."
- Where a presentational component lives depends on whether it's reused:
  - **Feature-specific presentational components** — tightly coupled to one smart component, not intended for reuse elsewhere — nest under (or alongside) the smart component that composes them, not in a shared `components/`/`containers/` directory within the app — e.g. `pages/login/auth-form/` as a child of `pages/login/`. Reference example: `apps/portal/src/app/pages/login/auth-form/auth-form.component.ts` (presentational — `input.required<'login'|'register'>()`, `output<LoginPayload>()`, no `inject()`) composed by `apps/portal/src/app/pages/login/login.component.ts` (smart — `inject(AuthService)`, `inject(Router)`).
  - **Reusable presentational components** — generic UI atoms intended for reuse across features/apps (buttons, cards, toggles, etc.) — live in `libs/ui` (imported as `@shared/ui`), following the `libs/environments` shared-lib pattern: barrel export via `src/index.ts`, tags `scope:shared,type:ui` in `project.json`, and a distinct component selector prefix (`kwd-ui`) from the consuming app's own prefix. Reference example: `libs/ui/src/lib/button/button.component.ts` (`Button`, selector `kwd-ui-button`), consumed as `@shared/ui`'s `Button` and composed by `apps/portal/src/app/pages/login/auth-form/auth-form.component.ts`.
  - `apps/frontend` currently has only standalone page components (`terms-of-service`, `imprint`) with no presentational children — apply the same split there once one is needed.
- Injected services are private to the component, always. `inject(SomeService)` fields must be declared `private` or `protected` — never `public`, never left with implicit default visibility. The template only ever talks to the component's own public surface: no `service.someMethod()`, `service.someSignal()`, or any other direct reference to an injected service (or its members) inside a `.html` file. If a template needs something a service provides, the component exposes it through its own public method, computed signal, or property that delegates internally — the template's contract is with the component, never with whatever the component happens to depend on. Reference example: `apps/portal/src/app/app.ts` keeps `private readonly themeService: ThemeService = inject(ThemeService)` and exposes `public readonly theme: Signal<Theme>` (a `computed()` delegating to `themeService.theme()`) and `public toggleTheme(): void` (delegating to `themeService.toggle()`); `apps/portal/src/app/app.html` binds `[theme]="theme()"` and `(toggleTheme)="toggleTheme()"` — never `themeService` directly.
