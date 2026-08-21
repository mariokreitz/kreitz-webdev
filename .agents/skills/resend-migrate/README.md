# Resend Migration Skill

Agent skills for migrating from another email platform to [Resend](https://resend.com).

When loaded, these skills give AI agents accurate, up-to-date guidance for converting SendGrid (and soon Mailgun, Postmark) integrations to the Resend SDK — including code examples for every supported language, webhook event mappings, SMTP config, and feature differences.

## Usage

Install via the command below or copy the skill directory into your agent's skills folder.

```bash
npx skills add resend/resend-migration-skill
```

The skill is triggered automatically when an agent detects a migration to Resend from any of the supported providers.

## Migration Guides

Full migration documentation is available at [resend.com/migrate](https://resend.com/migrate):

| From     | Guide                                                              | Automated Converter            |
| -------- | ------------------------------------------------------------------ | ------------------------------ |
| SendGrid | [resend.com/migrate/sendgrid](https://resend.com/migrate/sendgrid) | ✅ Paste code, get Resend code |
| Mailgun  | [resend.com/migrate/mailgun](https://resend.com/migrate/mailgun)   | Coming soon                    |
| Postmark | [resend.com/migrate/postmark](https://resend.com/migrate/postmark) | Coming soon                    |

## Skills

### `resend-migrate` (root skill)

The entry point. Routes to the right sub-skill based on detected provider patterns in the code.

### `migrate-sendgrid`

Covers the full SendGrid → Resend migration:

- **SDK Examples** — before/after code for Node.js, Python, Ruby, Go, PHP, Java, .NET, Elixir, and cURL
- **SMTP** — host, port, username, and encryption changes
- **Webhooks** — SendGrid event names mapped to Resend equivalents (e.g. `spamreport` → `email.complained`, `unsubscribe` → `contact.updated`)
- **Feature Mapping** — templates, unsubscribe groups (ASM → Topics), tracking settings, IP pools, scheduling, idempotency keys

## Related

- [resend-skills](https://github.com/resend/resend-skills) — skills for sending, receiving, and managing email with Resend
- [React Email](https://react.email) — component-based email templates (replaces SendGrid dynamic templates in Node.js)
- [Resend Docs](https://resend.com/docs)
