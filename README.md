# ShowUp Engine — B2B WhatsApp Webinar Attendance SaaS

Built for Kenyan & African webinar hosts, course creators, finance/forex trainers, and academies running Meta Ads.

## Quick Start

```bash
cd whatsapp-showup-engine
npm run dev
```

Open **[http://localhost:3005](http://localhost:3005)**:
- **Landing Page & Interactive Ad Waste Calculator:** `http://localhost:3005/`
- **SaaS Command Center Dashboard:** `http://localhost:3005/dashboard`
- **Public Hosted Registration Page:** `http://localhost:3005/r/nairobi-real-estate-masterclass`

## Key Features Included

1. **Meta WhatsApp Embedded Signup (`config_id: 1433645942194259`)**
   - Component: `src/components/whatsapp/EmbeddedSignupModal.tsx`
   - Callback API: `POST /api/whatsapp/embedded-signup/callback`
   - Exchanges OAuth code for permanent System User Token, subscribes app to client WABA webhooks, registers phone number, and auto-provisions the 5 standardized webinar templates.
2. **Template Studio (Default + Custom Templates)**
   - API: `GET & POST /api/whatsapp/templates`
   - Supports the 5 pre-approved default templates AND custom templates submitted directly to Meta's Graph API (`POST /{waba_id}/message_templates`).
3. **3-Channel Lead Ingestion + Kenyan Phone Normalization (`+254`)**
   - Public Hosted Registration Page (`/r/[slug]`)
   - Universal Webhook (`POST /api/events/[eventId]/register`) + CSV Bulk Import (`POST /api/events/[eventId]/import-csv`)
   - Native Meta Lead Ads Webhook (`GET & POST /api/webhooks/meta`)
4. **5-Stage Automated Sequence + Upstash QStash**
   - Stage 1: Instant Welcome (`event_registration_confirmed`)
   - Stage 2: +2m Calendar Link (`event_calendar_link`)
   - Stage 3: T-24h Value Teaser (`event_teaser_24h`)
   - Stage 4: T-1h Countdown Alert (`event_starting_1h`)
   - Stage 5: T-5m Live Room Link (`event_live_now`)
5. **Tracked Join Short-Links (`/j/[token]`), Zoom CSV Reconciler & Post-Webinar ROI Report**
6. **M-Pesa STK Push Billing (`POST /api/billing/stk-push`)**

