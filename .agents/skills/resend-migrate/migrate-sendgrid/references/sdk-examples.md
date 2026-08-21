# SDK Examples: SendGrid → Resend

Side-by-side migration examples for all supported SDKs.

## SDK Replacement

| Language             | Remove                              | Add                                     |
| -------------------- | ----------------------------------- | --------------------------------------- |
| Node.js / TypeScript | `npm uninstall @sendgrid/mail`      | `npm install resend`                    |
| Python               | `pip uninstall sendgrid`            | `pip install resend`                    |
| Ruby                 | Remove `gem 'sendgrid-ruby'`        | Add `gem 'resend'`                      |
| Go                   | Remove `sendgrid-go`                | `go get github.com/resend/resend-go/v2` |
| PHP                  | Remove `sendgrid/sendgrid`          | `composer require resend/resend-php`    |
| Java                 | Remove `com.sendgrid:sendgrid-java` | Add `com.resend:resend-java`            |
| .NET                 | Remove `Sendgrid` NuGet             | `dotnet add package Resend`             |
| Elixir               | No official SendGrid SDK            | Add `{:resend, "~> 0.4"}`               |

Minimum Resend SDK versions: Node.js `>= 6.9.2`, Python `>= 2.21.0`, Go `>= 3.1.0`, Ruby `>= 1.0.0`, PHP `>= 1.1.0`, Java `>= 4.11.0`, .NET `>= 0.2.1`

---

## Node.js / TypeScript

```js
// SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: 'to@example.com',
  from: 'from@example.com',
  subject: 'Hello',
  html: '<p>Hello</p>',
});

// Resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  to: 'to@example.com',
  from: 'from@example.com',
  subject: 'Hello',
  html: '<p>Hello</p>',
});
```

**Key differences:**

- `sgMail.send()` → `resend.emails.send()`
- `sgMail.sendMultiple()` → `resend.batch.send()` (array of email objects)
- `msg.substitutions` / `msg.dynamicTemplateData` → React Email components or `html` with variables
- `msg.templateId` → use Resend `template` parameter or React Email components
- `msg.categories` → `tags` (array of `{ name, value }`)
- `msg.sendAt` (unix timestamp) → `scheduledAt` (ISO 8601 string)
- `msg.attachments[].content` (base64) → `attachments[].content` (Buffer)
- `msg.replyTo` → `replyTo`
- Response: `[response, body]` → `{ data, error }`
- `msg.ipPoolName` → IP management handled at account level in Resend
- `msg.asm` (unsubscribe groups) → Resend Topics, use `topic_id`
- `msg.trackingSettings` → open/click tracking configured per-domain in Resend
- `msg.customArgs` → use `tags` or `headers`
- `msg.mailSettings.sandboxMode` → configured at account level in Resend

---

## Python

```python
# SendGrid
import sendgrid
import os
from sendgrid.helpers.mail import Mail, Email, To, Content

sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
message = Mail(
    from_email='from@example.com',
    to_emails='to@example.com',
    subject='Hello',
    html_content='<p>Hello</p>'
)
response = sg.client.mail.send.post(request_body=message.get())

# Resend
import resend
resend.api_key = os.environ["RESEND_API_KEY"]

params: resend.Emails.SendParams = {
    "from": "from@example.com",
    "to": ["to@example.com"],
    "subject": "Hello",
    "html": "<p>Hello</p>",
}
email = resend.Emails.send(params)
```

**Key differences:**

- `Mail()` helper → simple dict with `SendParams` type hint
- `sg.client.mail.send.post()` → `resend.Emails.send()`
- `response.status_code` → returned object has `id`
- Batch: loop of sends → `resend.Batch.send()`
- `template_id` / `dynamic_template_data` → React Email components or `html` with variables
- `category` → `tags` (list of `{ name, value }` dicts)
- `send_at` (unix timestamp) → `scheduled_at` (ISO 8601 string)
- `ip_pool_name` → IP management handled at account level in Resend
- `asm` → Resend Topics, use `topic_id`
- `tracking_settings` → open/click tracking configured per-domain in Resend
- `custom_arg` → use `tags` or `headers`

---

## Ruby

```ruby
# SendGrid
require 'sendgrid-ruby'
include SendGrid
sg = SendGrid::API.new(api_key: ENV['SENDGRID_API_KEY'])
mail = Mail.new
mail.from = Email.new(email: 'from@example.com')
mail.subject = 'Hello'
personalization = Personalization.new
personalization.add_to(Email.new(email: 'to@example.com'))
mail.add_personalization(personalization)
mail.add_content(Content.new(type: 'text/html', value: '<p>Hello</p>'))
sg.client.mail._('send').post(request_body: mail.to_json)

# Resend
require 'resend'
Resend.api_key = ENV['RESEND_API_KEY']
Resend::Emails.send({
  from: 'from@example.com',
  to: ['to@example.com'],
  subject: 'Hello',
  html: '<p>Hello</p>'
})
```

