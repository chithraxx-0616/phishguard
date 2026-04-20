const IS_DEV = true;

export const logger = {
  info:  (...args) => IS_DEV && console.log('[PhishGuard]', ...args),
  warn:  (...args) => console.warn('[PhishGuard]', ...args),
  error: (...args) => console.error('[PhishGuard]', ...args),
};