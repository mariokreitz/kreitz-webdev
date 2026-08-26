export interface PublicCompanyRecord {
  id: string;
  name: string;
  role: string | null;
  logoUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
}
