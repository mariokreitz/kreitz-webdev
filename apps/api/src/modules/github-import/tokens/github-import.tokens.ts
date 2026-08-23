export const GITHUB_ACCOUNT_REPOSITORY = Symbol('GITHUB_ACCOUNT_REPOSITORY');

// Aliases AuthService behind a local token so github-import.service.ts only needs a type-only
// import of the (ESM-only) @thallesp/nestjs-better-auth package — keeps it requirable under CJS Jest.
export const GITHUB_AUTH_SERVICE = Symbol('GITHUB_AUTH_SERVICE');
