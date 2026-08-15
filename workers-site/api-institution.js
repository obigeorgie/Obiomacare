/**
 * ObiomaCare Institutional Dashboard
 * Cohort management + aggregate analytics (no individual PII)
 *
 * Data model:
 * - KV `cohort:{id}` → { id, name, instructorEmail, code, students[], assignments[], createdAt }
 * - KV `cohort_member:{email}` → { cohortId, role, joinedAt }
 * - Analytics: aggregate only (percent by topic, class averages)
 */

// TIER constant (duplicated to avoid circular import issues)
const TIER = {
  FREE: 'free',
  STUDENT_MONTHLY: 'student_monthly',
  STUDENT_ANNUAL: 'student_annual',
  LIFETIME: 'lifetime',
  INSTITUTIONAL_INSTRUCTOR: 'institutional_instructor',
  INSTITUTIONAL_STUDENT: 'institutional_student',
};

import { getAuthUser } from './auth.js';

// ─── HELPERS ───

function getUsersKV(env) {
  if (env && env.users) return env.users;
  try { return users; } catch { return null; }
}

async function getCohort(env, cohortId) {
  const kv = getUsersKV(env);
  if (!kv) return null;
  const data = await kv.get(`cohort:${cohortId}`);
  return data ? JSON.parse(data) : null;
}

async function setCohort(env, cohortId, data) {
  const kv = getUsersKV(env);
  if (!kv) throw new Error('KV not bound');
  await kv.put(`cohort:${cohortId}`, JSON.stringify(data));
}

async function getMemberCohort(env, email) {
  const kv = getUsersKV(env);
  if (!kv) return null;
  const data = await kv.get(`cohort_member:${email.toLowerCase()}`);
  return data ? JSON.parse(data) : null;
}

async function setMemberCohort(env, email, data) {
  const kv = getUsersKV(env);
  if (!kv) throw new Error('KV not bound');
  await kv.put(`cohort_member:${email.toLowerCase()}`, JSON.stringify(data));
}

async function deleteMemberCohort(env, email) {
  const kv = getUsersKV(env);
  if (!kv) return;
  await kv.delete(`cohort_member:${email.toLowerCase()}`);
}

function generateCohortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── ROUTE HANDLERS ───

