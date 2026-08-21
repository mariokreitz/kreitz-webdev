import type { Environment } from './types/environment';

export const environment: Environment = {
  production: true,
  api: {
    authBaseUrl: 'http://localhost:3000',
    kreitzWebdev: 'http://localhost:3000/api',
  },
};
