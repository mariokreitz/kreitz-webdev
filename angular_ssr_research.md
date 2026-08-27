# The Angular SSR Handbook: Data Fetching and Safe Server-to-Server Communication

## TL;DR

- Target modern Angular (v17 to v21) using @angular/ssr, standalone components, and signals; treat legacy Angular
  Universal as migration context only. Angular v21 is the current stable release (released November 20, 2025); v22 is
  expected around mid-2026 on Angular's six-month cadence, so build against v21 and verify anything newer against
  angular.dev. The red line runs from SSR fundamentals to data fetching to server-to-server calls to architecture,
  structure, scalability, and clean code.
- The hardest part, server-to-server communication, is solvable with a small set of rules: resolve absolute base URLs
  from config not from the incoming request, read the incoming request via the REQUEST token, forward
  cookies/Authorization only to trusted internal origins through a platform-aware functional interceptor with withFetch
  (), keep credentialed responses out of the transfer cache, and never mutate during render.
- The biggest risks are cross-request state pollution and data leakage. Angular has shipped multiple SSR CVEs here
  (CVE-2025-59052 global injector race; CVE-2025-62427 and CVE-2026-27739 SSRF via URL/host handling). Stay patched, use
  per-request DI (never module-level singletons for request data), configure allowedHosts, and audit what goes into
  TransferState.

## Key Findings

- @angular/ssr with server routing (RenderMode.Server, .Prerender, .Client) is the current foundation.
  provideServerRendering (withRoutes (serverRoutes)) is the modern setup; the older CommonEngine/renderApplication
  approach and Angular Universal (@nguniversal/\*) are legacy.
- SSR serialization waits for application stability (ApplicationRef.isStable). In zoneless apps, HttpClient
  auto-registers pending tasks, but any manual async work, timers, or long-lived observables must use PendingTasks or
  pendingUntilEvent or the app never stabilizes. NG0506 is logged when ApplicationRef.isStable does not emit true within
  10 seconds (the message says it "didn't happen within 10000ms").
- The HTTP transfer cache (provideClientHydration with withHttpTransferCacheOptions) automatically prevents double
  fetching for GET/HEAD requests, but by default excludes anything with Authorization/Cookie headers or Set-Cookie
  responses. This default is a security feature; overriding it carelessly leaks user data.
- The resource/rxResource/httpResource signal APIs are SSR-aware; rxResource/resource can serialize into TransferState
  via an id, and recent fixes let stream resources set values synchronously to avoid a hydration-destroying loading
  flicker.
- Clean architecture means layering (core, data-access, domain, feature, ui/shared), hiding data access behind
  repository-style services or SignalStore facades, using platform-aware code (afterNextRender, DI tokens) instead of
  isPlatformBrowser branches in templates, and keeping SSR-only code out of feature libraries.

## Details

### Chapter 0: The red line (how to read this)

The guiding thread: an Angular app renders once on the server to produce meaningful HTML fast, then hydrates in the
browser to become interactive. Everything hard about SSR flows from one fact: your code now runs in two very different
environments, and during the server pass it often needs to talk to backend APIs on behalf of a user whose browser is not
there yet. So we build up in order: understand the render lifecycle (Ch.1), fetch data so it survives the
server-to-client handoff (Ch.2), do server-to-server calls safely (Ch.3, the heart), lock down security (Ch.4),
structure the code so this stays maintainable (Ch.5, Ch.6), make it fast and scalable (Ch.7), and keep it clean (Ch.8).
A pitfalls catalogue follows (Ch.9).

### Chapter 1: Angular SSR fundamentals

**How @angular/ssr works today.** You enable it with `ng new --ssr` or `ng add @angular/ssr`. This generates a
`server.ts`, an `app.config.server.ts`, and an `app.routes.server.ts`. On Node, `server.ts` wires an Express app to
`AngularNodeAppEngine`:

```typescript
// server.ts
import { AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('*', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

export const reqHandler = createNodeRequestHandler(app);
```

For non-Node runtimes (edge, workers), `@angular/ssr` exposes `AngularAppEngine` and `createRequestHandler` built on the
Web API Request/Response.