// POST /api/institution/cohort — Create a cohort (instructor only)
async function handleCreateCohort(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);
  if (user.tier !== TIER.INSTITUTIONAL_INSTRUCTOR) {
    return jsonResponse({ error: 'Institutional instructor access required' }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const { name } = body;

  if (!name || name.length < 2) {
    return jsonResponse({ error: 'Cohort name required' }, 400);
  }

  const cohortId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const code = generateCohortCode();

  const cohort = {
    id: cohortId,
    name: name.trim(),
    instructorEmail: user.email,
    code,
    students: [],
    assignments: [],
    analytics: {
      totalAssessments: 0,
      avgScore: 0,
      topicBreakdown: {},
      lastUpdated: null,
    },
    createdAt: Date.now(),
  };

  await setCohort(env, cohortId, cohort);

  return jsonResponse({ success: true, cohort: { id: cohortId, name: cohort.name, code } });
}

// GET /api/institution/cohorts — List instructor's cohorts
async function handleListCohorts(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  // Check if user is in any cohort (as student)
  const memberData = await getMemberCohort(env, user.email);
  if (memberData) {
    const cohort = await getCohort(env, memberData.cohortId);
    if (cohort) {
      return jsonResponse({
        role: 'student',
        cohort: {
          id: cohort.id,
          name: cohort.name,
          instructor: cohort.instructorEmail,
        },
      });
    }
  }

  // Instructor: list their cohorts
  if (user.tier !== TIER.INSTITUTIONAL_INSTRUCTOR) {
    return jsonResponse({ cohorts: [], role: 'none' });
  }

  // List all cohorts by instructor (scanning KV — inefficient but OK for small scale)
  // For production, consider a D1 database or indexed KV structure
  const kv = getUsersKV(env);
  if (!kv) return jsonResponse({ error: 'KV not bound' }, 500);

  const { keys } = await kv.list({ prefix: 'cohort:c-' });
  const cohorts = [];
  for (const key of keys.slice(0, 50)) {
    const data = await kv.get(key.name);
    if (data) {
      const c = JSON.parse(data);
      if (c.instructorEmail === user.email) {
        cohorts.push({
          id: c.id,
          name: c.name,
          code: c.code,
          studentCount: c.students.length,
          createdAt: c.createdAt,
        });
      }
    }
  }

  return jsonResponse({ cohorts, role: 'instructor' });
}

// POST /api/institution/join — Student joins a cohort via code
async function handleJoinCohort(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const body = await request.json().catch(() => ({}));
  const { code } = body;

  if (!code || code.length !== 6) {
    return jsonResponse({ error: 'Valid 6-character join code required' }, 400);
  }

  // Find cohort by code
  const kv = getUsersKV(env);
  if (!kv) return jsonResponse({ error: 'KV not bound' }, 500);

  const { keys } = await kv.list({ prefix: 'cohort:c-' });
  let cohort = null;
  for (const key of keys) {
    const data = await kv.get(key.name);
    if (data) {
      const c = JSON.parse(data);
      if (c.code === code.toUpperCase()) {
        cohort = c;
        break;
      }
    }
  }

  if (!cohort) {
    return jsonResponse({ error: 'Invalid join code' }, 404);
  }

  // Check if already in a cohort
  const existing = await getMemberCohort(env, user.email);
  if (existing && existing.cohortId !== cohort.id) {
    return jsonResponse({ error: 'Already in a different cohort. Contact your instructor.' }, 409);
  }

  // Add student to cohort
  if (!cohort.students.find(s => s.email === user.email)) {
    cohort.students.push({
      email: user.email,
      joinedAt: Date.now(),
    });
    await setCohort(env, cohort.id, cohort);
  }

  await setMemberCohort(env, user.email, {
    cohortId: cohort.id,
    role: 'student',
    joinedAt: Date.now(),
  });

  return jsonResponse({
    success: true,
    cohort: { id: cohort.id, name: cohort.name },
  });
}

// GET /api/institution/cohort/:id — Get cohort details + analytics (instructor only)
async function handleGetCohort(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/institution\/cohort\/([^\/]+)/);
  const cohortId = match ? match[1] : null;

  if (!cohortId) return jsonResponse({ error: 'Cohort ID required' }, 400);

  const cohort = await getCohort(env, cohortId);
  if (!cohort) return jsonResponse({ error: 'Cohort not found' }, 404);

  // Authorization: instructor owns the cohort, or student is a member
  const isInstructor = cohort.instructorEmail === user.email && user.tier === TIER.INSTITUTIONAL_INSTRUCTOR;
  const isStudent = cohort.students.some(s => s.email === user.email);

  if (!isInstructor && !isStudent) {
    return jsonResponse({ error: 'Access denied' }, 403);
  }

  if (isStudent) {
    // Students see limited info
    return jsonResponse({
      cohort: {
        id: cohort.id,
        name: cohort.name,
        instructor: cohort.instructorEmail,
        assignments: cohort.assignments,
      },
      role: 'student',
    });
  }

  // Instructor sees everything
  return jsonResponse({
    cohort: {
      id: cohort.id,
      name: cohort.name,
      code: cohort.code,
      instructor: cohort.instructorEmail,
      students: cohort.students,
      assignments: cohort.assignments,
      analytics: cohort.analytics,
      createdAt: cohort.createdAt,
    },
    role: 'instructor',
  });
}

