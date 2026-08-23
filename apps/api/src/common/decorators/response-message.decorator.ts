import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { RESPONSE_MESSAGE_KEY } from '../constants/response.constants';

export const ResponseMessage = (message: string): CustomDecorator => SetMetadata(RESPONSE_MESSAGE_KEY, message);
