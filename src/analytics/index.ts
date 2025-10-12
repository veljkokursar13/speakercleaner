export type AnalyticsEvent =
  | { type: 'screen_view'; screen: string }
  | { type: 'button_click'; id: string };

export function logEvent(event: AnalyticsEvent) {
  // no-op stub; replace with real analytics SDK later
  // Keep logs concise and non-PII
  // eslint-disable-next-line no-console
  console.log('[analytics]', event.type);
}


