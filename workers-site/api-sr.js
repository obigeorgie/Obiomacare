/**
 * ObiomaCare Spaced Repetition Engine
 * SM-2 algorithm (Anki-compatible simplified variant)
 *
 * Data model per user (KV key: `sr:{email}`):
 * {
 *   cards: [{ id, front, back, category, interval, repetition, easeFactor, nextReview, createdAt }],
 *   stats: { totalReviews, streakDays, longestStreak, lastReviewDate },
 *   settings: { dailyNewCards: 20, dailyReviewLimit: 100 }
 * }
 */

import { getAuthUser } from './auth.js';

// ─── SR CARD TYPES ───
// Cards are derived from readiness assessment items + user-curated content
const CARD_SOURCES = {
  READINESS: 'readiness',      // Auto-generated from missed readiness items
  USER: 'user',                // User-created flashcards
  IMPORT: 'import',            // Bulk-imported decks
};

// ─── SM-2 ALGORITHM ───

const GRADES = {
  AGAIN: 1,   // Failed — reset interval
  HARD: 2,    // Difficult — small interval increase
  GOOD: 3,    // Correct — standard interval
  EASY: 4,    // Easy — larger interval increase
};

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const EASY_BONUS = 1.3;
const HARD_PENALTY = 0.85;
const LAPSE_PENALTY = 0.5; // ease penalty on "Again"

function scheduleCard(card, grade) {
  const now = Date.now();
  let { interval = 0, repetition = 0, easeFactor = DEFAULT_EASE } = card;

  if (grade === GRADES.AGAIN) {
    // Lapse: reset repetition, reduce ease, short interval
    repetition = 0;
    interval = 1; // 1 day
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  } else {
    // Success: increase repetition and interval
    repetition += 1;

    if (repetition === 1) {
      interval = 1; // 1 day
    } else if (repetition === 2) {
      interval = 6; // 6 days
    } else {
      interval = Math.round(interval * easeFactor);
    }

    // Adjust ease factor based on grade
    if (grade === GRADES.HARD) {
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      interval = Math.round(interval * HARD_PENALTY);
    } else if (grade === GRADES.EASY) {
      easeFactor += 0.15;
      interval = Math.round(interval * EASY_BONUS);
    } else {
      // Good — no ease change
    }
  }

  // Cap interval at 365 days max
  interval = Math.min(interval, 365);

  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    interval,
    repetition,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReview,
    lastReviewed: now,
    reviewCount: (card.reviewCount || 0) + 1,
  };
}

// ─── KV HELPERS ───

function getSRKV(env) {
  if (env && env.users) return env.users; // Reuse users KV namespace
  try { return users; } catch { return null; }
}

async function getSRData(env, email) {
  const kv = getSRKV(env);
  if (!kv) return null;
  const data = await kv.get(`sr:${email.toLowerCase()}`);
  return data ? JSON.parse(data) : null;
}

async function setSRData(env, email, data) {
  const kv = getSRKV(env);
  if (!kv) throw new Error('KV not bound');
  await kv.put(`sr:${email.toLowerCase()}`, JSON.stringify(data));
}

function createDefaultSRData() {
  return {
    cards: [],
    stats: {
      totalReviews: 0,
      streakDays: 0,
      longestStreak: 0,
      lastReviewDate: null,
    },
    settings: {
      dailyNewCards: 20,
      dailyReviewLimit: 100,
    },
    sessionLog: [], // Today's review log
  };
}

// ─── SEED CARDS FROM READINESS ITEMS ───

function seedCardsFromReadiness(missedItems) {
  return missedItems.map((item, i) => ({
    id: `rd-${item.id || i}`,
    front: item.stem,
    back: item.rationale.substring(0, 200) + (item.rationale.length > 200 ? '...' : ''),
    category: item.category,
    source: CARD_SOURCES.READINESS,
    interval: 0,
    repetition: 0,
    easeFactor: DEFAULT_EASE,
    nextReview: Date.now(), // Due immediately
    createdAt: Date.now(),
    reviewCount: 0,
    originalItemId: item.id,
  }));
}

// ─── ROUTE HANDLERS ───

