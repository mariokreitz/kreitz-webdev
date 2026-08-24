import type { ImageLoaderConfig } from '@angular/common';

const GITHUB_AVATAR_HOST = 'avatars.githubusercontent.com';

export function avatarImageLoader(config: ImageLoaderConfig): string {
  if (!config.width) {
    return config.src;
  }

  const url = new URL(config.src);
  if (url.hostname !== GITHUB_AVATAR_HOST) {
    return config.src;
  }

  url.searchParams.set('s', String(config.width));
  return url.toString();
}
