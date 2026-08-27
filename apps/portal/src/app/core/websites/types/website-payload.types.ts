export interface CreateWebsitePayload {
  readonly name: string;
  readonly url: string;
}

export interface UpdateWebsitePayload {
  readonly name?: string;
  readonly url?: string;
  readonly enabled?: boolean;
  readonly contactEmail?: string | null;
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

export interface CreateCompanyPayload {
  readonly name: string;
  readonly role?: string;
  readonly logoUrl?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly sortOrder?: number;
}

export interface UpdateCompanyPayload {
  readonly name?: string;
  readonly role?: string;
  readonly logoUrl?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly sortOrder?: number;
}

export interface CreateSocialLinkPayload {
  readonly platform: string;
  readonly label?: string;
  readonly url: string;
  readonly sortOrder?: number;
}

export interface UpdateSocialLinkPayload {
  readonly platform?: string;
  readonly label?: string;
  readonly url?: string;
  readonly sortOrder?: number;
}
