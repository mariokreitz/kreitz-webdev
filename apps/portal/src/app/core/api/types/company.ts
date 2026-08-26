export interface Company {
  readonly id: string;
  readonly websiteId: string;
  readonly name: string;
  readonly role: string | null;
  readonly logoUrl: string | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
