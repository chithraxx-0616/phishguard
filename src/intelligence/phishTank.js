var PHISHTANK_DOMAINS = [
  "paypal-secure-login.com",
  "accounts-google-verify.com",
  "amazon-security-alert.com",
  "appleid-verify-account.com",
  "microsoft-account-verify.com",
  "netflix-billing-update.com",
  "secure-bankofamerica-login.com",
  "chase-secure-login.net",
  "wellsfargo-verify.com",
  "instagram-verify-account.com",
  "facebook-security-check.com",
  "twitter-account-suspended.com",
  "linkedin-account-verify.net",
  "dropbox-secure-share.com",
  "steam-trade-offer.net",
  "coinbase-wallet-verify.com",
  "blockchain-wallet-login.net",
  "binance-secure-login.com",
  "crypto-wallet-verify.net",
  "irs-tax-refund-2024.com",
  "fedex-delivery-tracking.net",
  "dhl-package-tracking.com",
  "usps-delivery-failed.net",
  "amazon-prime-renewal.net",
  "netflix-account-suspended.com",
  "apple-id-locked-verify.com",
  "google-account-recovery.net",
  "microsoft-security-alert.net",
  "paypal-account-limited.net",
  "ebay-account-verify.com"
];

function loadPhishTankList(addDomainsFn) {
  return addDomainsFn(PHISHTANK_DOMAINS).then(function() {
    console.log('[PhishGuard] PhishTank blocklist loaded - ' + PHISHTANK_DOMAINS.length + ' domains');
    return PHISHTANK_DOMAINS.length;
  });
}