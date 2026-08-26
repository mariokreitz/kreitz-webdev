import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import { CompanyService } from '@app/modules/company/company.service';
import { CreateCompanyDto } from '@app/modules/company/dto/create-company.dto';
import { CompanyDto } from '@app/modules/company/dto/company.dto';
import { UpdateCompanyDto } from '@app/modules/company/dto/update-company.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Companies')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('websites/:websiteId/companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies for a website' })
  @ApiResponse({ status: 200, description: 'Companies for the website', type: CompanyDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async getAll(@Param('websiteId') websiteId: string, @Session() session: UserSession): Promise<CompanyDto[]> {
    const companies = await this.companyService.getAllForUser(websiteId, session.user.id);

    return companies.map((company) => CompanyDto.fromRecord(company));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company belonging to a website' })
  @ApiResponse({ status: 200, description: 'The requested company', type: CompanyDto })
  @ApiResponse({ status: 404, description: 'Website or company not found' })
  public async getById(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<CompanyDto> {
    const company = await this.companyService.getByIdForUser(websiteId, id, session.user.id);

    return CompanyDto.fromRecord(company);
  }

  @Post()
  @ApiOperation({ summary: 'Add a company to a website' })
  @ApiResponse({ status: 201, description: 'The created company', type: CompanyDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website not found' })
  public async create(
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateCompanyDto,
    @Session() session: UserSession,
  ): Promise<CompanyDto> {
    const created = await this.companyService.create(websiteId, session.user.id, dto.toCreateCompanyData(websiteId));

    return CompanyDto.fromRecord(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company belonging to a website' })
  @ApiResponse({ status: 200, description: 'The updated company', type: CompanyDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Website or company not found' })
  public async update(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @Session() session: UserSession,
  ): Promise<CompanyDto> {
    const updated = await this.companyService.update(websiteId, id, session.user.id, dto.toUpdateCompanyData());

    return CompanyDto.fromRecord(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company belonging to a website' })
  @ApiResponse({ status: 200, description: 'Company deleted' })
  @ApiResponse({ status: 404, description: 'Website or company not found' })
  public async delete(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.companyService.delete(websiteId, id, session.user.id);
  }
}
