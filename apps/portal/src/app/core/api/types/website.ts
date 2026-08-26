export interface Website {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly enabled: boolean;
  readonly contactEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
