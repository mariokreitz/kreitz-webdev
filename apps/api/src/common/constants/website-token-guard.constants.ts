// WHY: 5 minutes bounds the DB write rate for a single token's lastUsedAt to at most once per debounce window, while keeping "last seen" recent enough to be operationally useful.
export const WEBSITE_TOKEN_LAST_USED_DEBOUNCE_MS = 5 * 60 * 1000;
