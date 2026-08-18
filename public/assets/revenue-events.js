/* Obioma Revenue OS — canonical funnel events client.
 * Injected into every page at build time. Fires canonical events with
 * timestamp + session id (+ tier where relevant). No GA, no cookies needed
 * for core events (session id is a first-party localStorage UUID).
 */
(function () {
  if (window.__OBIOMA_EVENTS__) return;
  window.__OBIOMA_EVENTS__ = true;

  var SESSION_KEY = 'obioma_session_id';
  var sessionId = null;
  try {
    sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch (e) {
    sessionId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  var TYPES = {
    guide_view: 1, checklist_download: 1, signup_started: 1, signup_completed: 1,
    assessment_started: 1, assessment_completed: 1, pricing_viewed: 1,
    checkout_started: 1, checkout_completed: 1, subscription_canceled: 1
  };

  function track(type, props) {
    if (!TYPES[type]) { console.warn('[obioma-events] unknown type', type); return; }
    var payload = {
      type: type,
      ts: new Date().toISOString(),
      session: sessionId,
      tier: (props && props.tier) || null,
      page: location.pathname,
      guide: (props && props.guide) || null
    };
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/event', { method: 'POST', keepalive: true, body: body, headers: { 'Content-Type': 'application/json' } });
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  window.ObiomaEvents = { track: track, sessionId: function () { return sessionId; } };

  /* ── Auto-fire page-level events ── */
  function fire() {
    var path = location.pathname;
    // guide_view: /content/<slug>.html
    var m = path.match(/^\/content\/([^\/]+)\.html$/);
    if (m) { track('guide_view', { guide: m[1] }); return; }
    if (path === '/pricing' || path === '/pricing.html') { track('pricing_viewed'); return; }
  }
  if (document.readyState === 'complete') fire();
  else window.addEventListener('load', fire);

  /* checklist_download: attach to any checklist download CTA */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a[data-obioma-event]') : null;
    if (el) {
      track(el.getAttribute('data-obioma-event'), { tier: el.getAttribute('data-tier') || null });
    }
  });
})();
