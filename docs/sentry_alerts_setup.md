# Sentry Alerts Setup (Sprint 24)

Configure a small high-signal alert set first.

## Alert 1: New Issue Spike (Production)

- Condition: issue event count spike in `production`.
- Scope: all services for project `web`.
- Filter tags:
  - `env:production`
- Notify: engineering Slack + email.

## Alert 2: Export Failures

- Condition: events where `flow=export_pdf_post` and `errorCode=EXPORT_RENDER_FAILED`.
- Trigger threshold: >= 5 events in 15 minutes.
- Filter tags:
  - `env:production`
- Notify: engineering Slack.

## Alert 3: AI Generation Failures

- Condition: `flow=draft_generate_v2 OR flow=draft_regen_section_v2` and level `error`.
- Trigger threshold: >= 10 events in 15 minutes.
- Filter tags:
  - `env:production`

## Alert 4 (Optional): Studio Performance Regression

- Condition: transaction `studio_open_populate_chapter` p95 exceeds baseline by 30%.
- Filter:
  - `env:production`

## Noise Controls

- Start with warning thresholds above normal transient spikes.
- Group by `errorCode` and `flow`.
- Mute known issues with owner + expiry date.
