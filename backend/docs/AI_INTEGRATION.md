# AI CRM Integration

## Architecture

The backend exposes organization-scoped AI routes under `/api/v1/ai`. All routes use the existing JWT authentication middleware and derive the organization and user from the verified server-side user record. AI CRM context is read through controlled Mongoose queries; it never receives arbitrary database queries or frontend-supplied permissions.

## Environment

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_REALTIME_MODEL=gpt-4o-mini-realtime-preview
AI_DAILY_LIMIT=100
```

`OPENAI_API_KEY` is server-only. `AI_DAILY_LIMIT` limits successful and failed AI usage records per user per UTC calendar day.

## Existing providers

- Email: uses the existing Nodemailer SMTP configuration. Sending is unsuccessful when `SMTP_USER` or `SMTP_PASS` is missing.
- WhatsApp/SMS: provider adapters are not active. Communication requests are logged as failed until real provider credentials and a provider adapter are configured.
- Voice: the server exposes realtime session configuration only when the OpenAI key is configured. Browser realtime credentials must be short-lived and are not implemented by this foundation.

## AI endpoints

- `POST /api/v1/ai/chat`
- `GET /api/v1/ai/conversations`
- `GET /api/v1/ai/conversations/:id`
- `DELETE /api/v1/ai/conversations/:id`
- `GET /api/v1/ai/insights`
- `GET /api/v1/ai/lead-scoring/:leadId`
- `POST /api/v1/ai/lead-scoring/:leadId`
- `POST /api/v1/ai/message-generator`
- `POST /api/v1/ai/sentiment/analyze`
- `POST /api/v1/ai/voice/session`

All AI mutations require explicit frontend and backend action flows; the chat assistant is read-only.
