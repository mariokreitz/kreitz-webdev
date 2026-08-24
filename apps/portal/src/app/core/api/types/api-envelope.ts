export interface ApiEnvelope<T> {
  readonly statusCode: number;
  readonly message: string | string[];
  readonly data: T;
}
