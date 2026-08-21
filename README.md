## Generating Angular code

There is no `angular.json` in this workspace, so `npx ng generate` does not work standalone here. All Angular code
generation goes through Nx:

```
nx g @nx/angular:<type> <name> --project=<frontend|portal>
```

`<type>` is one of `component`, `directive`, `pipe`, `service`, `guard`, `module`, `interceptor`, `resolver`.
`--project` must be `frontend` or `portal` (`apps/frontend`, `apps/portal`).

This workspace intentionally restores the classic suffixed file naming instead of the newer suffix-less Angular CLI
default — see the `generators` block in `nx.json`. Both `frontend` and `portal` share that config; neither app overrides
it.

### Examples

Component:

```
nx g @nx/angular:component login --project=portal
```

→ `login.component.ts`, `login.component.html`, `login.component.css`, `login.component.spec.ts` (class
`LoginComponent`)

Service:

```
nx g @nx/angular:service auth --project=portal
```

→ `auth.service.ts` (class `AuthService`)

Directive:

```
nx g @nx/angular:directive highlight --project=frontend
```

→ `highlight.directive.ts` (class `HighlightDirective`)

Pipe:

```
nx g @nx/angular:pipe truncate --project=frontend
```

→ `truncate.pipe.ts` (class `TruncatePipe`)

Guard:

```
nx g @nx/angular:guard auth --project=portal
```

→ `auth.guard.ts`

Module:

```
nx g @nx/angular:module shared --project=frontend
```

→ `shared.module.ts` (class `SharedModule`)

Interceptor:

```
nx g @nx/angular:interceptor auth --project=portal
```

→ `auth.interceptor.ts`

Resolver:

```
nx g @nx/angular:resolver user --project=frontend
```

→ `user.resolver.ts`

Pipe/guard/module/interceptor/resolver default to a `-` separator (e.g. `foo-guard.ts`); `nx.json` sets
`typeSeparator: "."` so they come out as `foo.guard.ts` instead.
