function toHostname(candidate: string): string {
  try {
    return new URL(candidate).hostname;
  } catch {
    return candidate;
  }
}

export function resolveAllowedHosts(port: number): string[] {
  const configuredHosts = process.env['NG_ALLOWED_HOSTS'] || process.env['APP_BASE_URL'];
  const parsedHosts: string[] = [];

  if (configuredHosts) {
    parsedHosts.push(
      ...configuredHosts
        .split(',')
        .map((host) => toHostname(host.trim()))
        .filter(Boolean),
    );
  }

  const defaultLocalHosts = [
    'localhost',
    `localhost:${port}`,
    '127.0.0.1',
    `127.0.0.1:${port}`,
    '[::1]',
    `[::1]:${port}`,
  ];

  return Array.from(new Set([...defaultLocalHosts, ...parsedHosts]));
}