**Key differences:**

- `sg.client.mail._('send').post()` → `Resend::Emails.send()`
- `template_id` / `dynamic_template_data` → React Email components or `html` with variables
- `add_category` → `tags` (array of `{ name:, value: }` hashes)
- `send_at` (unix timestamp) → `scheduled_at` (ISO 8601 string)
- `ip_pool_name` → IP management handled at account level in Resend
- `asm` → Resend Topics, use `topic_id`
- `tracking_settings` → open/click tracking configured per-domain in Resend
- `custom_args` → use `tags` or `headers`

---

## Go

```go
// SendGrid
import (
    "github.com/sendgrid/sendgrid-go"
    "github.com/sendgrid/sendgrid-go/helpers/mail"
)
from := mail.NewEmail("", "from@example.com")
to := mail.NewEmail("", "to@example.com")
message := mail.NewSingleEmail(from, "Hello", to, "", "<p>Hello</p>")
client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
response, err := client.Send(message)

// Resend
import "github.com/resend/resend-go/v2"
client := resend.NewClient(os.Getenv("RESEND_API_KEY"))
params := &resend.SendEmailRequest{
    From:    "from@example.com",
    To:      []string{"to@example.com"},
    Subject: "Hello",
    Html:    "<p>Hello</p>",
}
sent, err := client.Emails.Send(params)
```

**Key differences:**

- `client.Send(message)` → `client.Emails.Send(params)`
- `SetTemplateID` / `SetDynamicTemplateData` → React Email components or `Html` with variables
- `AddCategories` → `Tags []resend.Tag` (slice of `{ Name, Value }`)
- `SetSendAt` (unix timestamp) → `ScheduledAt` (ISO 8601 string, e.g. `time.Unix(...).Format(time.RFC3339)`)
- `SetIPPoolID` → IP management handled at account level in Resend
- `SetASM` → Resend Topics, use `TopicId` (Go struct field, maps to `topic_id` in REST)
- `SetTrackingSettings` → open/click tracking configured per-domain in Resend
- `SetCustomArg` → use `Tags` or `Headers`

---

## PHP

```php
// SendGrid
$email = new \SendGrid\Mail\Mail();
$email->setFrom("from@example.com");
$email->setSubject("Hello");
$email->addTo("to@example.com");
$email->addContent("text/html", "<p>Hello</p>");
$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));
$response = $sendgrid->send($email);

// Resend
$resend = Resend::client(getenv('RESEND_API_KEY'));
$resend->emails->send([
    'from'    => 'from@example.com',
    'to'      => ['to@example.com'],
    'subject' => 'Hello',
    'html'    => '<p>Hello</p>',
]);
```

**Key differences:**

- `$sendgrid->send($email)` → `$resend->emails->send([...])`
- `setTemplateId` / `addDynamicTemplateDatas` → React Email components or `'html'` with variables
- `addCategory` → `'tags'` (array of `['name' => ..., 'value' => ...]`)
- `setSendAt` (unix timestamp) → `'scheduled_at'` (ISO 8601 string)
- `setIpPoolName` → IP management handled at account level in Resend
- `setAsm` → Resend Topics, use `'topic_id'`
- `setClickTracking` / `setOpenTracking` → open/click tracking configured per-domain in Resend
- `addCustomArg` → use `'tags'` or `'headers'`

---

## Java

```java
// SendGrid
SendGrid sg = new SendGrid(System.getenv("SENDGRID_API_KEY"));
Mail mail = new Mail(
    new Email("from@example.com"),
    "Hello",
    new Email("to@example.com"),
    new Content("text/html", "<p>Hello</p>")
);
Request request = new Request();
request.setMethod(Method.POST);
request.setEndpoint("mail/send");
request.setBody(mail.build());
Response response = sg.api(request);

// Resend
import com.resend.*;
Resend resend = new Resend(System.getenv("RESEND_API_KEY"));
CreateEmailOptions params = CreateEmailOptions.builder()
    .from("from@example.com")
    .to("to@example.com")
    .subject("Hello")
    .html("<p>Hello</p>")
    .build();
CreateEmailResponse data = resend.emails().send(params);
```

**Key differences:**

