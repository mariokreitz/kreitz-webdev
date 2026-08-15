import { CommonModule } from '@app/common/common.module';
import { CoreModule } from '@app/core/core.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [CoreModule, CommonModule],
})
export class ApiModule {}
