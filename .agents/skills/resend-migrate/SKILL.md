---
name: resend-migrate
description: Use when migrating from SendGrid, Mailgun, or Postmark to Resend - detects @sendgrid/mail, sgMail, SENDGRID_API_KEY, mailgun, postmark imports and routes to the appropriate provider migration sub-skill.
license: MIT
metadata:
  author: resend
  version: '1.0.0'
  homepage: https://resend.com/migrate
  source: https://github.com/resend/resend-migration-skills
inputs:
  - name: RESEND_API_KEY
    description: Resend API key for sending emails. Get yours at https://resend.com/api-keys
    required: true
---

# Resend Migration Skills

## Overview

This skill routes to provider-specific migration sub-skills for switching from another email platform to Resend.

## Sub-Skills

| Provider     | Skill              | Detection Patterns                                                                                              |
| ------------ | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **SendGrid** | `migrate-sendgrid` | `@sendgrid/mail`, `sgMail`, `SENDGRID_API_KEY`, `sendgrid-ruby`, `sendgrid-go`, `sendgrid-java`, `sendgrid-php` |

## Quick Routing

**Migrating from SendGrid?** Use `migrate-sendgrid` skill

- Automated conversion tool at [resend.com/migrate/sendgrid](https://resend.com/migrate/sendgrid)
- SDK mapping for Node.js, Python, Ruby, Go, PHP, Java, .NET, Elixir, cURL
- SMTP config, webhook event mapping, feature differences

## Resources

- [Resend Migration Guide](https://resend.com/migrate)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Dashboard](https://resend.com)
