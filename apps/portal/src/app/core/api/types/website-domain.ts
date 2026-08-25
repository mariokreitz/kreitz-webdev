export interface WebsiteDomain {
  readonly id: string;
  readonly websiteId: string;
  readonly domain: string;
  readonly verified: boolean;
  readonly verifiedAt: string | null;
  readonly verificationToken: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type DomainVerificationFailureReason =
  | 'unreachable'
  | 'blocked_target'
  | 'redirected'
  | 'file_not_found'
  | 'token_mismatch';

export interface DomainVerificationResult {
  readonly id: string;
  readonly websiteId: string;
  readonly domain: string;
  readonly verified: boolean;
  readonly verifiedAt: string | null;
  readonly failureReason: DomainVerificationFailureReason | null;
}
