import type { UpdateSocialLinkData } from '@app/database/types/social-link.types';
import { PartialType } from '@nestjs/swagger';
import { CreateSocialLinkDto } from './create-social-link.dto';

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {
  public toUpdateSocialLinkData(): UpdateSocialLinkData {
    return {
      ...(this.platform !== undefined && { platform: this.platform }),
      ...(this.label !== undefined && { label: this.label }),
      ...(this.url !== undefined && { url: this.url }),
      ...(this.sortOrder !== undefined && { sortOrder: this.sortOrder }),
    };
  }
}
