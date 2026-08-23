---
paths:
  - "apps/api/**/*.ts"
---

# NestJS module structure (apps/api)

- **Every feature module exposes a public barrel (`index.ts`).** Code outside the module imports only from that barrel, never from the module's internal files directly.
- **Only Nest's own module-wiring files live at a module's top level** (`*.module.ts`, `*.service.ts`, `*.controller.ts`, and other framework-recognized artifacts — middleware, guard, interceptor, pipe). Everything else gets its own subfolder — `types/`, `interfaces/`, `strategies/`, `constants/` (defaults/fallbacks, DI tokens) — re-exported through the module's `index.ts` barrel. Only add the subfolders a module actually needs; don't scaffold empty ones.
  - Example shape for `core/email`: `email.module.ts`, `email.service.ts`, `email.controller.ts`, `index.ts`, plus `types/`, `interfaces/`, `strategies/`, `constants/` as needed.
  - Watch for circular injection: a file inside one of those subfolders must import sibling files/subfolders directly, never back through the module's own `index.ts` — that's an import cycle into itself.
  - Keep DI tokens in `constants/` so both the module and its subfolder files can import them without routing through the barrel.
- **Cross-cutting modules used repo-wide are `@Global()` + listed in the owning module's `exports`**, matching `PrismaModule`/`RedisModule`. Don't mark a module `@Global()`/export it if it has nothing to export — that's dead config, delete it.
- **Redaction/serialization of sensitive data uses an allow-list, not a deny-list.** Explicitly list the fields to keep; a field never included can't leak via a redact path someone forgets to update.
- **One owner per cross-cutting concern.** Don't let two mechanisms register the same middleware/interceptor/logging path — pick one registration site.
- **Tests follow the `__tests__`-per-feature convention**, not colocated `*.spec.ts`. Redaction/sanitization logic and other pure functions must ship with tests, not be deferred.
