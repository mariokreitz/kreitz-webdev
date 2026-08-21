# Tests: migrate-sendgrid

Skill type: **Reference + Technique**
Skill file: `../migrate-sendgrid/SKILL.md`

Tests verify: retrieval accuracy, code conversion correctness, and common mistake avoidance.

---

## Retrieval Tests

These verify the agent can find specific facts from the skill.

### R1: Batch send replacement

**Prompt:**

> I'm using `sgMail.sendMultiple()` in my SendGrid Node.js code. What's the Resend equivalent?

**Success criteria:**

- [ ] Names `resend.batch.send()` specifically
- [ ] Does NOT suggest calling `resend.emails.send()` in a loop

---

### R2: Unsubscribe group equivalent

**Prompt:**

> My SendGrid code uses the `asm` field for unsubscribe groups. What's the Resend equivalent?

**Success criteria:**

- [ ] Mentions `topic_id` field
- [ ] Mentions Resend Topics
- [ ] Does NOT say there's "no equivalent"

---

### R3: Scheduled send format

**Prompt:**

> SendGrid lets me use `sendAt: 1668000000` (a Unix timestamp) to schedule emails. How do I schedule an email in Resend?

**Success criteria:**

- [ ] Uses `scheduledAt` field (not `sendAt`)
- [ ] Specifies ISO 8601 string format (e.g. `new Date(...).toISOString()`)
- [ ] Does NOT accept a Unix timestamp

---

### R4: Webhook unsubscribe mapping

**Prompt:**

> I'm handling SendGrid's `unsubscribe` webhook event. What Resend event should I listen for instead?

**Success criteria:**

- [ ] Answers `contact.updated`
- [ ] Does NOT say `email.unsubscribed` (this event doesn't exist)

---

### R5: Response shape

**Prompt:**

> My SendGrid code does: `const [response, body] = await sgMail.send(msg)`. How does Resend return data?

**Success criteria:**

- [ ] Describes `{ data, error }` destructuring
- [ ] Does NOT suggest array destructuring `[response, body]`

---

## Application Tests

These verify the agent can correctly convert real code.

### A1: Node.js basic send

**Prompt:**

> Convert this SendGrid code to Resend:
>
> ```js
> const sgMail = require('@sendgrid/mail');
> sgMail.setApiKey(process.env.SENDGRID_API_KEY);
>
> await sgMail.send({
>   to: 'user@example.com',
>   from: 'noreply@company.com',
>   subject: 'Welcome',
>   html: '<p>Welcome to our platform.</p>',
> });
> ```

**Success criteria:**

- [ ] Imports from `resend` (not `@sendgrid/mail`)
- [ ] Uses `new Resend(process.env.RESEND_API_KEY)`
- [ ] Calls `resend.emails.send()`
- [ ] Preserves `to`, `from`, `subject`, `html` fields
- [ ] Does NOT reference `sgMail` or `SENDGRID_API_KEY`

---

### A2: Python basic send

**Prompt:**

> Convert this Python SendGrid code to Resend:
>
> ```python
> import sendgrid
> from sendgrid.helpers.mail import Mail
>
> sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
> message = Mail(
>     from_email='noreply@company.com',
>     to_emails='user@example.com',
>     subject='Hello',
>     html_content='<p>Hello</p>'
> )
> response = sg.send(message)
> ```

**Success criteria:**

- [ ] Imports `resend`
- [ ] Uses `RESEND_API_KEY`
- [ ] Calls `resend.Emails.send()` or `resend.emails.send()`
- [ ] Uses dict with `from_`, `to`, `subject`, `html` fields (note: Python SDK uses `from_` not `from`)
- [ ] Does NOT use `sendgrid` or `Mail` class

---

### A3: Webhook handler migration

**Prompt:**

> I have a SendGrid webhook handler. Help me migrate it to Resend:
>
> ```js
> app.post('/webhook', (req, res) => {
>   const events = req.body; // array of events
>   events.forEach((event) => {
>     if (event.event === 'delivered') handleDelivered(event);
>     if (event.event === 'bounce') handleBounce(event);
>     if (event.event === 'unsubscribe') handleUnsubscribe(event);
>     if (event.event === 'spamreport') handleSpam(event);
>   });
>   res.sendStatus(200);
> });
> ```

**Success criteria:**

- [ ] Handles single event per request (not array)
- [ ] Maps `delivered` → `email.delivered`
- [ ] Maps `bounce` → `email.bounced`
- [ ] Maps `spamreport` → `email.complained`
- [ ] Maps `unsubscribe` → `contact.updated`
- [ ] Does NOT suggest `email.unsubscribed`

---

## Gap Tests

These verify the skill covers uncommon but documented cases.

### G1: Rust SDK

**Prompt:**

> Does Resend have an official Rust SDK? SendGrid doesn't have one, so I'd need to implement it myself if I stay on SendGrid.

**Success criteria:**

- [ ] Confirms Resend has `resend-rs`
- [ ] Does NOT say Resend lacks a Rust SDK

---

### G2: Dropped event handling

**Prompt:**

> SendGrid has a `dropped` event when it won't attempt to send an email. What's the Resend equivalent?

**Success criteria:**

- [ ] Acknowledges there is no direct equivalent
- [ ] Suggests monitoring `email.bounced` and/or `email.delivery_delayed` instead

---

### G3: SMTP migration

**Prompt:**

> I'm using SendGrid's SMTP relay. What do I need to change to use Resend's SMTP?

**Success criteria:**

- [ ] Provides Resend SMTP hostname (`smtp.resend.com`)
- [ ] Mentions username is `resend` (literal string)
- [ ] Mentions password is the Resend API key
- [ ] Mentions supported ports (465, 587, 2465, or 2587)
