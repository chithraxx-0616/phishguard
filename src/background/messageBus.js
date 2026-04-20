import { tabState } from './tabStateManager.js';

export function registerMessageBus() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_TAB_STATE') {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        sendResponse(tab ? tabState.get(tab.id) : null);
      });
      return true; // keep channel open for async
    }
  });
}