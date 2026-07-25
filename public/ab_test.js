/**
 * Obioma A/B Testing Engine
 * Lightweight client-side A/B testing with GA4 integration
 * No external dependencies, no cookies, no server-side logic
 */

(function() {
    'use strict';
    
    const Obioma_AB = {
        // Test configurations
        tests: {
            'hero-headline': {
                name: 'Hero Headline',
                description: 'Test which hero headline resonates more with nursing students',
                variants: [
                    { id: 'control', weight: 0.5, name: 'Clinical Judgment, Mastered' },
                    { id: 'v2', weight: 0.5, name: 'Pass the Next Gen NCLEX. Think Like a Nurse.' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'signup_click',
                secondaryMetrics: ['trial_start', 'video_play']
            },
            'hero-subheadline': {
                name: 'Hero Subheadline',
                description: 'Test subheadline messaging focus',
                variants: [
                    { id: 'control', weight: 0.5, name: 'AI-powered case studies aligned with NCSBN framework' },
                    { id: 'v2', weight: 0.5, name: 'The only NCLEX prep that trains clinical judgment — not memorization' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'signup_click',
                secondaryMetrics: ['scroll_depth_50']
            },
            'cta-button': {
                name: 'Primary CTA Text',
                description: 'Test primary call-to-action copy',
                variants: [
                    { id: 'control', weight: 0.5, name: 'Start Free Trial — No Card Required' },
                    { id: 'v2', weight: 0.5, name: 'Get the Free Framework Guide' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'signup_click',
                secondaryMetrics: ['trial_start']
            },
            'video-section': {
                name: 'Explainer Video Placement',
                description: 'Test if video above the fold improves engagement',
                variants: [
                    { id: 'control', weight: 0.5, name: 'Video in separate section (current)' },
                    { id: 'v2', weight: 0.5, name: 'Video embedded in hero' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'video_play',
                secondaryMetrics: ['signup_click', 'scroll_depth_75']
            },
            'social-proof': {
                name: 'Social Proof Placement',
                description: 'Testimonials before vs after pricing section',
                variants: [
                    { id: 'control', weight: 0.5, name: 'Testimonials after pricing' },
                    { id: 'v2', weight: 0.5, name: 'Testimonials before pricing' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'pricing_click',
                secondaryMetrics: ['signup_click']
            },
            'pricing-highlight': {
                name: 'Pricing Plan Highlight',
                description: 'Test which pricing plan to highlight',
                variants: [
                    { id: 'control', weight: 0.5, name: 'Monthly plan highlighted' },
                    { id: 'v2', weight: 0.5, name: 'Annual plan highlighted (save 31%)' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'pricing_click',
                secondaryMetrics: ['trial_start']
            },
            'sticky-cta': {
                name: 'Sticky Mobile CTA',
                description: 'Add sticky bottom CTA bar on mobile',
                variants: [
                    { id: 'control', weight: 0.5, name: 'No sticky bar' },
                    { id: 'v2', weight: 0.5, name: 'Sticky bottom CTA' }
                ],
                startDate: '2026-07-26',
                minSampleSize: 100,
                primaryMetric: 'signup_click',
                secondaryMetrics: ['scroll_depth_50']
            }
        },
        
        // Storage key
        STORAGE_KEY: 'obio_ab_tests',
        
        // Initialize
        init() {
            this.loadAssignments();
            this.assignVariants();
            this.trackPageView();
            this.setupEventTracking();
            this.injectVariants();
        },
        
        // Load assignments from localStorage
        loadAssignments() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                this.assignments = stored ? JSON.parse(stored) : {};
            } catch (e) {
                this.assignments = {};
            }
        },
        
        // Save assignments to localStorage
        saveAssignments() {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.assignments));
            } catch (e) {
                // localStorage unavailable
            }
        },
        
        // Assign user to variants using weighted random
        assignVariants() {
            const now = new Date().toISOString().split('T')[0];
            
            for (const [testId, test] of Object.entries(this.tests)) {
                // Check if already assigned and test is still active
                if (this.assignments[testId]) {
                    const assigned = this.assignments[testId];
                    // Reset if test config changed
                    if (assigned.configHash !== this.hashTest(test)) {
                        delete this.assignments[testId];
                    } else {
                        continue;
                    }
                }
                
                // Weighted random selection
                const rand = Math.random();
                let cumulative = 0;
                let selected = test.variants[0];
                
                for (const variant of test.variants) {
                    cumulative += variant.weight;
                    if (rand <= cumulative) {
                        selected = variant;
                        break;
                    }
                }
                
                this.assignments[testId] = {
                    variantId: selected.id,
                    variantName: selected.name,
                    assignedAt: now,
                    configHash: this.hashTest(test)
                };
            }
            
            this.saveAssignments();
        },
        
        // Simple hash of test config for invalidation
        hashTest(test) {
            return btoa(test.variants.map(v => v.id + ':' + v.weight).join('|')).slice(0, 16);
        },
        
        // Track page view with variant info
        trackPageView() {
            const activeTests = Object.entries(this.assignments).map(([testId, assignment]) => ({
                test_id: testId,
                variant_id: assignment.variantId,
                variant_name: assignment.variantName
            }));
            
            // Send to GA4 as custom event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'ab_test_exposure', {
                    tests: JSON.stringify(activeTests),
                    ab_test_count: activeTests.length
                });
                
                // Also set user properties for segmentation
                activeTests.forEach(test => {
                    gtag('event', `ab_${test.test_id}`, {
                        variant: test.variant_id
                    });
                });
            }
            
            // Store exposure in localStorage for analysis
            this.recordEvent('exposure', { tests: activeTests });
        },
        
        // Setup click tracking on key elements
        setupEventTracking() {
            // Track all CTA clicks
            document.querySelectorAll('a[href*="app.obiomacare.com"], .btn-primary').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const href = btn.getAttribute('href') || '';
                    const text = btn.textContent.trim();
                    
                    let eventName = 'cta_click';
                    if (href.includes('register')) eventName = 'signup_click';
                    if (href.includes('trial')) eventName = 'trial_start';
                    if (text.toLowerCase().includes('assessment')) eventName = 'assessment_click';
                    
                    this.recordEvent(eventName, {
                        element: text,
                        href: href,
                        location: this.getElementLocation(btn)
                    });
                });
            });
            
            // Track pricing section interactions
            document.querySelectorAll('.pricing-card a').forEach(btn => {
                btn.addEventListener('click', () => {
                    const card = btn.closest('.pricing-card');
                    const plan = card?.dataset.plan || 'unknown';
                    this.recordEvent('pricing_click', { plan });
                });
            });
            
            // Track video plays
            const video = document.getElementById('explainerVideo');
            if (video) {
                let videoTracked = false;
                video.addEventListener('play', () => {
                    if (!videoTracked) {
                        videoTracked = true;
                        this.recordEvent('video_play', { 
                            video_src: video.currentSrc,
                            placement: video.closest('.hero') ? 'hero' : 'section'
                        });
                    }
                });
            }
            
            // Track sticky CTA clicks
            document.querySelectorAll('.sticky-cta-bar a').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.recordEvent('sticky_cta_click', { 
                        text: btn.textContent.trim() 
                    });
                });
            });
            
            // Track FAQ engagement (time spent)
            const faqSection = document.getElementById('faq');
            if (faqSection) {
                let faqTimer = null;
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            faqTimer = Date.now();
                        } else if (faqTimer) {
                            const duration = Math.round((Date.now() - faqTimer) / 1000);
                            if (duration > 5) {
                                this.recordEvent('faq_engagement', { duration_seconds: duration });
                            }
                            faqTimer = null;
                        }
                    });
                }, { threshold: 0.3 });
                observer.observe(faqSection);
            }
            
            // Track scroll depth
            this.trackScrollDepth();
        },
        
        // Track scroll depth milestones
        trackScrollDepth() {
            const milestones = [25, 50, 75, 90];
            const reached = new Set();
            
            window.addEventListener('scroll', () => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                );
                
                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !reached.has(milestone)) {
                        reached.add(milestone);
                        this.recordEvent('scroll_depth', { depth: milestone });
                    }
                });
            }, { passive: true });
        },
        
        // Record event with variant context
        recordEvent(eventName, data = {}) {
            const event = {
                event: eventName,
                timestamp: new Date().toISOString(),
                session_id: this.getSessionId(),
                variants: this.assignments,
                ...data
            };
            
            // Store locally
            const events = this.getStoredEvents();
            events.push(event);
            
            // Keep last 500 events
            while (events.length > 500) events.shift();
            
            try {
                localStorage.setItem('obio_ab_events', JSON.stringify(events));
            } catch (e) {
                // Storage full
            }
            
            // Send to GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    ...data,
                    ab_variants: JSON.stringify(this.assignments)
                });
            }
            
            return event;
        },
        
        // Get stored events
        getStoredEvents() {
            try {
                const stored = localStorage.getItem('obio_ab_events');
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                return [];
            }
        },
        
        // Get or create session ID
        getSessionId() {
            let sessionId = sessionStorage.getItem('obio_session_id');
            if (!sessionId) {
                sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('obio_session_id', sessionId);
            }
            return sessionId;
        },
        
        // Get element's section location
        getElementLocation(el) {
            const section = el.closest('section');
            return section?.id || section?.className || 'unknown';
        },
        
        // Inject variant content based on assignments
        injectVariants() {
            // Hero headline variant
            if (this.assignments['hero-headline']?.variantId === 'v2') {
                const heroTitle = document.querySelector('.hero h1');
                if (heroTitle) {
                    heroTitle.innerHTML = 'Pass the Next Gen NCLEX.<br><span class="text-gradient">Think Like a Nurse.</span>';
                }
            }
            
            // Hero subheadline variant
            if (this.assignments['hero-subheadline']?.variantId === 'v2') {
                const heroSub = document.querySelector('.hero p.lead');
                if (heroSub) {
                    heroSub.textContent = "The only NCLEX prep that trains clinical judgment — not memorization. AI-powered case studies aligned with the NCSBN framework.";
                }
            }
            
            // CTA button variant
            if (this.assignments['cta-button']?.variantId === 'v2') {
                document.querySelectorAll('.hero .btn-primary').forEach(btn => {
                    if (btn.textContent.includes('Start Free')) {
                        btn.textContent = 'Get the Free Framework Guide';
                    }
                });
            }
            
            // Video section variant
            if (this.assignments['video-section']?.variantId === 'v2') {
                this.embedVideoInHero();
            }
            
            // Social proof placement variant
            if (this.assignments['social-proof']?.variantId === 'v2') {
                this.moveTestimonialsBeforePricing();
            }
            
            // Pricing highlight variant
            if (this.assignments['pricing-highlight']?.variantId === 'v2') {
                this.highlightAnnualPlan();
            }
            
            // Sticky CTA variant
            if (this.assignments['sticky-cta']?.variantId === 'v2') {
                this.addStickyCTA();
            }
        },
        
        // Embed video in hero section
        embedVideoInHero() {
            const hero = document.querySelector('.hero');
            const videoSection = document.querySelector('.video-section');
            if (hero && videoSection) {
                hero.appendChild(videoSection);
                videoSection.style.marginTop = '40px';
            }
        },
        
        // Move testimonials section before pricing
        moveTestimonialsBeforePricing() {
            const testimonials = document.getElementById('testimonials');
            const pricing = document.getElementById('pricing');
            if (testimonials && pricing && pricing.parentNode) {
                pricing.parentNode.insertBefore(testimonials, pricing);
            }
        },
        
        // Highlight annual plan in pricing
        highlightAnnualPlan() {
            // Make the annual toggle the default
            const toggle = document.querySelector('.toggle-switch');
            if (toggle) {
                toggle.click(); // Switch to annual
            }
            
            // Add more prominent annual savings badge
            const familyCard = document.querySelector('.pricing-card[data-plan="family"]');
            if (familyCard) {
                const badge = familyCard.querySelector('.popular-badge');
                if (badge) {
                    badge.textContent = 'Best Value — Save 31%';
                }
            }
        },
        
        // Add sticky bottom CTA bar on mobile
        addStickyCTA() {
            // Only on mobile
            if (window.innerWidth > 768) return;
            
            const bar = document.createElement('div');
            bar.className = 'sticky-cta-bar';
            bar.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #6366f1, #7c3aed);
                padding: 12px 16px;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            `;
            
            bar.innerHTML = `
                <div style="color: white; font-size: 13px; font-weight: 600;"
                    🎯 Free Assessment
                </div>
                <a href="https://app.obiomacare.com" 
                   style="background: white; color: #6366f1; padding: 10px 20px; border-radius: 8px; 
                          text-decoration: none; font-weight: 700; font-size: 14px; white-space: nowrap;"
                   onclick="gtag('event', 'sticky_cta_click', {location: 'sticky_bar'});">
                    Start Free →
                </a>
            `;
            
            document.body.appendChild(bar);
            document.body.style.paddingBottom = '70px';
        },
        
        // Get current results (for dashboard)
        getResults() {
            const events = this.getStoredEvents();
            const results = {};
            
            for (const [testId, test] of Object.entries(this.tests)) {
                results[testId] = {
                    name: test.name,
                    variants: {}
                };
                
                test.variants.forEach(variant => {
                    results[testId].variants[variant.id] = {
                        name: variant.name,
                        exposures: 0,
                        conversions: 0,
                        conversionRate: 0
                    };
                });
            }
            
            // Count exposures and conversions
            events.forEach(event => {
                if (event.event === 'exposure' && event.tests) {
                    event.tests.forEach(test => {
                        if (results[test.test_id]?.variants[test.variant_id]) {
                            results[test.test_id].variants[test.variant_id].exposures++;
                        }
                    });
                }
                
                // Primary conversions per test
                if (['signup_click', 'trial_start'].includes(event.event)) {
                    const sessionEvents = events.filter(e => e.session_id === event.session_id);
                    const exposure = sessionEvents.find(e => e.event === 'exposure');
                    if (exposure?.tests) {
                        exposure.tests.forEach(test => {
                            if (results[test.test_id]?.variants[test.variant_id]) {
                                results[test.test_id].variants[test.variant_id].conversions++;
                            }
                        });
                    }
                }
            });
            
            // Calculate rates
            for (const testId of Object.keys(results)) {
                for (const variantId of Object.keys(results[testId].variants)) {
                    const v = results[testId].variants[variantId];
                    v.conversionRate = v.exposures > 0 ? ((v.conversions / v.exposures) * 100).toFixed(2) : '0.00';
                }
            }
            
            return results;
        },
        
        // Export results as JSON
        exportResults() {
            return JSON.stringify({
                timestamp: new Date().toISOString(),
                assignments: this.assignments,
                results: this.getResults(),
                rawEvents: this.getStoredEvents()
            }, null, 2);
        }
    };
    
    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Obioma_AB.init());
    } else {
        Obioma_AB.init();
    }
    
    // Expose to global for debugging
    window.Obioma_AB = Obioma_AB;
})();