**Server routing and RenderMode.** Instead of one blanket SSR mode, you choose per route in `app.routes.server.ts`:

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'about', renderMode: RenderMode.Prerender }, // SSG at build time
  { path: 'profile', renderMode: RenderMode.Server }, // SSR per request (user-specific)
  { path: '', renderMode: RenderMode.Client }, // CSR only
  { path: '**', renderMode: RenderMode.Server },
];
```

The why: prerender (SSG) is cheapest and cacheable but cannot contain per-user data; Server (SSR) is for
per-request/personalized pages; Client (CSR) is for pages that need no SEO and depend heavily on browser APIs. This
choice is the single biggest lever on cost, TTFB, and cache-safety. Route-level render mode config was promoted to
stable in Angular v20. You can also set per-route `headers` and `status`, and choose prerender `fallback` strategies
(Server, Client, None).

**Request-scoped rendering lifecycle.** For each SSR request Angular bootstraps the application, runs change detection,
waits for stability, serializes the DOM to HTML plus serialized state, and tears down. Providers configured with
`useValue` at the top level persist across requests (they are evaluated once); if you need a fresh value per request,
use `useFactory`. This is a core correctness rule: request-specific data must never live in a shared singleton.

**Hydration, event replay, incremental hydration.** Full-application hydration (stable since v16) reuses the server DOM
instead of re-rendering, preserving state and avoiding flicker. It is on by default when you use SSR via
`provideClientHydration()`. Event replay (added in v18, on by default in v19+) queues user events fired before hydration
and replays them after. Incremental hydration (stable in v20) builds on `@defer`: adding a `hydrate` trigger
(`hydrate on interaction`, `hydrate on viewport`, `hydrate never`, etc.) tells Angular to render the content on the
server but defer shipping and hydrating its JavaScript until the trigger fires.

```typescript
// enable in app.config.ts
provideClientHydration(withIncrementalHydration());
```

```html
@defer (hydrate on interaction) {
<user-profile />
} @placeholder {
<profile-skeleton />
}
```

Why it matters: incremental hydration cuts the JavaScript that must execute before interactivity, improving TTI/INP
while keeping SSR's fast first paint and SEO. Pitfall: a `@defer` nested inside an `@if` may not hydrate as expected,
and `hydrate on idle` may never trigger in some test setups; validate with Angular DevTools' hydration view.

**Stability and zoneless.** SSR does not serialize HTML until `ApplicationRef.isStable` first emits true, which happens
when there are no pending tasks. With Zone.js, timers (setInterval/setTimeout), unfinished HTTP, and repeated
requestAnimationFrame delay stability. In zoneless apps (zoneless change detection is stable as of v20.2), Angular has
no Zone to watch async work, so it relies on the `PendingTasks` service (stable in v20). HttpClient and the Router
register pending tasks automatically; anything else you must register yourself:

```typescript
const pendingTasks = inject(PendingTasks);
pendingTasks.run(async () => {
  const data = await loadCriticalData();
  this.state.set(data);
});
// For observables important to render:
readonly;
state = someObservable.pipe(pendingUntilEvent());
```

If stability never arrives, Angular logs NG0506 ("Application remains unstable") when `ApplicationRef.isStable` does not
emit true within 10 seconds. The classic causes: an interval started in a constructor/ngOnInit, a websocket or a
never-completing observable, or a signal effect that loops. On the server, none of these should run; guard them so they
only start in the browser.

### Chapter 2: Data fetching during SSR

**HttpClient with withFetch.** Use `provideHttpClient(withFetch())`. The fetch backend is the recommended default for
SSR: it avoids the xhr2 shim, integrates cleanly with the server runtime, and (critically for Chapter 3) does not choke
on setting the `cookie` header server-to-server the way the XHR backend does ("Refused to set unsafe header 'cookie'").
Note Angular limits each server-side fetch response body to 1 MB by default; per angular.dev, "Angular limits each
response body to 1 MB... If a response exceeds the configured limit, the request fails with the NG02825 error." Raise it
deliberately with `maxResponseBodySize` in `provideServerRendering` options only when needed, because larger buffers
increase memory and DoS risk.

**The transfer cache: avoiding double fetching.** Without help, an HTTP GET made during SSR runs again in the browser
after hydration, wasting a round trip and causing content flicker. Angular solves this automatically: `HttpClient`
caches outgoing GET/HEAD requests on the server, serializes them into the HTML, and the browser reuses them instead of
refetching, until the app becomes stable. Enable it via `provideClientHydration()` (on by default) and tune with
`withHttpTransferCacheOptions`:

```typescript
provideClientHydration(
  withHttpTransferCacheOptions({
    includeHeaders: ['ETag'],
    filter: (req) => !req.url.includes('/api/profile'),
    includePostRequests: false, // enable only for idempotent GraphQL-style reads
    includeRequestsWithAuthHeaders: false, // keep false: prevents user-data leakage
  }),
);
```

Defaults you must understand, per the official SSR guide: only GET/HEAD are cached; requests with `Authorization`,
`Proxy-Authorization`, or `Cookie` headers, or sent with credentials, are excluded; responses with `Set-Cookie` or
`Cache-Control: no-store/no-cache/private` are excluded. You can opt a single request out with
`http.get(url, { transferCache: false })`, or map differing server/client origins with `HTTP_TRANSFER_CACHE_ORIGIN_MAP`
(provide it only in server config).

**How the transfer cache goes wrong.** The dangerous key insight, documented by community analysis: the internal cache
key is roughly `METHOD + urlWithParams` and it ignores headers. So if you force-enable caching of authenticated requests
and the rendered HTML (with its serialized state) gets cached by a CDN or shared, User B can receive User A's data.
Angular's defaults are safe precisely because they exclude credentialed requests; the docs warn on `includeHeaders`:
"Avoid including sensitive headers like authentication tokens. These can leak user-specific data between requests."
Overriding `includeRequestsWithAuthHeaders: true` reintroduces the leak.

**Resource APIs (resource, rxResource, httpResource) with SSR.** These signal-based APIs (v19+; httpResource introduced
in v19.2, part of the reactivity stabilization push in v20) are SSR-aware. During SSR Angular waits for the resource to
resolve before serializing, so server-rendered views can rely on the data being present. To carry the resolved value to
the client (rather than refetching), give `resource`/`rxResource` an `id`; Angular stores the value in TransferState and
initializes the client resource in a resolved state:

```typescript
const userResource = resource({
  params: () => ({ id: userId() }),
  loader: ({ params }) => fetchUser(params),
  id: 'user-detail', // enables server->client transfer
});
```

Important, per angular.dev: "Because the cached value is serialized into the page's HTML, avoid setting id on resources
that load data specific to the user who triggered the server-side render, especially if the rendered HTML can be cached
or shared between users." Same leakage rule as the transfer cache. A subtle bug fixed recently: if a resource's value
was not set synchronously it started in a loading state, which destroyed the server-hydrated resolved DOM and lost event
replay. Recent Angular allows stream/rxResource to resolve synchronously from TransferState to avoid this flicker. For
mutations (writes), keep using HttpClient directly; the resource APIs are designed for reads.

**What belongs in SSR fetches vs client-side.** Fetch on the server only the data needed for the initial,
above-the-fold, SEO-relevant view (the product, the article, the profile header). Defer non-critical data (reviews,
recommendations, comments, anything below the fold or interaction-gated) to the client via `@defer` or client-only
resources. Why: every blocking fetch during render adds directly to TTFB, and the server holds the connection open until
the app stabilizes. When a backend is slow, time-box it: wrap the call with a timeout and a fallback so a slow
dependency degrades to a client fetch or an empty state rather than blocking the whole page.

### Chapter 3: Server-to-server communication for safe API calls (the heart)

This is where SSR gets messy, because during the server pass Angular's Node process must call backend APIs as if it were
the user's browser, but without the browser's origin, cookies, or automatic credential handling.

**Absolute vs relative URLs.** In the browser, `httpClient.get('/api/products')` resolves against the page origin. On
the server there is no origin, so a bare relative URL has historically failed (NetworkError) or, worse, resolved against
an attacker-controllable host (see SSRF below). Rule: on the server you must turn relative API paths into absolute URLs.
Resolve the base URL from configuration/environment (an injected token), not by reading the Host header of the incoming
request. Deriving the outbound base URL from `REQUEST`/Host/X-Forwarded-\* is exactly the pattern that caused Angular's
SSRF CVEs.

**Accessing the incoming request via DI.** Angular exposes tokens from `@angular/core`:

- `REQUEST`: the incoming request as a Web API `Request` (headers, cookies, url). Its type is
  `InjectionToken<Request | null>`. Per the docs: "Provides access to the current request object, which is of type
  Request from the Web API. This allows you to access headers, cookies, and other request information."
- `RESPONSE_INIT`: response init options (set status/headers dynamically).
- `REQUEST_CONTEXT`: extra context passed to the engine's `handle`.

These are `null` during build, CSR, SSG, and dev route extraction, so always inject with `{ optional: true }` and
null-check. Read headers with the Fetch Headers API: `request.headers.get('cookie')`, not Express-style
`request.headers.cookie` (that only applies to the legacy Universal Express token).

**Forwarding cookies and Authorization headers.** The core pattern is a functional interceptor that, on the server only,
reads the incoming credentials and attaches them to outbound calls to your trusted internal API, rewriting relative URLs
to absolute in the process:

```typescript
// api-forwarding.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '../environments/environment';

