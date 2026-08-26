import { isPublicCompany, type PublicCompany } from '../../pages/home/public-company.model';
import { isPublicProject, type PublicProject } from '../../pages/home/public-project.model';

export interface HomeRequestContext {
  readonly projects: readonly PublicProject[];
  readonly companies: readonly PublicCompany[];
  readonly cvAvailable: boolean;
}

export function asHomeRequestContext(value: unknown): HomeRequestContext | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  const { projects, companies, cvAvailable } = value as Record<string, unknown>;

  if (
    Array.isArray(projects) &&
    projects.every(isPublicProject) &&
    Array.isArray(companies) &&
    companies.every(isPublicCompany) &&
    typeof cvAvailable === 'boolean'
  ) {
    return { projects, companies, cvAvailable };
  }

  return null;
}
