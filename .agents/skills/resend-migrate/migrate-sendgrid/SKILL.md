---
name: migrate-sendgrid
description: Use when migrating SendGrid email integration to Resend - detects @sendgrid/mail, sgMail, sendgrid-ruby, sendgrid-go, sendgrid-java, sendgrid-php, or SENDGRID_API_KEY patterns.
license: MIT
metadata:
  author: resend
  version: '1.0.0'
  homepage: https://resend.com/migrate/sendgrid
  source: https://github.com/resend/resend-migration-skills
inputs:
  - name: RESEND_API_KEY
    description: Resend API key. Get yours at https://resend.com/api-keys
    required: true
---

# Migrate from SendGrid to Resend

## Overview

Resend is a modern email platform for developers. This skill covers migrating SendGrid integrations to Resend across all supported SDKs.

**Automated tool:** [resend.com/migrate/sendgrid](https://resend.com/migrate/sendgrid) — paste SendGrid code and get Resend code instantly.

## Detection Patterns

Code is SendGrid if it contains any of: `@sendgrid/mail`, `sendgrid`, `SendGrid`, `SENDGRID`, `sgMail`, `sg.client`, `sendgrid-ruby`, `sendgrid-go`, `sendgrid-java`, `sendgrid-php`

## Migration Checklist

- [ ] Verify domain in [Resend Domains](https://resend.com/domains) (SPF/DKIM/DMARC)
- [ ] Create API key at [resend.com/api-keys](https://resend.com/api-keys)
- [ ] Replace env var: `SENDGRID_API_KEY` → `RESEND_API_KEY`
- [ ] Replace SDK (see [SDK Examples](./references/sdk-examples.md))
- [ ] Map webhook events (see [Webhooks](./references/webhooks.md))
- [ ] Update SMTP config if used (see [SMTP](./references/smtp.md))
- [ ] Review feature differences (see [Feature Mapping](./references/feature-mapping.md))

## Key Differences at a Glance

| Aspect             | SendGrid                                  | Resend                                  |
| ------------------ | ----------------------------------------- | --------------------------------------- |
| API endpoint       | `https://api.sendgrid.com/v3/mail/send`   | `https://api.resend.com/emails`         |
| Auth header        | `Authorization: Bearer $SENDGRID_API_KEY` | `Authorization: Bearer $RESEND_API_KEY` |
| Batch send         | `sgMail.sendMultiple()`                   | `resend.batch.send()`                   |
| Response           | `[response, body]`                        | `{ data, error }`                       |
| Idempotency        | Not supported                             | `Idempotency-Key` header or SDK option  |
| Rate limit info    | Error only                                | IETF-standard response headers          |
| Rust SDK           | No official SDK                           | `resend-rs` available                   |
| Templates          | Dynamic templates (`templateId`)          | React Email components or `html`        |
| Tracking           | Per-email `trackingSettings`              | Configured per-domain in dashboard      |
| Unsubscribe groups | `asm` field                               | Resend Topics (`topic_id`)              |
| IP pools           | `ipPoolName` field                        | Account-level in dashboard              |

## Quick Reference

| Reference                                          | Use When                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| [SDK Examples](./references/sdk-examples.md)       | Converting code for Node.js, Python, Ruby, Go, PHP, Java, .NET, Elixir, cURL |
| [SMTP](./references/smtp.md)                       | Updating SMTP hostname, port, credentials                                    |
| [Webhooks](./references/webhooks.md)               | Mapping SendGrid event types to Resend event types                           |
| [Feature Mapping](./references/feature-mapping.md) | Templates, tracking, unsubscribe groups, idempotency                         |

## Dashboard Concepts

| SendGrid              | Resend        |
| --------------------- | ------------- |
| Sender Authentication | Domains page  |
| Activity              | Emails page   |
| Dashboard (stats)     | Metrics page  |
| Event Webhook         | Webhooks page |

## Common Mistakes

| Mistake                                                         | Fix                                                                                                                          |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `asm` has "no equivalent" in Resend                             | It does — use `topic_id` field + Resend Topics. See [Feature Mapping](./references/feature-mapping.md)                       |
| Webhook `unsubscribe` maps to `email.unsubscribed`              | That event doesn't exist. Use `contact.updated`. See [Webhooks](./references/webhooks.md)                                    |
| `sendAt: unixTimestamp` copied over                             | Resend uses ISO 8601 string: `scheduledAt: new Date(...).toISOString()`                                                      |
| Expecting `[response, body]` from `resend.emails.send()`        | Resend returns `{ data, error }`                                                                                             |
| Looking for a CLI migration tool                                | The tool is a web UI: [resend.com/migrate/sendgrid](https://resend.com/migrate/sendgrid) — no CLI                            |
| `sgMail.sendMultiple()` replaced by passing array to `to` field | Wrong — `to` array sends one email to multiple recipients. `resend.batch.send()` sends multiple different emails in one call |
| `dropped` SendGrid event has no Resend equivalent               | Monitor `email.bounced` and `email.delivery_delayed` instead. See [Webhooks](./references/webhooks.md)                       |
| Resend SMTP only supports ports 465 and 587                     | Resend also supports 2465 (SMTPS) and 2587 (STARTTLS) as alternatives. See [SMTP](./references/smtp.md)                      |
| Forgot to rename env var                                        | `SENDGRID_API_KEY` → `RESEND_API_KEY`                                                                                        |

## Resources

- [Full migration guide](https://resend.com/migrate/sendgrid)
- [Resend API reference](https://resend.com/docs/api-reference)
- [React Email](https://react.email) — component-based email templates
- [Resend Broadcasts](https://resend.com/broadcasts) — for marketing/newsletter campaigns
