import type { CreateCompanyData, UpdateCompanyData } from '@app/database/types/company.types';
import type { CompanyDto } from '@app/modules/company/dto/company.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import type { CreateCompanyDto } from '../dto/create-company.dto';
import type { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyController } from '../company.controller';
import type { CompanyService } from '../company.service';

interface MockedCompanyService {
  getAllForUser: jest.Mock;
  getByIdForUser: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function buildSession(userId = 'user-a'): UserSession {
  return { user: { id: userId } } as unknown as UserSession;
}

function buildController(): {
  controller: CompanyController;
  companyService: MockedCompanyService;
} {
  const companyService: MockedCompanyService = {
    getAllForUser: jest.fn(),
    getByIdForUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const controller = new CompanyController(companyService as unknown as CompanyService);

  return { controller, companyService };
}

function buildCompanyDto(overrides: Partial<CompanyDto> = {}): CompanyDto {
  return {
    id: 'company-a',
    websiteId: 'website-a',
    name: 'Acme Corp',
    role: 'Senior Software Engineer',
    logoUrl: 'https://example.com/acme-logo.png',
    startDate: new Date('2022-01-01T00:00:00.000Z'),
    endDate: null,
    sortOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CompanyController', () => {
  describe('getAll', () => {
    it('delegates to the service with the websiteId param and the session user id, then maps records to dtos', async () => {
      const { controller, companyService } = buildController();
      const company = buildCompanyDto();
      companyService.getAllForUser.mockResolvedValue([company]);

      const result = await controller.getAll('website-a', buildSession('user-a'));

      expect(companyService.getAllForUser).toHaveBeenCalledWith('website-a', 'user-a');
      expect(result).toEqual([company]);
    });
  });

  describe('getById', () => {
    it('delegates to the service with websiteId, id, and the session user id', async () => {
      const { controller, companyService } = buildController();
      const company = buildCompanyDto();
      companyService.getByIdForUser.mockResolvedValue(company);

      const result = await controller.getById('website-a', 'company-a', buildSession('user-a'));

      expect(companyService.getByIdForUser).toHaveBeenCalledWith('website-a', 'company-a', 'user-a');
      expect(result).toEqual(company);
    });
  });

  describe('create', () => {
    it('delegates to the service with the mapped create data and the session user id', async () => {
      const { controller, companyService } = buildController();
      const company = buildCompanyDto();
      companyService.create.mockResolvedValue(company);

      const dto: CreateCompanyDto = { name: 'Acme Corp' } as CreateCompanyDto;
      dto.toCreateCompanyData = (websiteId: string): CreateCompanyData => ({ websiteId, name: 'Acme Corp' });

      const result = await controller.create('website-a', dto, buildSession('user-a'));

      expect(companyService.create).toHaveBeenCalledWith('website-a', 'user-a', {
        websiteId: 'website-a',
        name: 'Acme Corp',
      });
      expect(result).toEqual(company);
    });
  });

  describe('update', () => {
    it('delegates to the service with websiteId, id, the session user id, and the mapped update data', async () => {
      const { controller, companyService } = buildController();
      const company = buildCompanyDto({ name: 'New Name' });
      companyService.update.mockResolvedValue(company);

      const dto: UpdateCompanyDto = {} as UpdateCompanyDto;
      dto.toUpdateCompanyData = (): UpdateCompanyData => ({ name: 'New Name' });

      const result = await controller.update('website-a', 'company-a', dto, buildSession('user-a'));

      expect(companyService.update).toHaveBeenCalledWith('website-a', 'company-a', 'user-a', { name: 'New Name' });
      expect(result).toEqual(company);
    });
  });

  describe('delete', () => {
    it('delegates to the service with websiteId, id, and the session user id', async () => {
      const { controller, companyService } = buildController();
      companyService.delete.mockResolvedValue(undefined);

      await controller.delete('website-a', 'company-a', buildSession('user-a'));

      expect(companyService.delete).toHaveBeenCalledWith('website-a', 'company-a', 'user-a');
    });
  });
});
