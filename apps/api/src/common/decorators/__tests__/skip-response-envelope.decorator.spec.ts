import { Reflector } from '@nestjs/core';
import { SKIP_RESPONSE_ENVELOPE_KEY } from '../../constants/response.constants';
import { SkipResponseEnvelope } from '../skip-response-envelope.decorator';

describe('SkipResponseEnvelope', () => {
  it('marks the target with SKIP_RESPONSE_ENVELOPE_KEY, readable via Reflector', () => {
    @SkipResponseEnvelope()
    class TestController {}

    const reflector = new Reflector();
    const skip = reflector.get<boolean>(SKIP_RESPONSE_ENVELOPE_KEY, TestController);

    expect(skip).toBe(true);
  });
});
