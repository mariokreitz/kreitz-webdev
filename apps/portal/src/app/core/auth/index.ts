export { AuthService } from './auth.service';
export { authGuard } from './guards/auth.guard';
export { guestGuard } from './guards/guest.guard';
export { DASHBOARD_ROUTE, LOGIN_ROUTE, LOGOUT_ROUTE } from './constants';
export type { AuthResult, AuthClient, SessionData, SocialAuthResult, UserProfile } from './types/auth.types';