const INTERNAL_API_BASE = environment.internalApiUrl; // trusted, e.g. http://api.internal:8080

export const apiForwardingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) {
    return next(req); // browser attaches cookies itself
  }
  const serverRequest = inject(REQUEST, { optional: true });
  if (!serverRequest) return next(req);

  let url = req.url;
  if (url.startsWith('/')) url = `${INTERNAL_API_BASE}${url}`;

  // SECURITY: only forward credentials to the trusted internal origin
  if (!url.startsWith(INTERNAL_API_BASE)) {
    return next(req.clone({ url }));
  }

  const cookie = serverRequest.headers.get('cookie');
  const authorization = serverRequest.headers.get('authorization');
  const setHeaders: Record<string, string> = {};
  if (cookie) setHeaders['cookie'] = cookie;
  if (authorization) setHeaders['authorization'] = authorization;

  // defense in depth: keep credentialed responses out of the transfer cache
  return next(req.clone({ url, setHeaders, transferCache: false }));
};
```

Register with `provideHttpClient(withFetch(), withInterceptors([apiForwardingInterceptor]))`. Why withFetch matters
here: the XHR backend refuses to set the forbidden `cookie` header; the fetch backend sends it server-to-server. Why the
guard matters: forwarding credentials to any origin is an SSRF and credential-leak vector; restrict to an exact internal
base-URL prefix. Because this interceptor adds a `cookie`/`authorization` header, those requests are already excluded
from the transfer cache by default (the `transferCache: false` is belt-and-suspenders).

**Session/cookie auth vs JWT with SSR.** With httpOnly session cookies (the recommended, XSS-resistant pattern), the SSR
server cannot read the token in JavaScript, but it does receive the cookie on the incoming request and can forward it
verbatim to the backend, which validates it. With JWTs kept in localStorage, SSR simply cannot see them (no localStorage
on the server), so those pages render as logged-out on the server, then flip after hydration, causing flicker and lost
SEO for authenticated content. This is a strong argument for the BFF + httpOnly cookie pattern (below). httpOnly cookies
must be `Secure` and use an appropriate `SameSite`; the SSR server forwards, it does not store.

**Why secrets must never reach TransferState.** Anything you put in TransferState is serialized into the HTML delivered
to the browser and is fully readable by the user (and by anyone who gets the cached HTML). Server-only API keys,
internal service tokens, and raw session material must live only in server memory/env vars and never be assigned to a
transferred key or included in a cached response. This is why the transfer cache excludes credentialed requests by
default.

**Internal network vs public gateway.** Prefer calling backends over the private network (internal DNS/service mesh)
from the SSR server: lower latency, no public round trip, and the traffic never leaves your perimeter. But then the
transfer cache origin differs from the browser's public origin for the same logical endpoint; use
`HTTP_TRANSFER_CACHE_ORIGIN_MAP` (server config only) to reconcile them so the browser reuses the server-fetched data
during hydration.

**SSRF risks.** Angular has shipped several SSR SSRF CVEs; these are not hypothetical:

- **CVE-2025-62427** (GitHub advisory GHSA-q63q-pgmf-mxhr, rated High): "When an incoming request path... begins with a
  double forward slash (//) or backslash (\\), the URL constructor treats it as a schema-relative URL," hijacking the
  app's notion of its own origin so relative `HttpClient` calls during SSR went to an attacker's host. Fixed in
  @angular/ssr 19.2.18, 20.3.6, and 21.0.0-next.8.
- **CVE-2026-27739** (GitHub advisory GHSA-x288-3778-4hhx, rated Critical): `createRequestUrl` "directly reads and uses
  the host and x-forwarded-host headers to determine the hostname" without validation. Fixed in @angular/ssr 19.2.21,
  20.3.17, 21.1.5, and 21.2.0-rc.1.

Defenses: keep @angular/ssr patched; configure `allowedHosts` (an explicit allowlist, avoid `*`); keep
`trustProxyHeaders` off unless you sit behind a proxy that strictly sets them; resolve outbound base URLs from config,
not headers; and if you cannot upgrade, add middleware that rejects/sanitizes paths starting with `//` or `\`. Angular
now performs strict validation of Host, Forwarded, and X-Forwarded-\* headers, and requests with unrecognized hostnames
get a 400 Bad Request.

