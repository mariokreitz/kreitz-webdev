export interface ResponseEnvelope<T> {
  readonly statusCode: number;
  readonly message: string | string[];
  readonly data: T;
}
