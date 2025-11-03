/**
 * tokenStore.memory.js
 * Simple in-memory token store for POC. This avoids writing secrets to disk
 * until you explicitly allow file-based persistence.
 *
 * API:
 *  - save(provider, clientKey, tokenObject)
 *  - get(provider, clientKey)
 *  - list(provider)
 */

const store = {
  twitch: {},
  streamlabs: {},
};

export function save(provider, key, tokenObj) {
  store[provider] = store[provider] || {};
  store[provider][key] = tokenObj;
}

export function get(provider, key) {
  return (store[provider] || {})[key] || null;
}

export function list(provider) {
  return Object.values(store[provider] || {});
}

export function clear(provider) {
  if (provider) store[provider] = {};
}

export default { save, get, list, clear };
