/**
 * ObiomaCare Tier System & Entitlement Configuration
 * 
 * This is the single source of truth for:
 * - Plan definitions (pricing, billing interval, trial)
 * - Feature entitlements (which tier unlocks what)
 * - Copy/content for pricing page (change without code edits)
 * 
 * Changing a price or feature flag here updates the pricing page
 * and gate logic automatically — no code change required.
 */

// ─── TIER ENUM ───
// Used across frontend, API, and webhooks
const TIER = {
  FREE: 'free',
  STUDENT_MONTHLY: 'student_monthly',
  STUDENT_ANNUAL: 'student_annual',
  LIFETIME: 'lifetime',
  INSTITUTIONAL_INSTRUCTOR: 'institutional_instructor',
  INSTITUTIONAL_STUDENT: 'institutional_student',
};

// ─── BILLING INTERVAL ───
const INTERVAL = {
  MONTHLY: 'month',
  ANNUAL: 'year',
  ONCE: 'once',
};

// ─── PLAN DEFINITIONS ───
// All pricing page content lives here. Edit to change prices, copy, or features.
const PLANS = {
  [TIER.FREE]: {
    id: TIER.FREE,
    name: 'Free',
    displayPrice: '$0',
    billingInterval: null,
    trialDays: 0,
    stripePriceId: null, // No checkout for free
    badge: null,
    description: 'Access to all educational content and limited quizzes.',
    ctaText: 'Get Started Free',
    ctaAction: 'signup', // vs 'checkout'
    highlighted: false,
    features: [
      'All SEO-indexed nursing articles & guides',
      'Basic anatomy/physiology reference pages',
      'Limited quiz set (10 questions/day)',
      'Community access',
    ],
    limitations: [
      'No NGN case studies',
      'No spaced repetition',
      'No performance analytics',
      'No Anatomy Lab 3D models',
    ],
  },

  [TIER.STUDENT_MONTHLY]: {
    id: TIER.STUDENT_MONTHLY,
    name: 'Student',
    displayPrice: '$19',
    billingInterval: INTERVAL.MONTHLY,
    trialDays: 7,
    stripePriceId: process.env.STRIPE_PRICE_MONTHLY || 'price_test_monthly',
    badge: 'Most Flexible',
    description: 'Full access to everything. Cancel anytime.',
    ctaText: 'Start 7-Day Free Trial',
    ctaAction: 'checkout',
    highlighted: false,
    features: [
      'Full NGN case study bank (10+ live, growing)',
      'Adaptive spaced repetition engine',
      'Performance analytics & weak-spot targeting',
      '3D Anatomy Lab — all systems',
      'Unlimited quizzes with AI explanations',
      'NCLEX-style SATA & bow-tie practice',
      'Progress sync across devices',
    ],
    limitations: [],
  },

  [TIER.STUDENT_ANNUAL]: {
    id: TIER.STUDENT_ANNUAL,
    name: 'Student Annual',
    displayPrice: '$99',
    billingInterval: INTERVAL.ANNUAL,
    trialDays: 14,
    stripePriceId: process.env.STRIPE_PRICE_ANNUAL || 'price_test_annual',
    badge: 'Best Value',
    description: 'Save 57% vs. monthly. 14-day free trial.',
    ctaText: 'Start 14-Day Free Trial',
    ctaAction: 'checkout',
    highlighted: true,
    features: [
      'Everything in Student Monthly',
      'Priority AI tutor access',
      'Early access to new case studies',
      'Downloadable study guides & cheat sheets',
      'Exclusive webinar access',
    ],
    limitations: [],
  },

  [TIER.LIFETIME]: {
    id: TIER.LIFETIME,
    name: 'Lifetime',
    displayPrice: '$47',
    billingInterval: INTERVAL.ONCE,
    trialDays: 0,
    stripePriceId: process.env.STRIPE_PRICE_LIFETIME || 'price_test_lifetime',
    badge: null,
    description: 'One-time purchase. All current and future content.',
    ctaText: 'Buy Once, Own Forever',
    ctaAction: 'checkout',
    highlighted: false,
    features: [
      'Everything in Student Annual',
      'Never pay again — all future updates',
      'Permanent access to new case studies',
    ],
    limitations: [],
  },

  [TIER.INSTITUTIONAL_INSTRUCTOR]: {
    id: TIER.INSTITUTIONAL_INSTRUCTOR,
    name: 'Institutional',
    displayPrice: 'Custom',
    billingInterval: null,
    trialDays: 0,
    stripePriceId: null, // Manual invoicing for now
    badge: 'For Schools',
    description: 'Per-seat pricing for nursing programs.',
    ctaText: 'Contact Sales',
    ctaAction: 'contact', // Opens contact form/email
    highlighted: false,
    features: [
      'Instructor dashboard & cohort management',
      'Assignable case studies by topic',
      'Aggregate cohort analytics (no individual PII)',
      'Weak-topic reports across the class',
      'Seat assignment/unassignment',
      'LMS integration (Canvas, Blackboard) — coming soon',
    ],
    limitations: [],
  },
};