// POST /api/institution/cohort/:id/assign — Assign content (instructor only)
async function handleAssignContent(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/institution\/cohort\/([^\/]+)\/assign/);
  const cohortId = match ? match[1] : null;

  if (!cohortId) return jsonResponse({ error: 'Cohort ID required' }, 400);

  const cohort = await getCohort(env, cohortId);
  if (!cohort) return jsonResponse({ error: 'Cohort not found' }, 404);

  if (cohort.instructorEmail !== user.email || user.tier !== TIER.INSTITUTIONAL_INSTRUCTOR) {
    return jsonResponse({ error: 'Instructor access required' }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const { type, title, contentId, dueDate } = body;

  if (!type || !title) {
    return jsonResponse({ error: 'type and title required' }, 400);
  }

  const assignment = {
    id: `a-${Date.now()}`,
    type, // 'readiness', 'case_study', 'quiz'
    title,
    contentId,
    dueDate: dueDate || null,
    assignedAt: Date.now(),
    completedBy: [], // emails (aggregate only, no PII in analytics)
  };

  cohort.assignments.push(assignment);
  await setCohort(env, cohortId, cohort);

  return jsonResponse({ success: true, assignment });
}

// POST /api/institution/analytics/:cohortId — Submit aggregate score (student → updates cohort analytics)
async function handleSubmitAnalytics(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/institution\/analytics\/([^\/]+)/);
  const cohortId = match ? match[1] : null;

  if (!cohortId) return jsonResponse({ error: 'Cohort ID required' }, 400);

  const member = await getMemberCohort(env, user.email);
  if (!member || member.cohortId !== cohortId) {
    return jsonResponse({ error: 'Not a member of this cohort' }, 403);
  }

  const cohort = await getCohort(env, cohortId);
  if (!cohort) return jsonResponse({ error: 'Cohort not found' }, 404);

  const body = await request.json().catch(() => ({}));
  const { assessmentType, topicScores, overallScore } = body;

  if (!topicScores || typeof overallScore !== 'number') {
    return jsonResponse({ error: 'topicScores and overallScore required' }, 400);
  }

  // Update aggregate analytics (no individual PII stored)
  const analytics = cohort.analytics || {};
  analytics.totalAssessments = (analytics.totalAssessments || 0) + 1;

  // Running average
  const prevAvg = analytics.avgScore || 0;
  const n = analytics.totalAssessments;
  analytics.avgScore = Math.round(((prevAvg * (n - 1)) + overallScore) * 100 / n) / 100;

  // Topic breakdown (percent correct by topic)
  if (!analytics.topicBreakdown) analytics.topicBreakdown = {};
  for (const [topic, score] of Object.entries(topicScores)) {
    if (!analytics.topicBreakdown[topic]) {
      analytics.topicBreakdown[topic] = { total: 0, count: 0, avg: 0 };
    }
    const t = analytics.topicBreakdown[topic];
    t.total += score;
    t.count += 1;
    t.avg = Math.round((t.total / t.count) * 100) / 100;
  }

  // Weak topics (below 70% average)
  analytics.weakTopics = Object.entries(analytics.topicBreakdown)
    .filter(([_, data]) => data.avg < 0.7)
    .map(([topic, data]) => ({ topic, avg: data.avg, count: data.count }))
    .sort((a, b) => a.avg - b.avg);

  // Strong topics (above 85%)
  analytics.strongTopics = Object.entries(analytics.topicBreakdown)
    .filter(([_, data]) => data.avg >= 0.85)
    .map(([topic, data]) => ({ topic, avg: data.avg, count: data.count }))
    .sort((a, b) => b.avg - a.avg);

  analytics.lastUpdated = Date.now();
  cohort.analytics = analytics;
  await setCohort(env, cohortId, cohort);

  return jsonResponse({
    success: true,
    analytics: {
      avgScore: analytics.avgScore,
      totalAssessments: analytics.totalAssessments,
      weakTopics: analytics.weakTopics,
      strongTopics: analytics.strongTopics,
    },
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
  handleCreateCohort,
  handleListCohorts,
  handleJoinCohort,
  handleGetCohort,
  handleAssignContent,
  handleSubmitAnalytics,
};
