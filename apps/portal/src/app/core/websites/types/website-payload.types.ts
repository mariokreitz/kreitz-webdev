export interface CreateWebsitePayload {
  readonly name: string;
  readonly url: string;
}

export interface UpdateWebsitePayload {
  readonly name?: string;
  readonly url?: string;
  readonly enabled?: boolean;
}

export interface CreateWebsiteDomainPayload {
  readonly domain: string;
}

export interface UpdateWebsiteDomainPayload {
  readonly domain?: string;
}

export interface CreateWebsiteTokenPayload {
  readonly name: string;
  readonly expiresAt?: string;
}

export interface CreateWebsiteProjectLinkPayload {
  readonly projectId: string;
  readonly published?: boolean;
  readonly sortOrder?: number;
}

export interface UpdateWebsiteProjectLinkPayload {
  readonly published?: boolean;
  readonly sortOrder?: number;
}