// ─── FEATURE ENTITLEMENT MAP ───
// Single source of truth: which features require which tier
// Usage: hasAccess(userTier, FEATURE.CASE_BANK) → boolean
const FEATURE = {
  // Free-tier features (no gate)
  ARTICLES: 'articles',
  BASIC_QUIZ: 'basic_quiz',
  COMMUNITY: 'community',

  // Gated features (require paid tier)
  CASE_BANK: 'case_bank',
  SPACED_REPETITION: 'spaced_repetition',
  ANALYTICS: 'analytics',
  ANATOMY_LAB: 'anatomy_lab',
  UNLIMITED_QUIZZES: 'unlimited_quizzes',
  AI_TUTOR: 'ai_tutor',
  SATA_PRACTICE: 'sata_practice',
  BOW_TIE_PRACTICE: 'bow_tie_practice',
  PROGRESS_SYNC: 'progress_sync',
  DOWNLOADABLE_GUIDES: 'downloadable_guides',
  WEBINAR_ACCESS: 'webinar_access',

  // Institutional-only
  COHORT_DASHBOARD: 'cohort_dashboard',
  ASSIGN_CASES: 'assign_cases',
  COHORT_ANALYTICS: 'cohort_analytics',
};

// Tier → Feature[] mapping
// Any tier listed has access. Higher tiers inherit lower tier access.
const ENTITLEMENTS = {
  [TIER.FREE]: [
    FEATURE.ARTICLES,
    FEATURE.BASIC_QUIZ,
    FEATURE.COMMUNITY,
  ],
  [TIER.STUDENT_MONTHLY]: [
    FEATURE.ARTICLES,
    FEATURE.BASIC_QUIZ,
    FEATURE.COMMUNITY,
    FEATURE.CASE_BANK,
    FEATURE.SPACED_REPETITION,
    FEATURE.ANALYTICS,
    FEATURE.ANATOMY_LAB,
    FEATURE.UNLIMITED_QUIZZES,
    FEATURE.AI_TUTOR,
    FEATURE.SATA_PRACTICE,
    FEATURE.BOW_TIE_PRACTICE,
    FEATURE.PROGRESS_SYNC,
  ],
  [TIER.STUDENT_ANNUAL]: [
    // Inherits all monthly features
    FEATURE.ARTICLES,
    FEATURE.BASIC_QUIZ,
    FEATURE.COMMUNITY,
    FEATURE.CASE_BANK,
    FEATURE.SPACED_REPETITION,
    FEATURE.ANALYTICS,
    FEATURE.ANATOMY_LAB,
    FEATURE.UNLIMITED_QUIZZES,
    FEATURE.AI_TUTOR,
    FEATURE.SATA_PRACTICE,
    FEATURE.BOW_TIE_PRACTICE,
    FEATURE.PROGRESS_SYNC,
    // Annual-only extras
    FEATURE.DOWNLOADABLE_GUIDES,
    FEATURE.WEBINAR_ACCESS,
  ],
  [TIER.LIFETIME]: [
    // Same as annual
    FEATURE.ARTICLES,
    FEATURE.BASIC_QUIZ,
    FEATURE.COMMUNITY,
    FEATURE.CASE_BANK,
    FEATURE.SPACED_REPETITION,
    FEATURE.ANALYTICS,
    FEATURE.ANATOMY_LAB,
    FEATURE.UNLIMITED_QUIZZES,
    FEATURE.AI_TUTOR,
    FEATURE.SATA_PRACTICE,
    FEATURE.BOW_TIE_PRACTICE,
    FEATURE.PROGRESS_SYNC,
    FEATURE.DOWNLOADABLE_GUIDES,
    FEATURE.WEBINAR_ACCESS,
  ],
  [TIER.INSTITUTIONAL_INSTRUCTOR]: [
    FEATURE.ARTICLES,
    FEATURE.BASIC_QUIZ,
    FEATURE.COMMUNITY,
    FEATURE.CASE_BANK,
    FEATURE.SPACED_REPETITION,
    FEATURE.ANALYTICS,
    FEATURE.ANATOMY_LAB,
    FEATURE.UNLIMITED_QUIZZES,
    FEATURE.AI_TUTOR,
    FEATURE.SATA_PRACTICE,
    FEATURE.BOW_TIE_PRACTICE,
    FEATURE.PROGRESS_SYNC,
    FEATURE.DOWNLOADABLE_GUIDES,
    FEATURE.WEBINAR_ACCESS,
    // Institutional-only
    FEATURE.COHORT_DASHBOARD,
    FEATURE.ASSIGN_CASES,
    FEATURE.COHORT_ANALYTICS,
  ],
  [TIER.INSTITUTIONAL_STUDENT]: [
    // Same as student monthly (seats are managed by instructor)
    FEATURE.ARTICLES,
    FEATURE.BASIC_QUIZ,
    FEATURE.COMMUNITY,
    FEATURE.CASE_BANK,
    FEATURE.SPACED_REPETITION,
    FEATURE.ANALYTICS,
    FEATURE.ANATOMY_LAB,
    FEATURE.UNLIMITED_QUIZZES,
    FEATURE.AI_TUTOR,
    FEATURE.SATA_PRACTICE,
    FEATURE.BOW_TIE_PRACTICE,
    FEATURE.PROGRESS_SYNC,
  ],
};

