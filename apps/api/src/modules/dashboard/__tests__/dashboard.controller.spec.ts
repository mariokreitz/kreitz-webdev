import type { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import { DashboardController } from '../dashboard.controller';
import type { DashboardService } from '../dashboard.service';

interface MockedDashboardService {
  getDomainsSummaryForUser: jest.Mock;
}

function buildSession(userId = 'user-a'): UserSession {
  return { user: { id: userId } } as unknown as UserSession;
}

function buildController(): { controller: DashboardController; dashboardService: MockedDashboardService } {
  const dashboardService: MockedDashboardService = {
    getDomainsSummaryForUser: jest.fn(),
  };

  const controller = new DashboardController(dashboardService as unknown as DashboardService);

  return { controller, dashboardService };
}

describe('DashboardController', () => {
  describe('getDomainsSummary', () => {
    it('delegates to the service with the session user id', async () => {
      const { controller, dashboardService } = buildController();
      const record: WebsiteDomainSummaryRecord = { total: 5, verified: 3 };
      dashboardService.getDomainsSummaryForUser.mockResolvedValue(record);

      await controller.getDomainsSummary(buildSession('user-a'));

      expect(dashboardService.getDomainsSummaryForUser).toHaveBeenCalledWith('user-a');
    });

    it('maps the service record to a DomainsSummaryResponse', async () => {
      const { controller, dashboardService } = buildController();
      const record: WebsiteDomainSummaryRecord = { total: 5, verified: 3 };
      dashboardService.getDomainsSummaryForUser.mockResolvedValue(record);

      const result = await controller.getDomainsSummary(buildSession('user-a'));

      expect(result).toEqual({ total: 5, verified: 3 });
    });

    it('never delegates with a userId other than the one on the session', async () => {
      const { controller, dashboardService } = buildController();
      dashboardService.getDomainsSummaryForUser.mockResolvedValue({ total: 0, verified: 0 });

      await controller.getDomainsSummary(buildSession('user-b'));

      expect(dashboardService.getDomainsSummaryForUser).not.toHaveBeenCalledWith('user-a');
    });
  });
});
