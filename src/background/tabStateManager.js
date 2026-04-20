const state = new Map();

export const tabState = {
  set: (tabId, data) => state.set(tabId, data),
  get: (tabId) => state.get(tabId) ?? null,
  clear: (tabId) => state.delete(tabId),
};