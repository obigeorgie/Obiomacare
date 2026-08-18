// UTM Tracking Module — Obioma
// Captures UTM params from URL, stores in localStorage, and includes with API calls

(function() {
  'use strict';

  const STORAGE_KEY = 'obioma_utm';

  // Parse UTM params from URL
  function parseUTMParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    let hasUTM = false;

    utmKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
        hasUTM = true;
      }
    });

    // Also capture referrer if no UTM source
    if (hasUTM) {
      utm.captured_at = new Date().toISOString();
      utm.landing_page = window.location.pathname;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
      } catch (e) {}
    }

    return utm;
  }

  // Get stored UTM data
  function getUTMData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  // Track view_item for products
  function trackViewItem(product) {
    const utm = getUTMData();

    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price
        }],
        ...utm
      });
    }

    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', {
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'USD',
        ...utm
      });
    }
  }

  // Track add_to_cart
  function trackAddToCart(product) {
    const utm = getUTMData();

    if (typeof gtag !== 'undefined') {
      gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price
        }],
        ...utm
      });
    }

    if (typeof fbq !== 'undefined') {
      fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'USD',
        ...utm
      });
    }
  }

  // Build API body with UTM data
  function withUTM(data) {
    return {
      ...data,
      utm: getUTMData()
    };
  }

  // Auto-parse on load
  parseUTMParams();

  // Expose global
  window.ObiomaAnalytics = {
    getUTM: getUTMData,
    trackViewItem,
    trackAddToCart,
    withUTM
  };
})();
