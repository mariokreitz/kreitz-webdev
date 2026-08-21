# SMTP Migration: SendGrid → Resend

Both SendGrid and Resend support SMTP for sending emails.

## Configuration Comparison

| Setting    | SendGrid              | Resend                      |
| ---------- | --------------------- | --------------------------- |
| Host       | `smtp.sendgrid.net`   | `smtp.resend.com`           |
| Port       | 25, 465, 587, or 2525 | 25, 465, 587, 2465, or 2587 |
| Username   | The string `apikey`   | The string `resend`         |
| Password   | SendGrid API key      | Resend API key              |
| Encryption | Plain, SSL, or TLS    | SMTPS or STARTTLS           |

## Key Differences

- Resend supports port 2465 and 2587; SendGrid does not support 2465
- Resend uses `resend` as the fixed username; SendGrid uses `apikey`
- SendGrid supports `X-SMTPAPI` header for customizations — not applicable in Resend (use the REST API for advanced options)

## Port and Encryption

| Port | Protocol               | `secure` (Nodemailer)            |
| ---- | ---------------------- | -------------------------------- |
| 465  | SMTPS (SSL)            | `true`                           |
| 587  | STARTTLS               | `false` (upgrades automatically) |
| 25   | STARTTLS               | `false`                          |
| 2465 | SMTPS (Resend only)    | `true`                           |
| 2587 | STARTTLS (Resend only) | `false`                          |

Prefer port **465 (SMTPS)** for new setups — it establishes encryption immediately. Use port **587** if your environment blocks 465.

## Example: Nodemailer (Node.js)

```js
// SendGrid SMTP (port 587, STARTTLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Resend SMTP — port 465 (SMTPS, recommended)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

// Resend SMTP — port 587 (STARTTLS, if 465 is blocked)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 587,
  secure: false,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});
```

## Note

For new integrations, prefer the Resend REST API or SDK over SMTP — it provides better error handling, request logging, and idempotency key support.
