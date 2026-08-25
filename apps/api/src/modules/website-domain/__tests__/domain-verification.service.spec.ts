import { lookup } from 'node:dns/promises';

import { DomainVerificationService } from '../domain-verification.service';

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

const mockLookup = lookup as unknown as jest.Mock<
  Promise<{ address: string; family: number }[]>,
  [string, { all: boolean }]
>;

function buildBodyStream(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let sent = false;

  return new ReadableStream<Uint8Array>({
    pull(controller): void {
      if (sent) {
        controller.close();
        return;
      }

      controller.enqueue(bytes);
      sent = true;
    },
  });
}

function buildResponse(overrides: Partial<Response> & { bodyText?: string } = {}): Response {
  const { bodyText, ...rest } = overrides;

  return {
    ok: true,
    status: 200,
    type: 'basic',
    body: bodyText === undefined ? null : buildBodyStream(bodyText),
    ...rest,
  } as unknown as Response;
}

describe('DomainVerificationService', () => {
  beforeEach(() => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkToken', () => {
    it('returns matched: true when the response body equals the expected token exactly', async () => {
      const service = new DomainVerificationService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ bodyText: 'expected-token-value' }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: true });
    });

    it('returns token_mismatch when the response body does not equal the expected token', async () => {
      const service = new DomainVerificationService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ bodyText: 'some-other-value' }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'token_mismatch' });
    });

    it('returns unreachable when the underlying fetch rejects', async () => {
      const service = new DomainVerificationService();

      jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'unreachable' });
    });

    it('returns file_not_found on a 404 response', async () => {
      const service = new DomainVerificationService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 404 }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'file_not_found' });
    });

    it('returns unreachable on a generic non-ok, non-404 response', async () => {
      const service = new DomainVerificationService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 500 }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'unreachable' });
    });

    it('returns redirected for a manual-redirect opaqueredirect response', async () => {
      const service = new DomainVerificationService();

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ ok: false, status: 0, type: 'opaqueredirect' }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'redirected' });
    });

    it('returns blocked_target and never calls fetch when the domain resolves to a private/loopback/link-local address', async () => {
      const service = new DomainVerificationService();

      mockLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);

      const fetchSpy = jest.spyOn(global, 'fetch');

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'blocked_target' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns blocked_target and never calls fetch when the domain resolves to a 0.0.0.0/8 address', async () => {
      const service = new DomainVerificationService();

      mockLookup.mockResolvedValue([{ address: '0.1.2.3', family: 4 }]);

      const fetchSpy = jest.spyOn(global, 'fetch');

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'blocked_target' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('treats a DNS lookup failure as not blocked and still attempts the fetch', async () => {
      const service = new DomainVerificationService();

      mockLookup.mockRejectedValue(new Error('ENOTFOUND'));
      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ bodyText: 'expected-token-value' }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: true });
    });

    it('reads at most the 8192-byte cap from an oversized body without hanging, then compares the truncated result', async () => {
      const service = new DomainVerificationService();

      const body = new ReadableStream<Uint8Array>({
        pull(controller): void {
          controller.enqueue(new Uint8Array(4096).fill(97));
        },
      });

      jest.spyOn(global, 'fetch').mockResolvedValue(buildResponse({ body }));

      const outcome = await service.checkToken('example.com', 'expected-token-value');

      expect(outcome).toEqual({ matched: false, reason: 'token_mismatch' });
    });
  });
});
