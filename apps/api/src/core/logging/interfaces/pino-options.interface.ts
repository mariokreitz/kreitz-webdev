import type { LogFormat } from '../types/log-format.types';

export interface CreatePinoHttpOptionsParams {
  readonly logLevel: string;
  readonly logFormat: LogFormat;
}

export interface LoggedRequest {
  readonly id: string | undefined;
  readonly method: string;
  readonly url: string | undefined;
  readonly remoteAddress: string | undefined;
}

export interface LoggedResponse {
  readonly statusCode: number;
}