async function handleSRNext(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  let data = await getSRData(env, user.email);
  if (!data) {
    data = createDefaultSRData();
  }

  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);

  // Reset daily session log if it's a new day
  if (data.stats.lastReviewDate && data.stats.lastReviewDate < todayStart) {
    data.sessionLog = [];
  }

  // Find due cards (nextReview <= now)
  const dueCards = data.cards
    .filter(c => c.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);

  // Limit daily reviews
  const todayReviews = data.sessionLog?.length || 0;
  if (todayReviews >= data.settings.dailyReviewLimit) {
    return jsonResponse({
      done: true,
      message: 'Daily review limit reached. Come back tomorrow!',
      stats: data.stats,
      dueCount: dueCards.length,
      reviewedToday: todayReviews,
    });
  }

  // Prioritize: lapses/relearning > reviews > new cards
  const learningCards = dueCards.filter(c => c.repetition === 0);
  const reviewCards = dueCards.filter(c => c.repetition > 0);

  let nextCard = null;
  if (learningCards.length > 0) {
    nextCard = learningCards[0];
  } else if (reviewCards.length > 0) {
    nextCard = reviewCards[0];
  }

  if (!nextCard) {
    return jsonResponse({
      done: true,
      message: 'All caught up! No cards due for review.',
      stats: data.stats,
      dueCount: 0,
      reviewedToday: todayReviews,
      totalCards: data.cards.length,
    });
  }

  return jsonResponse({
    done: false,
    card: {
      id: nextCard.id,
      front: nextCard.front,
      category: nextCard.category,
      source: nextCard.source,
    },
    stats: data.stats,
    dueCount: dueCards.length,
    reviewedToday: todayReviews,
    totalCards: data.cards.length,
  });
}

async function handleSRAnswer(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const body = await request.json().catch(() => ({}));
  const { cardId, grade } = body;

  if (!cardId || !grade || !Object.values(GRADES).includes(grade)) {
    return jsonResponse({ error: 'cardId and grade (1-4) required' }, 400);
  }

  let data = await getSRData(env, user.email);
  if (!data) {
    return jsonResponse({ error: 'No SR data found' }, 404);
  }

  const cardIndex = data.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return jsonResponse({ error: 'Card not found' }, 404);
  }

  const card = data.cards[cardIndex];
  const updatedCard = scheduleCard(card, grade);
  data.cards[cardIndex] = updatedCard;

  // Update stats
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);

  data.stats.totalReviews += 1;

  // Streak logic
  if (!data.stats.lastReviewDate || data.stats.lastReviewDate < todayStart - 86400000) {
    // Missed a day — reset streak
    data.stats.streakDays = 1;
  } else if (data.stats.lastReviewDate < todayStart) {
    // New day, streak continues
    data.stats.streakDays += 1;
    if (data.stats.streakDays > data.stats.longestStreak) {
      data.stats.longestStreak = data.stats.streakDays;
    }
  }
  // else: same day, streak unchanged

  data.stats.lastReviewDate = now;

  // Session log
  if (!data.sessionLog) data.sessionLog = [];
  data.sessionLog.push({
    cardId,
    grade,
    timestamp: now,
    interval: updatedCard.interval,
  });

  await setSRData(env, user.email, data);

  return jsonResponse({
    success: true,
    card: updatedCard,
    stats: data.stats,
    nextDue: updatedCard.nextReview,
  });
}

async function handleSRStats(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  let data = await getSRData(env, user.email);
  if (!data) {
    data = createDefaultSRData();
  }

  const now = Date.now();
  const dueCount = data.cards.filter(c => c.nextReview <= now).length;
  const learningCount = data.cards.filter(c => c.repetition === 0).length;
  const matureCount = data.cards.filter(c => c.repetition >= 2).length;

  return jsonResponse({
    stats: data.stats,
    counts: {
      total: data.cards.length,
      due: dueCount,
      learning: learningCount,
      mature: matureCount,
    },
    settings: data.settings,
  });
}

async function handleSRAddCard(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const body = await request.json().catch(() => ({}));
  const { front, back, category = 'general' } = body;

  if (!front || !back) {
    return jsonResponse({ error: 'front and back required' }, 400);
  }

  let data = await getSRData(env, user.email);
  if (!data) {
    data = createDefaultSRData();
  }

  const card = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    front,
    back,
    category,
    source: CARD_SOURCES.USER,
    interval: 0,
    repetition: 0,
    easeFactor: DEFAULT_EASE,
    nextReview: Date.now(),
    createdAt: Date.now(),
    reviewCount: 0,
  };

  data.cards.push(card);
  await setSRData(env, user.email, data);

  return jsonResponse({ success: true, card });
}

async function handleSRImportFromReadiness(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const body = await request.json().catch(() => ({}));
  const { missedItems } = body;

  if (!Array.isArray(missedItems) || missedItems.length === 0) {
    return jsonResponse({ error: 'missedItems array required' }, 400);
  }

  let data = await getSRData(env, user.email);
  if (!data) {
    data = createDefaultSRData();
  }

  const newCards = seedCardsFromReadiness(missedItems);
  data.cards.push(...newCards);
  await setSRData(env, user.email, data);

  return jsonResponse({
    success: true,
    imported: newCards.length,
    totalCards: data.cards.length,
  });
}

// ─── EXPORTS ───

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export {
  handleSRNext,
  handleSRAnswer,
  handleSRStats,
  handleSRAddCard,
  handleSRImportFromReadiness,
  GRADES,
};
