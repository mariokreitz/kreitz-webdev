export interface ParsedHttpError {
  readonly statusCode: number;
  readonly message: string;
  readonly isNetworkError: boolean;
}
