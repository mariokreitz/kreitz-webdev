import type { Environment } from './types/environment';

export const environment: Environment = {
  production: false,
  api: {
    authBaseUrl: 'http://localhost:3000',
    kreitzWebdev: 'http://localhost:3000/api',
  },
};
