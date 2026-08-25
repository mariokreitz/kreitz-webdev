import { Injectable } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { BlockList } from 'node:net';

const WELL_KNOWN_PATH = '/.well-known/kreitz-verify.txt';
const FETCH_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 8192;

export type DomainVerificationOutcome =
  | { readonly matched: true }
  | {
      readonly matched: false;
      readonly reason: 'unreachable' | 'blocked_target' | 'redirected' | 'file_not_found' | 'token_mismatch';
    };

function buildBlockedTargetList(): BlockList {
  const blockList = new BlockList();

  blockList.addSubnet('0.0.0.0', 8, 'ipv4');
  blockList.addSubnet('127.0.0.0', 8, 'ipv4');
  blockList.addSubnet('10.0.0.0', 8, 'ipv4');
  blockList.addSubnet('172.16.0.0', 12, 'ipv4');
  blockList.addSubnet('192.168.0.0', 16, 'ipv4');
  blockList.addSubnet('169.254.0.0', 16, 'ipv4');
  blockList.addAddress('::1', 'ipv6');
  blockList.addSubnet('fc00::', 7, 'ipv6');
  blockList.addSubnet('fe80::', 10, 'ipv6');

  return blockList;
}

const BLOCKED_TARGETS = buildBlockedTargetList();

@Injectable()
export class DomainVerificationService {
  public async checkToken(domain: string, expectedToken: string): Promise<DomainVerificationOutcome> {
    const targetIsBlocked = await this.resolvesToBlockedTarget(domain);

    if (targetIsBlocked) {
      return { matched: false, reason: 'blocked_target' };
    }

    const response = await this.fetchWellKnownFile(domain);

    if (!response) {
      return { matched: false, reason: 'unreachable' };
    }

    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      return { matched: false, reason: 'redirected' };
    }

    if (response.status === 404) {
      return { matched: false, reason: 'file_not_found' };
    }

    if (!response.ok) {
      return { matched: false, reason: 'unreachable' };
    }

    const body = (await this.readBoundedBody(response)).trim();

    if (body !== expectedToken) {
      return { matched: false, reason: 'token_mismatch' };
    }

    return { matched: true };
  }

  private async resolvesToBlockedTarget(domain: string): Promise<boolean> {
    // WHY: this is a deliberate, scoped SSRF boundary (blocks cloud metadata endpoints like 169.254.169.254 among other private/reserved targets), not full mitigation — there's a DNS-rebinding gap between this check and the fetch below; full IP-pinning would need a custom fetch dispatcher, out of scope here.
    try {
      const addresses = await lookup(domain, { all: true });

      return addresses.some((address) =>
        BLOCKED_TARGETS.check(address.address, address.family === 6 ? 'ipv6' : 'ipv4'),
      );
    } catch {
      return false;
    }
  }

  private async fetchWellKnownFile(domain: string): Promise<Response | null> {
    try {
      return await fetch(`https://${domain}${WELL_KNOWN_PATH}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return null;
    }
  }

  private async readBoundedBody(response: Response): Promise<string> {
    const body = response.body;

    if (!body) {
      return '';
    }

    const reader: ReadableStreamDefaultReader<Uint8Array> = body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      while (receivedBytes < MAX_BODY_BYTES) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        chunks.push(value);
        receivedBytes += value.length;
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }

    return Buffer.concat(chunks).subarray(0, MAX_BODY_BYTES).toString('utf8');
  }
}
