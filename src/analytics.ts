type AnalyticsProperty = string | number | boolean | null;
type AnalyticsProps = Record<string, AnalyticsProperty>;

interface AnalyticsClient {
  init: (config: { campaignId: string; campaignName: string; endpoint: string }) => void;
  setConsent: (allowed: boolean) => void;
  track: (eventName: string, props?: AnalyticsProps) => void;
  _debug: () => { ready: boolean };
}

declare global {
  interface Window {
    DTCampaign?: AnalyticsClient;
  }
}

let analyticsReady = false;

export function initializeAnalytics(endpoint: string | undefined): void {
  const configuredEndpoint = endpoint?.trim()
    || document.querySelector<HTMLMetaElement>('meta[name="analytics-endpoint"]')?.content.trim();
  if (!configuredEndpoint) {
    console.info('[analytics] Disabled: VITE_ANALYTICS_ENDPOINT is not configured.');
    return;
  }

  const client = window.DTCampaign;
  if (!client) {
    console.error('[analytics] SDK failed to load; analytics is disabled.');
    return;
  }

  client.setConsent(false);
  client.init({
    campaignId: 'feel_free',
    campaignName: 'feelfree',
    endpoint: configuredEndpoint,
  });
  analyticsReady = client._debug().ready;
}

export function trackAnalytics(eventName: string, props?: AnalyticsProps): void {
  if (!analyticsReady) return;
  window.DTCampaign?.track(eventName, props);
}
