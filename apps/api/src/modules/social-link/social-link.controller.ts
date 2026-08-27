import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { SocialLinkService } from '@app/modules/social-link/social-link.service';
import { CreateSocialLinkDto } from '@app/modules/social-link/dto/create-social-link.dto';
import { SocialLinkDto } from '@app/modules/social-link/dto/social-link.dto';
import { UpdateSocialLinkDto } from '@app/modules/social-link/dto/update-social-link.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Social Links')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('websites/:websiteId/social-links')
export class SocialLinkController {
  constructor(private readonly socialLinkService: SocialLinkService) {}

  @Get()
  @ApiOperation({ summary: 'Get all social links for a website' })
  @ApiResponse({ status: 200, description: 'Social links for the website', type: SocialLinkDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<SocialLinkDto[]> {
    const socialLinks = await this.socialLinkService.getAllForUser(websiteId, session.user.id);

    return socialLinks.map((socialLink) => SocialLinkDto.fromRecord(socialLink));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a social link belonging to a website' })
  @ApiResponse({ status: 200, description: 'The requested social link', type: SocialLinkDto })
  @ApiResponse({ status: 404, description: 'Website or social link not found' })
  public async getById(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<SocialLinkDto> {
    const socialLink = await this.socialLinkService.getByIdForUser(websiteId, id, session.user.id);

    return SocialLinkDto.fromRecord(socialLink);
  }

  @Post()
  @ApiOperation({ summary: 'Add a social link to a website' })
  @ApiResponse({ status: 201, description: 'The created social link', type: SocialLinkDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateSocialLinkDto,
    @Session() session: UserSession,
  ): Promise<SocialLinkDto> {
    const created = await this.socialLinkService.create(
      websiteId,
      session.user.id,
      dto.toCreateSocialLinkData(websiteId),
    );

    return SocialLinkDto.fromRecord(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a social link belonging to a website' })
  @ApiResponse({ status: 200, description: 'The updated social link', type: SocialLinkDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or social link not found' })
  public async update(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSocialLinkDto,
    @Session() session: UserSession,
  ): Promise<SocialLinkDto> {
    const updated = await this.socialLinkService.update(websiteId, id, session.user.id, dto.toUpdateSocialLinkData());

    return SocialLinkDto.fromRecord(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a social link belonging to a website' })
  @ApiResponse({ status: 200, description: 'Social link deleted' })
  @ApiResponse({ status: 404, description: 'Website or social link not found' })
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.socialLinkService.delete(websiteId, id, session.user.id);
  }
}
