"use client";

import { track } from "./client";

type FeaturebaseEventProps = {
  context: string;
  route?: string;
  storybookId?: string;
  chapterId?: string;
};

function toAnalyticsProps(input: FeaturebaseEventProps) {
  return {
    context: input.context,
    route: input.route,
    storybook_id: input.storybookId,
    chapter_id: input.chapterId
  };
}

export type FeaturebaseEventContext = FeaturebaseEventProps;

export function trackFeaturebaseFeedbackOpened(input: FeaturebaseEventProps) {
  track("featurebase_feedback_opened", toAnalyticsProps(input));
}

export function trackFeaturebaseFeedbackSubmitted(input: FeaturebaseEventProps) {
  track("featurebase_feedback_submitted", toAnalyticsProps(input));
}

export function trackFeaturebaseChangelogOpened(input: FeaturebaseEventProps) {
  track("featurebase_changelog_opened", toAnalyticsProps(input));
}

export function trackFeaturebaseMessengerOpened(input: FeaturebaseEventProps) {
  track("featurebase_messenger_opened", toAnalyticsProps(input));
}