**Connection reuse and pooling.** Node does not enable keep-alive on outbound connections by default in all cases, and
re-doing TCP+TLS handshakes for every backend call under SSR load is a major latency cost. Because the fetch backend
uses undici, tune a single long-lived dispatcher/agent process-wide (keep-alive on, a bounded connections pool per
origin, tight request timeouts) rather than creating one per request. Community benchmarks report roughly halved
outbound latency and more stable p95 from this alone. Pair it with hard timeouts (AbortController) so a stuck upstream
cannot exhaust the pool. Do not create a new agent per request.

**Per-request isolation (the critical correctness rule).** Request-specific data (the current user, their cookies, their
tenant) must never be stored in module-level singletons, module-scoped variables, or `useValue` providers shared across
renders, because concurrent SSR requests run in the same Node process and will clobber each other. This is not
theoretical: **CVE-2025-59052** (GHSA-68x2-mx4q-78m7, CVSS 7.1, CWE-362 race condition) was exactly a global
module-scoped platform injector being shared across concurrent requests, "leading to one request responding with data
meant for a completely different request," leaking data/tokens between users. It was patched in @angular/platform-server
18.2.14, 19.2.15, 20.3.0, 21.0.0-next.3 and @angular/ssr 18.2.21, 19.2.16, 20.3.0, 21.0.0-next.3; the fix made
`getPlatform()` return null and `bootstrapApplication` require an explicit BootstrapContext on the server. Rules: use DI
with request scope (factory providers, the REQUEST token) for anything user-specific; never cache per-user data in a
`root` singleton's field during SSR; stay patched; and ensure the server build sets `ngJitMode` false.

