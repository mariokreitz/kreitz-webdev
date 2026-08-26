export interface SendMailInput {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly replyTo?: string;
}

export interface SendVerificationEmailInput {
  readonly to: string;
  readonly url: string;
}

export interface SendExistingAccountNoticeInput {
  readonly to: string;
}

export interface SendContactFormMessageInput {
  readonly to: string;
  readonly fromName: string;
  readonly fromEmail: string;
  readonly message: string;
}
