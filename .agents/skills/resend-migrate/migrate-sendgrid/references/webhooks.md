# Webhook Migration: SendGrid → Resend

## Event Type Mapping

| Category     | SendGrid Event | Resend Event             |
| ------------ | -------------- | ------------------------ |
| Sent         | `processed`    | `email.sent`             |
| Delivered    | `delivered`    | `email.delivered`        |
| Delayed      | `deferred`     | `email.delivery_delayed` |
| Dropped      | `dropped`      | — (no direct equivalent) |
| Bounced      | `bounce`       | `email.bounced`          |
| Spam         | `spamreport`   | `email.complained`       |
| Opened       | `open`         | `email.opened`           |
| Clicked      | `click`        | `email.clicked`          |
| Unsubscribed | `unsubscribe`  | `contact.updated`        |
| Inbound      | `inbound`      | `email.received`         |

## Key Differences

- Resend has webhook request logs in the dashboard — see status of every delivery
- SendGrid supports oAuth on webhooks; Resend uses HMAC signature verification
- Resend `dropped` has no direct equivalent — monitor `email.bounced` and `email.delivery_delayed` instead

## Webhook Payload Structure

**SendGrid** sends an array of events per request:

```json
[
  {
    "event": "delivered",
    "email": "to@example.com",
    "timestamp": 1625000000,
    "sg_message_id": "abc123"
  }
]
```

**Resend** sends one event per request with typed structure:

```json
{
  "type": "email.delivered",
  "created_at": "2024-01-01T00:00:00.000Z",
  "data": {
    "email_id": "abc123",
    "from": "from@example.com",
    "to": ["to@example.com"],
    "subject": "Hello"
  }
}
```

## Signature Verification

**SendGrid:**

```js
const { EventWebhook } = require('@sendgrid/eventwebhook');
const eventWebhook = new EventWebhook();
const isValid = eventWebhook.verifySignature(publicKey, payload, signature, timestamp);
```

**Resend:**

```js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

const payload = await request.text();
const headers = Object.fromEntries(request.headers);
const event = await resend.webhooks.verify(payload, headers, webhookSecret);
```

## Setup

1. Go to [resend.com/webhooks](https://resend.com/webhooks)
2. Add endpoint URL
3. Select events to subscribe to
4. Copy the signing secret → set as `RESEND_WEBHOOK_SECRET`
