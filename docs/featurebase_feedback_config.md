# Featurebase Feedback Config

## Current implementation

- The Feedback widget is initialized from the authenticated app shell only.
- Dashboard has a visible `Send feedback` launcher in the welcome card.
- App shell account menu includes `Send feedback`.
- Studio header menu includes `Send feedback`.

## Safety choices

- No story text is sent to Featurebase.
- Telemetry includes only route and optional internal ids such as `storybook_id`.
- The default board can be set with `NEXT_PUBLIC_FEATUREBASE_FEEDBACK_DEFAULT_BOARD`.

## SDK flow

- Widget init: `initialize_feedback_widget`
- Open action: `window.postMessage({ target: "FeaturebaseWidget", data: { action: "openFeedbackWidget" } }, window.location.origin)`
- Submission tracking uses the widget callback `feedbackSubmitted`

## Required env

- `NEXT_PUBLIC_FEATUREBASE_ENABLED=true`
- `NEXT_PUBLIC_FEATUREBASE_ORGANIZATION=<org>`
- Optional: `NEXT_PUBLIC_FEATUREBASE_FEEDBACK_DEFAULT_BOARD=<board>`
