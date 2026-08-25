import type { IWebsiteDomainSummaryRepository } from '@app/database/interfaces/website-domain-summary.repository.interface';
import type { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';

import { DashboardService } from '../dashboard.service';

function buildRepository(record: WebsiteDomainSummaryRecord): jest.Mocked<IWebsiteDomainSummaryRepository> {
  return {
    countForUser: jest.fn().mockResolvedValue(record),
  };
}

describe('DashboardService', () => {
  describe('getDomainsSummaryForUser', () => {
    it('returns the repository result as-is, as a plain passthrough', async () => {
      const record: WebsiteDomainSummaryRecord = { total: 5, verified: 3 };
      const repository = buildRepository(record);
      const service = new DashboardService(repository);

      const result = await service.getDomainsSummaryForUser('user-a');

      expect(result).toBe(record);
    });

    it('queries the repository with exactly the given userId', async () => {
      const repository = buildRepository({ total: 0, verified: 0 });
      const service = new DashboardService(repository);

      await service.getDomainsSummaryForUser('user-a');

      expect(repository.countForUser).toHaveBeenCalledTimes(1);
      expect(repository.countForUser).toHaveBeenCalledWith('user-a');
    });

    it('never calls the repository with a userId other than the one it received', async () => {
      const repository = buildRepository({ total: 0, verified: 0 });
      const service = new DashboardService(repository);

      await service.getDomainsSummaryForUser('user-b');

      expect(repository.countForUser).not.toHaveBeenCalledWith('user-a');
    });
  });
});
