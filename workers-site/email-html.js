/**
 * Revenue OS Phase 2 — branded HTML renderer for the E0/E2/E4/E7/E10
 * sequence emails. The plain-text body in email-copy.js stays the single
 * source of copy; this module re-styles it into the same design language
 * as the legacy emailTemplate() (navy header, coral CTA, light footer)
 * so every Obioma email shares one look.
 *
 * The plain-text body includes footer(v) lines ("—", signature, reason,
 * "Unsubscribe anytime: <url>"); the HTML renderer detects the footer
 * separator and re-renders those lines as a styled footer instead of
 * duplicating them.
 */

const NAVY = '#1a365d'
const CORAL = '#c53030'
const GRAY = '#4a5568'
const LIGHT_GRAY = '#718096'
const BG = '#f7fafc'

const LOGO_URL = 'https://obiomacare.com/assets/logo-email.png'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Bare https?:// URLs -> links. Run AFTER esc() so escaped chars stay safe.
function linkify(s) {
  return s.replace(/(https?:\/\/[^\s<]+)/g, (m) => {
    const href = m.replace(/&amp;/g, '&')
    return `<a href="${esc(href)}" style="color:${NAVY};text-decoration:underline;">${m}</a>`
  })
}

/**
 * Split plain-text body into { paragraphs, footerLines }.
 * The footer begins at the paragraph that starts with "—" (the footer
 * separator shares a paragraph with the signature via single newlines).
 */
export function splitBody(bodyText) {
  const paras = String(bodyText).split(/\n{2,}/)
  const idx = paras.findIndex((p) => /^—(\n|$)/.test(p.trimStart()))
  if (idx === -1) return { paragraphs: paras, footerLines: [] }
  const footerLines = paras[idx].split('\n').slice(1) // drop the "—" line itself
  return { paragraphs: paras.slice(0, idx), footerLines }
}

/** Plain paragraphs -> <p> HTML with <br> for single newlines. */
function paragraphsToHtml(paragraphs) {
  return paragraphs
    .map((para) => {
      const inner = para
        .split('\n')
        .map(esc)
        .join('<br>')
      return `<p style="margin:0 0 16px 0;color:${GRAY};font-size:16px;line-height:1.7;">${linkify(inner)}</p>`
    })
    .join('\n')
}

/**
 * Footer lines -> styled footer HTML.
 * Recognizes the "Unsubscribe anytime: <url>" line and turns it into a link.
 */
function footerToHtml(footerLines) {
  const items = footerLines.map((line) => {
    const m = line.match(/^Unsubscribe anytime:\s*(https?:\/\/\S+)\s*$/)
    if (m) {
      return `<p style="margin:0 0 8px 0;font-size:12px;"><a href="${esc(m[1])}" style="color:${LIGHT_GRAY};text-decoration:underline;">Unsubscribe anytime</a></p>`
    }
    return `<p style="margin:0 0 8px 0;color:${LIGHT_GRAY};font-size:13px;">${esc(line)}</p>`
  })
  return items.join('\n')
}

/** Full branded HTML email. ctaText/ctaUrl optional — omitted renders no button. */
export function emailHtml({ subject, bodyText, ctaText, ctaUrl }) {
  const { paragraphs, footerLines } = splitBody(bodyText)
  const body = paragraphsToHtml(paragraphs)
  const footer = footerToHtml(footerLines)

  const ctaBlock = ctaUrl && ctaText
    ? `
        <!-- CTA -->
        <tr>
          <td style="padding:8px 40px 36px 40px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="background:${CORAL};border-radius:8px;">
                  <a href="${esc(ctaUrl)}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;">${esc(ctaText)}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(subject)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

        <!-- Header / Logo -->
        <tr>
          <td style="background:${NAVY};padding:28px 40px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td>
                  <img src="${LOGO_URL}" alt="Obioma" width="120" height="33" style="display:block;">
                </td>
              </tr>
            </table>
            <p style="margin:6px 0 0 0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;text-transform:uppercase;">Clinical Judgment, Mastered</p>
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding:40px 40px 24px 40px;">
            ${body}
          </td>
        </tr>

        ${ctaBlock}

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px;text-align:center;">
            ${footer}
            <p style="margin:12px 0 0 0;color:#a0aec0;font-size:11px;">
              <a href="https://obiomacare.com" style="color:#a0aec0;text-decoration:underline;">obiomacare.com</a> ·
              <a href="https://obiomacare.com/privacy.html" style="color:#a0aec0;text-decoration:underline;">Privacy</a> ·
              <a href="https://obiomacare.com/terms.html" style="color:#a0aec0;text-decoration:underline;">Terms</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim()
}
