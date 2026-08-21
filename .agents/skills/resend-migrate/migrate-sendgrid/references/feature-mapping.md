# Feature Mapping: SendGrid → Resend

## Templates

| SendGrid                                                 | Resend                                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Dynamic templates (`templateId` + `dynamicTemplateData`) | [React Email](https://react.email) components (Node.js) or `html` with string interpolation (all languages) |
| Handlebars syntax in templates                           | JSX in React Email, or plain `html`                                                                         |

**Node.js — React Email (recommended):**

```jsx
import { Resend } from 'resend';
import { WelcomeEmail } from './emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'from@example.com',
  to: 'to@example.com',
  subject: 'Welcome',
  react: <WelcomeEmail username="Alice" />,
});
```

**Python / Ruby / Go / PHP / Java / .NET — string interpolation:**

React Email is Node.js only. For other languages, build the HTML string before sending:

```python
# Python — f-string or Jinja2
html = f"<p>Welcome, {username}!</p>"
resend.Emails.send({"from": ..., "to": ..., "subject": ..., "html": html})
```

```go
// Go — fmt.Sprintf
html := fmt.Sprintf("<p>Welcome, %s!</p>", username)
```

## Unsubscribe Groups (ASM)

| SendGrid                              | Resend                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `asm.groupId` + `asm.groupsToDisplay` | [Resend Topics](https://resend.com/docs/dashboard/contacts/topics) — set `topicId` on email |
| Subscription management per group     | Subscription management per topic                                                           |

**Setting `topic_id` on an email:**

```js
// Node.js — topic_id is a direct field on the send params
await resend.emails.send({
  from: 'from@example.com',
  to: 'to@example.com',
  subject: 'Weekly newsletter',
  html: '<p>Hello</p>',
  topic_id: 'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
});
```

```python
# Python
resend.Emails.send({
    "from": "from@example.com",
    "to": ["to@example.com"],
    "subject": "Weekly newsletter",
    "html": "<p>Hello</p>",
    "topic_id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
})
```

How delivery works with `topic_id`:

- Contact opted in → email is sent
- Contact opted out → email is skipped (not an error)
- Not a contact → sent only if topic's default subscription is `opt_in`

**Managing subscriptions:**

```js
// Opt a contact in/out of a topic
await resend.contacts.topics.update({
  email: 'user@example.com',
  topics: [{ id: 'b6d24b8e-af0b-4c3c-be0c-359bbd97381e', subscription: 'opt_out' }],
});
```

> Create topics first in the [Resend Dashboard → Contacts → Topics](https://resend.com/contacts). The `unsubscribe` SendGrid event maps to `contact.updated` in Resend webhooks.

## Tracking

| SendGrid                                          | Resend                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `trackingSettings.clickTracking` per email        | Click tracking configured per-domain in [Resend Dashboard](https://resend.com/domains) |
| `trackingSettings.openTracking` per email         | Open tracking configured per-domain in dashboard                                       |
| `trackingSettings.subscriptionTracking` per email | Use Resend Topics for subscription management                                          |

## IP Pools

| SendGrid               | Resend                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| `ipPoolName` per email | IP management handled at the account level — contact Resend support |

## Custom Arguments

| SendGrid                           | Resend                                           |
| ---------------------------------- | ------------------------------------------------ |
| `customArgs` (arbitrary key-value) | `tags` (array of `{ name, value }`) or `headers` |

## Sandbox / Testing

| SendGrid                             | Resend                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `mailSettings.sandboxMode` per email | Configured at account level; use test domains for development |

## Scheduling

| SendGrid                  | Resend                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `sendAt` (unix timestamp) | `scheduledAt` (ISO 8601 string, e.g. `"2025-06-01T09:00:00Z"`)      |
| Cancel not available      | `resend.emails.cancel(id)` — cancel scheduled emails                |
| Reschedule not available  | `resend.emails.update(id, { scheduledAt })` — update scheduled time |

## Batch Sending

| SendGrid                        | Resend                                             |
| ------------------------------- | -------------------------------------------------- |
| `sgMail.sendMultiple(messages)` | `resend.batch.send(messages)` — up to 100 per call |
| Independent sends               | Atomic: all succeed or all fail                    |
| Supports attachments            | No attachments in batch sends — use single sends   |
| Supports scheduling             | No scheduling in batch sends — use single sends    |

## Rate Limiting

| SendGrid                        | Resend                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| Error on rate limit, no headers | IETF-standard `RateLimit-*` response headers on every request |

## API Logs

| SendGrid                    | Resend                                                                    |
| --------------------------- | ------------------------------------------------------------------------- |
| HTTP response only, no logs | Full request/response logs in [Resend Dashboard](https://resend.com/logs) |

## Idempotency

| SendGrid      | Resend                                                              |
| ------------- | ------------------------------------------------------------------- |
| Not supported | `Idempotency-Key` header on `POST /emails` and `POST /emails/batch` |

Format: `<event-type>/<entity-id>` — e.g. `welcome-user/123`, `password-reset/456`

## Additional Resend Features

- **Deliverability Insights** — per-email recommendations for landing in inbox
- **Multi-Region** — route email through regions nearest to your users
- **React Email** — build email templates with React components
- **Email retrieval** — `resend.emails.get(id)` to check send status
- **Audiences & Contacts** — `resend.audiences.*`, `resend.contacts.*`
