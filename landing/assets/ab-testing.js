/**
 * Simple A/B Testing for Obioma Care Landing Page
 * 
 * Usage:
 * 1. Define test variants below
 * 2. Assign user to variant (50/50 split via localStorage)
 * 3. Track conversions via GA4 events
 * 
 * Tests are defined as objects with:
 * - id: unique test identifier
 * - selector: CSS selector for element to modify
 * - variants: array of content variants
 * 
 * To add a new test, add to the tests array and update landing page.
 */

(function() {
  'use strict';

  // Test definitions
  const tests = [
    {
      id: 'pricing-headline-2026-08',
      description: 'Pricing section headline variant test',
      selector: '.pricing-section .section-title',
      trackEvent: 'pricing_headline_view',
      variants: [
        {
          id: 'control',
          weight: 0.5,
          content: 'One-time investment. Lifetime access. No subscriptions.',
          cta: 'Get Complete — $67'
        },
        {
          id: 'variant-value',
          weight: 0.5,
          content: 'Everything you need to pass the NGN — for less than one textbook.',
          cta: 'Get Complete — $67'
        }
      ]
    },
    {
      id: 'hero-cta-2026-08',
      description: 'Hero section CTA button text test',
      selector: '.hero-cta-primary',
      trackEvent: 'hero_cta_view',
      variants: [
        {
          id: 'control',
          weight: 0.5,
          content: 'Get the Complete System',
          subtext: '74 study guides + 10 NGN cases'
        },
        {
          id: 'variant-urgency',
          weight: 0.5,
          content: 'Start Passing the NGN Now',
          subtext: 'Instant access — begin in 2 minutes'
        }
      ]
    },
    {
      id: 'social-proof-placement-2026-08',
      description: 'Test social proof placement above vs below pricing',
      selector: '.testimonials-section',
      trackEvent: 'social_proof_view',
      variants: [
        {
          id: 'control',
          weight: 0.5,
          placement: 'after-pricing'
        },
        {
          id: 'variant-before',
          weight: 0.5,
          placement: 'before-pricing'
        }
      ]
    }
  ];

  // Utility: Get or assign variant
  function getVariant(testId, variants) {
    const storageKey = `ab_test_${testId}`;
    let assigned = localStorage.getItem(storageKey);
    
    if (!assigned || !variants.find(v => v.id === assigned)) {
      // Assign based on weights
      const rand = Math.random();
      let cumulative = 0;
      for (const variant of variants) {
        cumulative += variant.weight;
        if (rand <= cumulative) {
          assigned = variant.id;
          break;
        }
      }
      // Fallback to last variant
      if (!assigned) assigned = variants[variants.length - 1].id;
      localStorage.setItem(storageKey, assigned);
      
      // Track assignment
      if (typeof gtag !== 'undefined') {
        gtag('event', 'ab_test_assignment', {
          test_id: testId,
          variant_id: assigned
        });
      }
    }
    
    return variants.find(v => v.id === assigned);
  }

  // Utility: Apply variant to DOM
  function applyVariant(test) {
    const variant = getVariant(test.id, test.variants);
    const element = document.querySelector(test.selector);
    
    if (!element) return;
    
    // Apply content changes
    if (variant.content) {
      element.textContent = variant.content;
    }
    if (variant.cta) {
      const ctaEl = element.closest('section')?.querySelector('.btn-primary, .btn-large');
      if (ctaEl) ctaEl.textContent = variant.cta;
    }
    if (variant.subtext) {
      const subtextEl = element.closest('.hero')?.querySelector('.hero-subtext, .section-subtitle');
      if (subtextEl) subtextEl.textContent = variant.subtext;
    }
    
    // Track view
    if (typeof gtag !== 'undefined' && test.trackEvent) {
      gtag('event', test.trackEvent, {
        test_id: test.id,
        variant_id: variant.id,
        test_description: test.description
      });
    }
    
    return variant;
  }

  // Initialize all tests
  function init() {
    const results = {};
    
    tests.forEach(test => {
      const variant = applyVariant(test);
      if (variant) {
        results[test.id] = variant.id;
      }
    });
    
    // Make results available globally for debugging
    window.__abTestVariant = results;
    window.__abTestName = 'pricing-hero-2026-08';
    
    return results;
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose for external use
  window.ObiomaAB = {
    tests,
    getVariant: (testId) => {
      const test = tests.find(t => t.id === testId);
      return test ? getVariant(testId, test.variants) : null;
    },
    reset: (testId) => {
      localStorage.removeItem(`ab_test_${testId}`);
    },
    resetAll: () => {
      tests.forEach(test => localStorage.removeItem(`ab_test_${testId}`));
    }
  };
})();
