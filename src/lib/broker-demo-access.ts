export const BROKER_DEMO_COOKIE = "fonatprop_broker_demo";
export const BROKER_DEMO_ACCESS_PATH = "/broker-demo/access";

const DEFAULT_BROKER_DEMO_PASSWORD = "FonatPropDubai2026";

export function getBrokerDemoPassword() {
  return process.env.BROKER_DEMO_PASSWORD || DEFAULT_BROKER_DEMO_PASSWORD;
}

export function getBrokerDemoCookieValue() {
  return process.env.BROKER_DEMO_COOKIE_VALUE || getBrokerDemoPassword();
}

export function hasBrokerDemoAccess(cookieValue?: string | null) {
  return cookieValue === getBrokerDemoCookieValue();
}