**Error handling and graceful degradation.** A backend failure during SSR should not blank the page. Catch errors in the
data layer and return a safe fallback so the page still renders (then let the client retry), or set an appropriate
status via `RESPONSE_INIT` for true not-found/error pages. In v20+, Angular installs default `unhandledRejection`/
`uncaughtException` handlers during SSR so a stray rejection does not crash the Node server, but you should still handle
expected failures explicitly.

```typescript
getCriticalData();
{
  return this.http.get<Data[]>('/api/critical').pipe(
    timeout(3000),
    catchError(() => of([])), // degrade gracefully, keep rendering
  );
}
```

**POST/mutations during SSR.** Do not perform mutations during server rendering. A GET render must be idempotent and
safe; SSR can run speculatively, be retried, or be triggered by crawlers, so a POST during render risks duplicate
writes. Mutations belong to explicit user actions in the browser. Angular's CSRF helper (cookie-to-header
`XSRF-TOKEN` -> `X-XSRF-TOKEN`) only applies to browser requests to same-origin/relative URLs and is a client concern;
by default the interceptor sends the header on mutating requests but not GET/HEAD. If a page genuinely needs server-side
writes, that logic belongs in your BFF, not in the Angular render pass.

**Where a BFF (NestJS) fits.** A Backend-for-Frontend is the clean home for all the messy parts: it terminates the
httpOnly session cookie, holds the real access/refresh tokens server-side (e.g. in Redis), forwards validated requests
to microservices with the right Authorization header, handles token refresh silently, and centralizes
CORS/CSRF/rate-limiting. With a BFF, your Angular SSR server talks to one trusted origin, the browser never sees raw
tokens, and the SSRF surface shrinks to a single known base URL. For a developer with NestJS experience, this is the
recommended target architecture: Angular SSR for rendering, NestJS BFF for auth and aggregation, microservices behind
it. Keep business logic in the microservices, not the BFF; the BFF aggregates and secures.

### Chapter 4: Security best practices

- **Minimize and sanitize TransferState.** Put only what the client genuinely needs to hydrate; never secrets, tokens,
  or another user's data. Treat everything serialized as public.
- **XSS via serialized state.** Angular escapes template bindings and sanitizes HTML/URL contexts by default; do not
  `bypassSecurityTrust*` on anything derived from serialized or user input, and never build Angular templates from
  strings on the server (template injection = full compromise). Use AOT (the default) in production. Per the docs:
  "Don't create Angular templates on the server side using a templating language. This carries a high risk of
  introducing template-injection vulnerabilities."
- **Secret management.** Server-only secrets in env vars, read in server code only; verify they are never imported into
  browser bundles. The build splits server and browser bundles; keep secret access in `server.ts` or server-only
  providers.
- **Auth token handling.** Prefer httpOnly + Secure + SameSite cookies terminated at a BFF; avoid localStorage tokens
  (XSS-exfiltratable and invisible to SSR). Forward cookies only to trusted internal origins.
- **Cache poisoning of personalized responses.** Never let personalized SSR HTML be stored in a shared/CDN cache keyed
  only by URL. Mark personalized routes `Cache-Control: private/no-store`, keep credentialed requests out of the
  transfer cache (default), and separate cache keys for authenticated vs anonymous.