// ─── ACCESS CHECK FUNCTION ───
function hasAccess(userTier, feature) {
  const allowed = ENTITLEMENTS[userTier] || ENTITLEMENTS[TIER.FREE];
  return allowed.includes(feature);
}

// ─── TIER HIERARCHY (for upgrade/downgrade) ───
// Higher index = more access
const TIER_RANK = {
  [TIER.FREE]: 0,
  [TIER.INSTITUTIONAL_STUDENT]: 1,
  [TIER.STUDENT_MONTHLY]: 2,
  [TIER.STUDENT_ANNUAL]: 3,
  [TIER.LIFETIME]: 4,
  [TIER.INSTITUTIONAL_INSTRUCTOR]: 5,
};

function isUpgrade(fromTier, toTier) {
  return (TIER_RANK[toTier] || 0) > (TIER_RANK[fromTier] || 0);
}

// ─── COMPETITOR COMPARISON DATA ───
// Sources required for every claim. Flag uncertain items.
const COMPETITORS = {
  uworld: {
    name: 'UWorld',
    price: '$369–$499',
    priceSource: 'uworld.com/nursing/nclex (accessed 2026-08-14)',
    priceNote: '90-day access; 360-day plan $499',
    features: {
      caseBank: false, // Case studies, not NGN-style
      spacedRepetition: false,
      aiTutor: false,
      anatomyLab: false,
      ngnFocus: false, // Traditional Qbank, not NGN-native
      internationalSupport: false,
    },
  },
  kaplan: {
    name: 'Kaplan',
    price: '$399–$599',
    priceSource: 'kaplannursing.com (accessed 2026-08-14)',
    priceNote: 'Self-paced $399; live instruction $599',
    features: {
      caseBank: false,
      spacedRepetition: false,
      aiTutor: false,
      anatomyLab: false,
      ngnFocus: 'partial', // Added NGN but not native
      internationalSupport: false,
    },
  },
  ati: {
    name: 'ATI',
    price: '$500+',
    priceSource: 'atitesting.com (accessed 2026-08-14)',
    priceNote: 'Comprehensive package; institutional pricing varies',
    features: {
      caseBank: false,
      spacedRepetition: false,
      aiTutor: false,
      anatomyLab: false,
      ngnFocus: 'partial',
      internationalSupport: false,
    },
  },
  archer: {
    name: 'ArcherReview',
    price: '$89–$199',
    priceSource: 'archerreview.com (accessed 2026-08-14)',
    priceNote: 'Question bank only; no NGN cases',
    features: {
      caseBank: false,
      spacedRepetition: false,
      aiTutor: false,
      anatomyLab: false,
      ngnFocus: false,
      internationalSupport: false,
    },
  },
  obioma: {
    name: 'Obioma',
    price: '$19/mo or $99/yr',
    priceSource: 'obiomacare.com/pricing',
    features: {
      caseBank: true,
      spacedRepetition: true,
      aiTutor: true,
      anatomyLab: true,
      ngnFocus: true,
      internationalSupport: true,
    },
  },
};

// ─── FAQ DATA ───
const FAQ = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel from your account dashboard or the Stripe Customer Portal. You keep access until your billing period ends, then your account drops to Free with all progress preserved.',
  },
  {
    question: 'What happens after my trial ends?',
    answer: 'If you don\'t cancel, your card is charged the plan price (monthly or annual). We send a reminder email 2 days before your trial ends. No surprise charges.',
  },
  {
    question: 'Is the Lifetime plan really one-time?',
    answer: 'Yes. Pay $47 once. You get all current features plus every future update and new case study we release. No subscriptions, no renewals.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Monthly and Annual plans: full refund within 7 days of payment (not trial). Lifetime: 14-day money-back guarantee. Contact support@obiomacare.com.',
  },
  {
    question: 'Can I switch from Monthly to Annual?',
    answer: 'Yes. Upgrade anytime from your account dashboard. We prorate the remainder of your current month toward the annual plan.',
  },
  {
    question: 'What\'s included in the Free plan?',
    answer: 'All educational articles, reference pages, and a limited quiz set (10 questions per day). No credit card required.',
  },
  {
    question: 'Do nursing schools get a discount?',
    answer: 'Yes. Contact us at partnerships@obiomacare.com for institutional pricing. We offer per-seat billing, cohort dashboards, and instructor analytics.',
  },
  {
    question: 'How do the NGN case studies work?',
    answer: 'Each case follows the NCSBN Clinical Judgment Measurement Model: recognize cues, analyze cues, prioritize hypotheses, generate solutions, take action, evaluate outcomes. AI explains your reasoning at each step.',
  },
];

// ─── EXPORTS ───
module.exports = {
  TIER,
  INTERVAL,
  PLANS,
  FEATURE,
  ENTITLEMENTS,
  hasAccess,
  TIER_RANK,
  isUpgrade,
  COMPETITORS,
  FAQ,
};
