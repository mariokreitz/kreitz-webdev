import { redisConfig } from '@app/config';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