- **CSP and nonces.** Configure a strict `Content-Security-Policy`; generate nonces uniquely per request, ideally at the
  edge, not at an origin whose HTML a CDN caches (a cached "unique" nonce defeats CSP). The `CSP_NONCE` token or
  `autoCsp`/`ngCspNonce` options integrate this with Angular. Consider Trusted Types enforcement.
- **Safe header handling.** Validate/allowlist Host and X-Forwarded-\* (Angular now does strict validation), do not
  reflect request headers into responses, and do not use request headers to build outbound URLs.

### Chapter 5: Clean architecture for Angular SSR apps

**Layered architecture.** Organize by feature (vertical slices) and within/across features by layer (horizontal),
following the Nrwl/Angular Architects reference model:

- `core` / `shared`: cross-cutting infrastructure (interceptors, config tokens, guards) and reusable dumb UI.
- `data-access`: everything that talks to the network (typed API/repository services, SignalStores, DTOs and mappers).
  All HTTP lives here.
- `domain`: framework-agnostic models and business logic.
- `feature`: smart components implementing use cases, injecting data-access.
- `ui`: presentational, reusable, use-case-agnostic dumb components.

The why: features depend on data-access and domain, never the reverse, and UI never reaches into data-access. Enforce
these boundaries with lint rules (Nx module boundaries or eslint-plugin-boundaries) so a violation fails at lint time,
not review.

**Abstract data access behind facades/repositories.** Components should call `productRepository.getById(id)` (returning
signals or observables), not `HttpClient` directly. This hides SSR concerns (URL resolution, transfer, platform checks)
from features, keeps them platform-agnostic, and makes testing trivial. Manfred Steyer's guidance: hide a SignalStore
behind a facade (or a "feature service") so updates happen only in well-defined ways, and forbid stores from accessing
each other to prevent cycles.

**Platform-aware code.** Never touch `window`, `document`, `localStorage`, or `navigator` directly. Use:

- `afterNextRender`/`afterEveryRender` for browser-only initialization (they never run on the server; `afterRender` was
  renamed to `afterEveryRender` and both are stable as of v20).
- The `DOCUMENT` token instead of the global `document`.
- Platform-specific provider implementations: define an abstract service, provide a `BrowserXService` in `app.config.ts`
  and a `ServerXService` in `app.config.server.ts`. Angular's docs explicitly recommend this over `isPlatformBrowser`
  runtime checks.

Critically, do not use `isPlatformBrowser`/`isPlatformServer` inside templates with `@if` to render different content
per platform: the docs warn this "causes hydration mismatches and layout shifts." Keep server and client rendering
identical; branch only in lifecycle hooks or providers.

**Where SSR-specific code lives.** server.ts, server routes, server-only interceptors, the REQUEST-reading logic, and
origin/base-URL tokens belong in an app-level server area (or a dedicated server-only library), not scattered through
features. Features stay platform-agnostic; the SSR wiring is composed at the app root.

**Signals/SignalStore and SSR.** Signals are SSR-friendly: they are synchronous and do not depend on Zone. SignalStore
(NgRx) is a good fit for feature/domain state; it works with SSR as long as any async loading registers pending tasks
(HttpClient does this automatically). Steyer frames SignalStore as the "headless" cross-section of the app's logic; that
separation is exactly what makes it testable and platform-independent. Provide stores in `root` for most cases;
route-level provision only when the state is genuinely route-scoped.

### Chapter 6: A concrete recommended folder structure

For a single app that may grow, a feature-based structure:

```
project/
  src/
    server.ts                     # SSR server entry (Node/Express)
    main.ts                       # browser bootstrap
    main.server.ts                # server bootstrap (accepts BootstrapContext in v21+)
    app/
      app.config.ts               # browser providers (HttpClient, hydration, interceptors)
      app.config.server.ts        # server-only providers (server impls, origin map)
      app.routes.ts               # client routes
      app.routes.server.ts        # RenderMode per route
      core/                       # singletons, guards, config tokens
        config/ api-base-url.token.ts
        interceptors/ api-forwarding.interceptor.ts   # SSR cookie/URL logic
      shared/
        ui/                       # dumb, reusable components
        util/
      features/
        products/
          data-access/            # product-api.service.ts, product.store.ts, dtos
          domain/                 # product.model.ts
          feature-list/           # smart component + route
          feature-detail/
          ui/                     # product-card, etc.
        checkout/
          ...
```