- `sg.api(request)` → `resend.emails().send(params)`
- `setTemplateId` / `addDynamicTemplateData` → React Email components or `html` with variables
- `addCategory` → `Tag.builder().name(...).value(...).build()`
- `setSendAt` (unix timestamp) → `.scheduledAt()` (ISO 8601 string)
- `setIpPoolId` → IP management handled at account level in Resend
- `setASM` → Resend Topics, use `topicId`
- `setClickTrackingSetting` / `setOpenTrackingSetting` → open/click tracking configured per-domain in Resend
- `addCustomArg` → use `tags` or `headers`

---

## C# / .NET

```csharp
// SendGrid
using SendGrid;
using SendGrid.Helpers.Mail;
var client = new SendGridClient(Environment.GetEnvironmentVariable("SENDGRID_API_KEY"));
var msg = new SendGridMessage();
msg.SetFrom(new EmailAddress("from@example.com"));
msg.AddTo(new EmailAddress("to@example.com"));
msg.SetSubject("Hello");
msg.AddContent(MimeType.Html, "<p>Hello</p>");
var response = await client.SendEmailAsync(msg);

// Resend
using Resend;
IResend resend = ResendClient.Create(Environment.GetEnvironmentVariable("RESEND_API_KEY"));
var resp = await resend.EmailSendAsync(new EmailMessage {
    From    = "from@example.com",
    To      = new[] { "to@example.com" },
    Subject = "Hello",
    HtmlBody = "<p>Hello</p>",
});
```

**Key differences:**

- `SendGridClient.SendEmailAsync(msg)` → `ResendClient.EmailSendAsync(message)`
- `SetTemplateId` / `SetTemplateData` → React Email components or `HtmlBody` with variables
- `AddCategory` → `Tags` (array of `Tag { Name, Value }`)
- `SendAt` (unix timestamp) → `ScheduledAt` (ISO 8601 string)
- `SetIpPoolName` → IP management handled at account level in Resend
- `SetAsm` → Resend Topics, use `TopicId`
- `SetClickTracking` / `SetOpenTracking` → open/click tracking configured per-domain in Resend
- `AddCustomArg` → use `Tags` or `Headers`

---

## Elixir

No official SendGrid SDK for Elixir. Use Resend directly:

```elixir
# Resend
Resend.Emails.send(%{
  from: "from@example.com",
  to: ["to@example.com"],
  subject: "Hello",
  html: "<p>Hello</p>"
})
```

---

## cURL / REST API

```bash
# SendGrid
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "to@example.com"}]}],
    "from": {"email": "from@example.com"},
    "subject": "Hello",
    "content": [{"type": "text/html", "value": "<p>Hello</p>"}]
  }'

# Resend
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "from@example.com",
    "to": ["to@example.com"],
    "subject": "Hello",
    "html": "<p>Hello</p>"
  }'
```

**Field mapping (SendGrid JSON → Resend JSON):**

- `"personalizations[].to"` → `"to"` (flat array of strings or `"Name <email>"` format)
- `"from": {"email": ...}` → `"from"` (string: `"Name <email>"`)
- `"content[].value"` → `"html"` or `"text"`
- `"categories"` → `"tags"` (array of `{ "name": ..., "value": ... }`)
- `"send_at"` (unix timestamp) → `"scheduled_at"` (ISO 8601 string)
- `"reply_to"` → `"reply_to"`
- `"cc"` / `"bcc"` → `"cc"` / `"bcc"`
- `"attachments"` → `"attachments"` (keep `content`/`filename`; drop `type`/`disposition`)
- `"headers"` → `"headers"`
- `"template_id"` / `"dynamic_template_data"` → React Email components or `"html"` with variables
- `"asm"` → Resend Topics, use `"topic_id"`
- `"ip_pool_name"` → IP management handled at account level in Resend
- `"tracking_settings"` → open/click tracking configured per-domain in Resend
- `"mail_settings"` → configured at account level in Resend
- `"custom_args"` → use `"tags"` or `"headers"`

---

## Idempotency Keys

SendGrid does not support idempotency keys. Resend supports them on `POST /emails` and `POST /emails/batch`.

```js
// Node.js
await resend.emails.send({ from, to, subject, html }, { idempotencyKey: 'welcome-user/123456789' });
```

```python
# Python
resend.Emails.send(params, {"idempotency_key": "welcome-user/123456789"})
```

```ruby
# Ruby
Resend::Emails.send(params, options: { idempotency_key: "welcome-user/123456789" })
```

```go
// Go
options := &resend.SendEmailOptions{IdempotencyKey: "welcome-user/123456789"}
client.Emails.SendWithOptions(ctx, params, options)
```

```bash
# cURL
curl -X POST https://api.resend.com/emails \
  -H "Idempotency-Key: welcome-user/123456789" \
  ...
```

Key format: `<event-type>/<entity-id>` (e.g. `welcome-user/123`, `password-reset/456`). Max 256 chars, expires after 24 hours.
