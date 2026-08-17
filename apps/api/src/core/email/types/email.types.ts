export interface SendMailInput {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
}

export interface SendVerificationEmailInput {
  readonly to: string;
  readonly url: string;
}
