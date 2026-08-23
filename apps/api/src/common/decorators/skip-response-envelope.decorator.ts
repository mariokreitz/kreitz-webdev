import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { SKIP_RESPONSE_ENVELOPE_KEY } from '../constants/response.constants';

export const SkipResponseEnvelope = (): CustomDecorator => SetMetadata(SKIP_RESPONSE_ENVELOPE_KEY, true);