For multiple apps or many teams, promote to an Nx monorepo with `apps/` and `libs/`, libraries grouped by domain and
tagged by type (`type:feature`, `type:data-access`, `type:ui`, `type:util`) and scope (`scope:products`), with enforced
module boundaries. Reasoning for each choice: feature folders keep related code together and enable route-level code
splitting via lazy standalone routes; data-access isolation means the SSR/HTTP concerns change in one place; core holds
the one server-aware interceptor; server.ts and \*.server.ts at the root keep platform wiring out of features. Note the
v21 SSR file changes (main.server.ts must accept a BootstrapContext; provideServerRendering from @angular/ssr; a
different builder/bundle format), so keep server entry files current when upgrading, this is a common source of upgrade
breakage.

### Chapter 7: Scalability and performance

- **TTFB is the SSR budget.** Every blocking server fetch adds to TTFB and the server holds the connection until
  stability. Target TTFB under ~200ms where feasible; measure per route type.
- **Avoid waterfalls.** Do not `await` backend calls sequentially when they are independent. Fire them in parallel
  (`forkJoin`, `Promise.all`) and hoist shared data to a parent/route resolver so children do not each trigger their own
  serial fetch. Sequential same-domain calls are a classic SSR anti-pattern that directly inflates TTFB.
- **Parallelize and trim payloads.** Return only the fields you render; oversized responses inflate serialization and
  the transferred state (and can bump the 1 MB server-fetch limit).
- **Caching layers.** Prerender (SSG) anything non-personalized. For public SSR pages, full-page/CDN caching with
  stale-while-revalidate dramatically cuts TTFB, but only when the page is not personalized; never CDN-cache per-user
  HTML keyed only by URL. Add an in-memory or distributed (Redis) cache on the SSR server for hot, shared backend
  responses. ISR-like patterns (serve cached HTML, revalidate in background) can be approximated with a caching reverse
  proxy in front of SSR.
- **Connection reuse.** As in Chapter 3, a shared keep-alive undici agent for outbound calls is one of the highest-ROI
  latency fixes.
- **Monitoring/observability.** Track TTFB, render duration, stability time, outbound backend latency (p95/p99),
  event-loop delay, and error rates on the SSR server. Log SSRF-relevant events (rejected hosts) and NG0506 stability
  warnings.

### Chapter 8: Clean code principles in this context

- **Smart/dumb split with signals.** Smart (feature) components inject data-access and expose signals; dumb (ui)
  components take `input()` signals and emit `output()`, with no HTTP and no platform code. This keeps dumb components
  trivially SSR-safe and testable.
- **Typed API layers.** Define DTO interfaces and map them to domain models in data-access. Consider a `parse` step
  (e.g. in httpResource) or a schema guard so a backend change does not crash the render.
- **Error handling patterns.** Centralize with functional interceptors (retry with backoff for idempotent GETs, map
  errors to typed results); degrade gracefully during SSR (Chapter 3).
- **Testing SSR behavior.** Unit-test data-access and stores normally (HttpClient's PendingTasks integration makes
  zoneless tests wait correctly). For true SSR behavior, prefer e2e tests: @angular/platform-server/testing is
  deprecated, and the team now recommends e2e checks for SSR. Vitest is Angular's primary test runner as of v21.
- **Common SSR code smells.** Direct `window`/`document`/`localStorage` access; `isPlatformBrowser` branches in
  templates; HttpClient calls in components instead of data-access; relative API URLs assumed to work on the server;
  per-user data cached in `root` singletons; mutations during render; missing timeouts on SSR fetches; secrets or auth
  headers in TransferState; long-lived subscriptions started in constructors.

### Chapter 9: Pitfalls catalogue

1. **window/document/localStorage on the server.** Cause: those globals do not exist in Node; code runs in both
   environments. Fix: `afterNextRender`, the `DOCUMENT` token, platform-specific providers; never call them at
   construction time.
2. **Hydration mismatch / flicker after hydration.** Cause: server and client render different DOM, often from
   `isPlatformBrowser` template branches, non-deterministic data, or a resource that starts in loading and destroys the
   resolved server DOM. Fix: keep rendering identical across platforms; use the transfer cache / resource `id`; rely on
   synchronous resolution from TransferState.
3. **Relative URL failures in server HttpClient.** Cause: no origin on the server. Fix: resolve absolute base URL from a
   config token in a server interceptor; do not derive it from the Host header.
4. **Cookies silently not forwarded.** Cause: Angular does not forward the incoming request's cookies to server-side
   HttpClient automatically; the server call goes out unauthenticated and the page renders logged-out. Fix: the
   REQUEST-reading interceptor from Chapter 3, with withFetch ().
5. **Duplicate fetching (server then client).** Cause: transfer cache disabled, non-GET requests, or different
   server/client origins so keys do not match. Fix: keep `provideClientHydration()`, use GET, map origins with
   `HTTP_TRANSFER_CACHE_ORIGIN_MAP`.
