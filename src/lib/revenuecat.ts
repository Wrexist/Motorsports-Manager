/**
 * RevenueCat integration stub — wire Purchases.configure in native bootstrap.
 * Allowed IAP categories only (see CLAUDE.md): remove ads, credit bundles, season pass, cosmetics, subscription.
 */

export type IapProductId =
  | "plm_remove_ads"
  | "plm_credits_small"
  | "plm_credits_medium"
  | "plm_season_pass"
  | "plm_cosmetic_pack_1"
  | "plm_manager_pro_monthly";

export interface RevenueCatBootstrapConfig {
  apiKeyIos?: string;
  apiKeyAndroid?: string;
  appUserId?: string;
}

/** No-op until native SDK is linked; replace with Purchases.configure. */
export async function bootstrapRevenueCat(config: RevenueCatBootstrapConfig): Promise<void> {
  void config;
  return Promise.resolve();
}

export async function logOutRevenueCat(): Promise<void> {
  return Promise.resolve();
}
