import { CoreModule } from '@app/core/core.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { WebsiteModule } from '@app/modules/website/website.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [CoreModule, ProjectModule, WebsiteModule],
})
export class ApiModule {}