6. **App never stabilizes (NG0506).** Cause: intervals, websockets, never-completing observables, or looping effects
   running during render, especially under zoneless. Fix: guard them to browser-only; register genuine async with
   PendingTasks/pendingUntilEvent; do not start timers in constructors.
7. **Cross-request state pollution / memory leaks.** Cause: request data in module-level singletons or `useValue`;
   concurrent renders share one Node process. Fix: per-request DI (factory providers, REQUEST); no per-user caching in
   root singletons; stay patched (CVE-2025-59052).
8. **Third-party libraries that break SSR.** Cause: libraries that touch `window`/`document` at import or construction.
   Fix: lazy-load them in `afterNextRender`, wrap behind a platform-specific provider, or `@defer` the component that
   uses them.
9. **Data leakage via transfer cache / TransferState.** Cause: caching credentialed responses or per-user resource `id`s
   that end up in shared HTML. Fix: keep auth requests out of the cache (default), do not set `id` on per-user resources
   when HTML is shared, mark personalized routes no-store.
10. **SSRF via URL/host handling.** Cause: schema-relative paths (`//`, `\`) or trusting Host/X-Forwarded-\* to build
    origins. Fix: patch @angular/ssr, set `allowedHosts`, keep `trustProxyHeaders` off unless behind a strict proxy,
    resolve base URLs from config, sanitize `//`-prefixed paths.

## Recommendations

Staged, concrete next steps:

1. **Baseline (week 1).** Confirm you are on a patched, current Angular (v21 stable). Run `ng update`. Verify
   `provideHttpClient(withFetch())`, `provideClientHydration()`, and per-route RenderMode are in place. Set
   `allowedHosts` and leave `trustProxyHeaders` off. Threshold to act sooner: if you are on v18 or earlier, prioritize
   upgrading, because several SSR SSRF fixes and the injector-race fix are not available on old lines (the injector-race
   fix starts at 18.2.14/19.2.15).
2. **Server-to-server (week 1-2).** Introduce a single config token for the internal API base URL and the Chapter 3
   forwarding interceptor (guarded to server, restricted to the trusted origin, `transferCache: false`). Move all HTTP
   into data-access services/repositories. Benchmark: no server-side call uses a bare relative URL, and no credentialed
   response appears in TransferState.
3. **Data fetching (week 2-3).** Audit which fetches must be server-side (SEO/above-the-fold) and push the rest to
   `@defer`/client resources. Add timeouts + fallbacks to every SSR fetch. Parallelize independent calls. Benchmark:
   TTFB per route, and zero duplicate GETs in the browser network tab on first load.
4. **Architecture and structure (week 3-4).** Impose the layered folder structure and lint-enforced boundaries.
   Introduce SignalStore facades in data-access. Replace any `isPlatformBrowser` template branches with
   `afterNextRender`/platform providers.
5. **Auth and BFF (project-level).** If you use localStorage tokens, migrate to httpOnly session cookies terminated at a
   NestJS BFF that holds tokens server-side and forwards to microservices. This is the target that makes SSR auth, SSRF
   surface, and CSRF all tractable at once.
6. **Scale and observe (ongoing).** Add a shared keep-alive undici agent, an SSR-side cache (Redis) for hot shared data,
   CDN full-page caching only for non-personalized routes, and monitoring for TTFB, stability time, outbound latency,
   and rejected-host events.

Thresholds that change the plan: if TTFB is dominated by backend latency, add SSR-side caching and parallelization
before anything else; if a route is fully public, move it to Prerender/SSG and CDN it; if a route is fully personalized
and non-SEO, consider RenderMode.Client to skip SSR cost entirely; if you see any cross-user data in responses, treat it
as a P0 and audit singletons and transfer-cache config immediately.

## Caveats

- Angular moves fast (six-month majors). This handbook targets v17-v21 with v21 as current stable; v22 is expected
  around mid-2026, so verify API names against angular.dev for your exact version, especially the SSR bootstrap files,
  which changed notably in v21.
- Some cited specifics (undici tuning numbers, the transfer-cache internal key format, BFF+Redis flows) come from
  reputable community sources, not Angular's official docs; treat them as sound practice rather than framework
  guarantees, and validate against your infrastructure.
- CVE details reflect disclosures through mid-2026 and include exact patched versions above; new SSR advisories may
  appear. Subscribe to Angular's security channel and keep dependencies patched.
- The resource/httpResource APIs and their SSR behavior have been evolving (developer preview to stable across v19-v21);
  confirm the exact status and serialization behavior in your version before relying on synchronous transfer-state
  resolution.
