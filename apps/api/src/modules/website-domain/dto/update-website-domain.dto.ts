import { CreateWebsiteDomainDto } from '@app/modules/website-domain/dto/create-website-domain.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateWebsiteDomainDto extends PartialType(CreateWebsiteDomainDto) {}
