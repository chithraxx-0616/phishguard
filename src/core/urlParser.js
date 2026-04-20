export function parseURL(rawURL) {
  try {
    const url = new URL(rawURL);
    const hostParts = url.hostname.replace(/^www\./, '').split('.');
    return {
      raw: rawURL,
      protocol: url.protocol,
      hostname: url.hostname,
      domain: hostParts.slice(-2).join('.'),
      subdomains: hostParts.slice(0, -2),
      tld: hostParts.at(-1),
      path: url.pathname,
      params: Object.fromEntries(url.searchParams),
      isIP: /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname),
      length: rawURL.length,
    };
  } catch {
    return null;
  }
}