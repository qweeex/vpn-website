// Replace this adapter when a consent-aware analytics integration is chosen.
export type AnalyticsEvent =
  | 'tariff_viewed'
  | 'tariff_selected'
  | 'checkout_started'
  | 'purchase_completed'
  | 'vpn_profile_created'
  | 'vpn_config_downloaded';
export function track(event: AnalyticsEvent, properties?: Record<string, string>) {
  void event;
  void properties;
}
