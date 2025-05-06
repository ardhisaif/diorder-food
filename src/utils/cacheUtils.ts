/**
 * Utility functions for handling data caching with timestamp comparison
 */

// Key constants for localStorage
const MERCHANT_TIMESTAMP_KEY = "diorder_merchants_updated_at";
const MENU_TIMESTAMP_KEY = "diorder_menu_updated_at";
const SETTINGS_TIMESTAMP_KEY = "diorder_settings_updated_at";
const MERCHANT_SPECIFIC_PREFIX = "diorder_merchant_";
const LAST_FETCH_PREFIX = "diorder_last_fetch_";

/**
 * Check if we need to fetch fresh data by comparing timestamps
 * @param key The localStorage key for the timestamp
 * @param serverTimestamp The timestamp from the server (if available)
 * @returns boolean indicating if data should be fetched
 */
export const shouldFetchFreshData = (
  key: string,
  serverTimestamp?: string
): boolean => {
  const cachedTimestamp = localStorage.getItem(key);

  // If no cached timestamp exists, we should fetch
  if (!cachedTimestamp) return true;

  // If we already know the server timestamp (from a lightweight check)
  // compare it with our cached timestamp
  if (serverTimestamp) {
    return new Date(serverTimestamp) > new Date(cachedTimestamp);
  }

  return false;
};

/**
 * Update the stored timestamp after fetching fresh data
 * @param key The localStorage key for the timestamp
 * @param timestamp The new timestamp to store
 */
export const updateStoredTimestamp = (key: string, timestamp: string): void => {
  localStorage.setItem(key, timestamp);
};

/**
 * Get the last fetch time for a specific merchant
 * @param merchantId The merchant ID
 * @returns The timestamp of the last fetch or null if never fetched
 */
export const getLastFetchTime = (merchantId: number): number | null => {
  const key = `${LAST_FETCH_PREFIX}${merchantId}`;
  const timestamp = localStorage.getItem(key);
  return timestamp ? parseInt(timestamp) : null;
};

/**
 * Update the last fetch time for a specific merchant
 * @param merchantId The merchant ID
 */
export const updateLastFetchTime = (merchantId: number): void => {
  const key = `${LAST_FETCH_PREFIX}${merchantId}`;
  localStorage.setItem(key, Date.now().toString());
};

/**
 * Get merchant-specific timestamp key
 * @param merchantId The merchant ID
 * @returns The localStorage key for that merchant's timestamp
 */
export const getMerchantTimestampKey = (merchantId: number): string => {
  return `${MERCHANT_SPECIFIC_PREFIX}${merchantId}_updated_at`;
};

/**
 * Check if merchant-specific data should be fetched
 * @param merchantId The merchant ID
 * @param serverTimestamp The timestamp from the server (if available)
 * @returns boolean indicating if data should be fetched
 */
export const shouldFetchMerchantData = (
  merchantId: number,
  serverTimestamp?: string
): boolean => {
  return shouldFetchFreshData(
    getMerchantTimestampKey(merchantId),
    serverTimestamp
  );
};

/**
 * Update merchant-specific timestamp
 * @param merchantId The merchant ID
 * @param timestamp The new timestamp
 */
export const updateMerchantTimestamp = (
  merchantId: number,
  timestamp: string
): void => {
  updateStoredTimestamp(getMerchantTimestampKey(merchantId), timestamp);
};

export const TIMESTAMP_KEYS = {
  MERCHANT: MERCHANT_TIMESTAMP_KEY,
  MENU: MENU_TIMESTAMP_KEY,
  SETTINGS: SETTINGS_TIMESTAMP_KEY,
};

// Key for home page last fetch
export const HOME_LAST_FETCH_KEY = "diorder_home_last_fetch";

/**
 * Reset the last fetch time for a given key (e.g. home page)
 */
export const resetLastFetchTime = (key: string) => {
  localStorage.removeItem(key);
};

/**
 * Reset all merchant-specific timestamps (force refetch for all merchants)
 */
export const resetAllMerchantTimestamps = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("diorder_merchant_") && key.endsWith("_updated_at")) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Reset menu timestamp (force refetch for all menu)
 */
export const resetMenuTimestamp = () => {
  localStorage.removeItem(TIMESTAMP_KEYS.MENU);
};
