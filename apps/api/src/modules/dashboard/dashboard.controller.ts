import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

import { DashboardService } from './dashboard.service';
import { DomainsSummaryResponse } from './dto/domains-summary.response';

@ApiTags('Dashboard')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('domains-summary')
  @ApiOperation({ summary: "Get the current user's domain summary (total and verified counts)" })
  @ApiResponse({ status: 200, description: 'Domains summary for the current user', type: DomainsSummaryResponse })
  public async getDomainsSummary(@Session() session: UserSession): Promise<DomainsSummaryResponse> {
    const summary = await this.dashboardService.getDomainsSummaryForUser(session.user.id);

    return DomainsSummaryResponse.fromRecord(summary);
  }
}
