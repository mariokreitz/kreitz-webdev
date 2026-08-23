import { GithubAccountRepository } from '@app/database/repositories/github-account.repository';
import { ProjectModule } from '@app/modules/project/project.module';
import { Module } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';

import { GithubApiService } from './github-api.service';
import { GithubImportController } from './github-import.controller';
import { GithubImportService } from './github-import.service';
import { GITHUB_ACCOUNT_REPOSITORY, GITHUB_AUTH_SERVICE } from './tokens/github-import.tokens';

@Module({
  imports: [ProjectModule],
  controllers: [GithubImportController],
  providers: [
    GithubImportService,
    GithubApiService,
    {
      provide: GITHUB_ACCOUNT_REPOSITORY,
      useClass: GithubAccountRepository,
    },
    {
      provide: GITHUB_AUTH_SERVICE,
      useExisting: AuthService,
    },
  ],
  exports: [GithubImportService],
})
export class GithubImportModule {}
