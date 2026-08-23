import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../../constants/response.constants';
import { ResponseMessage } from '../response-message.decorator';

describe('ResponseMessage', () => {
  it('attaches the message under RESPONSE_MESSAGE_KEY, readable via Reflector', () => {
    function handler(): void {
      return undefined;
    }

    ResponseMessage('Project created')(handler);

    const reflector = new Reflector();
    const message = reflector.get<string>(RESPONSE_MESSAGE_KEY, handler);

    expect(message).toBe('Project created');
  });
});
