/**
 * Obioma A/B Test - Pricing Page
 * Tests: Headline + CTA copy
 * 
 * Variant A (Control): "Choose Your Path" / "Get Core — $47"
 * Variant B (Test): "Pass the NCLEX on Your First Try" / "Start My NCLEX Prep — $47"
 * 
 * Tracked in GA4 custom event: ab_test_pricing
 */
(function() {
    'use strict';
    
    const TEST_NAME = 'pricing_headline_cta_v1';
    const STORAGE_KEY = 'obioma_ab_test_' + TEST_NAME;
    
    // Check if user already has a variant assigned
    let variant = localStorage.getItem(STORAGE_KEY);
    
    // Randomly assign variant (50/50)
    if (!variant) {
        variant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem(STORAGE_KEY, variant);
    }
    
    // Track variant in GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'ab_test_assignment', {
            test_name: TEST_NAME,
            variant: variant,
            event_category: 'ab_test',
            non_interaction: true
        });
    }
    
    // Store for checkout tracking
    window.__abTestVariant = variant;
    window.__abTestName = TEST_NAME;
    
    // Apply variant changes once DOM is ready
    function applyVariant() {
        const pricingSection = document.getElementById('pricing');
        if (!pricingSection) return;
        
        const title = pricingSection.querySelector('.section-title');
        const subtitle = pricingSection.querySelector('.section-subtitle');
        const coreBtn = pricingSection.querySelector('button[onclick="buyNow(\'core\')"]');
        const completeBtn = pricingSection.querySelector('button[onclick="buyNow(\'complete\')"]');
        
        if (variant === 'B') {
            // Variant B: Urgency-focused, outcome-driven
            if (title) {
                title.textContent = 'Pass the NCLEX on Your First Try';
                title.setAttribute('data-ab-variant', 'B');
            }
            if (subtitle) {
                subtitle.textContent = 'The same clinical judgment framework that helped 50+ nurses pass. One-time investment. Lifetime access.';
                subtitle.setAttribute('data-ab-variant', 'B');
            }
            if (coreBtn) {
                coreBtn.textContent = 'Start My NCLEX Prep — $47';
                coreBtn.setAttribute('data-ab-variant', 'B');
            }
            if (completeBtn) {
                completeBtn.textContent = 'Get Complete Prep — $67';
                completeBtn.setAttribute('data-ab-variant', 'B');
            }
            
            // Add social proof element
            const grid = pricingSection.querySelector('.pricing-grid');
            if (grid && !grid.querySelector('.ab-social-proof')) {
                const proof = document.createElement('div');
                proof.className = 'ab-social-proof';
                proof.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 16px; background: rgba(255,107,91,0.1); border-radius: 8px; margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);';
                proof.innerHTML = '⭐ <strong>50+ nurses passed</strong> using this system. 30-day money-back guarantee.';
                grid.parentNode.insertBefore(proof, grid);
            }
        }
        
        // Track clicks on pricing buttons
        [coreBtn, completeBtn].forEach(btn => {
            if (!btn || btn.hasAttribute('data-ab-tracked')) return;
            btn.setAttribute('data-ab-tracked', 'true');
            
            btn.addEventListener('click', function() {
                const tier = this.getAttribute('onclick').includes('core') ? 'core' : 'complete';
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'ab_test_click', {
                        test_name: TEST_NAME,
                        variant: variant,
                        tier: tier,
                        event_category: 'ab_test',
                        event_label: variant + '_' + tier
                    });
                }
                
                // Also send to our analytics endpoint
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/ab-event', JSON.stringify({
                        test: TEST_NAME,
                        variant: variant,
                        event: 'click',
                        tier: tier,
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                    }));
                }
            });
        });
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyVariant);
    } else {
        applyVariant();
    }
})();
