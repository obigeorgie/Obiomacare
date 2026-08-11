const path = require('path');

// Load .env from script's parent directory (obioma-care)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const fs = require('fs');

// ─── CONFIG ───────────────────────────────────────────────────────
const SENDER_NAME = 'Obioma Care';
const SENDER_EMAIL = process.env.SMTP_USER || 'admin@obiomacare.com';
const DELAY_MS = 30000; // 30 seconds between emails
const TRACKING_FILE = path.join(__dirname, '..', 'content-nursing', 'backlink-outreach-tracking.json');

// ─── EMAILS TO SEND ───────────────────────────────────────────────
const outreachEmails = [
  {
    id: 'nsna-resources',
    target: 'NSNA (National Student Nurses\' Association)',
    to: 'nsna@nsna.org',
    subject: 'Free NCLEX resource suggestion for NSNA members',
    body: `Hi there,

I'm the founder of Obiomacare — we create free NCLEX study guides and clinical judgment training tools specifically for nursing students.

I've been following NSNA's work supporting student nurses across the country. Your organization does incredible work advocating for the next generation of nurses.

I'd love to suggest adding our free NCLEX resources to your member benefits or resource page:

• NCLEX Lab Values Cheat Sheet — Essential reference ranges with clinical significance
• Pharmacology Mnemonics Guide — 50+ memory aids for drug classes
• NGN Clinical Judgment Case Studies — Step-by-step Next Generation NCLEX training
• ABG Interpretation Guide — ROME mnemonic with practice questions
• Types of Shock Complete Guide — 6 shock types with comparison table

All completely free, no signup required. They've helped thousands of nursing students prepare for the new NCLEX format.

Would you consider adding them? Happy to provide any additional information you need.

Either way, thank you for everything you do for student nurses!

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'chamberlain-resources',
    target: 'Chamberlain University',
    to: 'cuadmissions@chamberlain.edu',
    subject: 'Free NCLEX study resources for Chamberlain students',
    body: `Hi Chamberlain Academic Resources Team,

I'm the founder of Obiomacare — we develop free NCLEX study materials and clinical judgment training tools for nursing students.

I came across Chamberlain's Academic Resources page and noticed you provide helpful study materials for your nursing students. I'd love to suggest adding our free NCLEX resources as supplementary study aids:

• NCLEX Lab Values Reference — Comprehensive cheat sheet with normal ranges and clinical implications
• ABG Interpretation Guide — ROME mnemonic, compensation patterns, and NGN-style practice questions
• Types of Shock Comparison — Side-by-side comparison with the SHOCK-ED mnemonic
• Pharmacology Mnemonics — Memory aids for major drug classes
• EKG Interpretation Guide — Rhythm recognition and 12-lead basics
• OB Labor Stages & Fetal Monitoring — Complete NCLEX guide with NGN case studies

All resources are completely free with no signup required. Many nursing students have found them helpful for NCLEX prep.

Would you consider adding them to your resource list? I'd be happy to provide additional details or custom materials if helpful.

Thank you for supporting your nursing students!

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'loyola-resources',
    target: 'Loyola University New Orleans — Dr. Todoran',
    to: 'ctodoran@loyno.edu',
    subject: 'Free NCLEX resources for Loyola nursing students',
    body: `Hi Dr. Todoran,

I'm the founder of Obiomacare — we create free NCLEX study guides and clinical judgment training tools.

I came across Loyola's School of Nursing Resources page while researching nursing student support materials. I noticed you collect helpful resources for your students there.

I'd love to suggest adding our free NCLEX study guides as a supplementary resource:

• NCLEX Lab Values Cheat Sheet — Quick reference with clinical significance
• ABG Interpretation Guide — ROME/TIC TAC TOE methods with practice questions
• OB Labor Stages & Fetal Monitoring — Complete guide with NGN case studies
• Nursing Care Plan Templates — 10 examples with NANDA diagnoses
• Pediatric Milestones — Age-based developmental markers with immunization schedule

All completely free, no signup required. They align well with Loyola's tradition of providing comprehensive, accessible education.

Would you consider adding them to your resource page? I'm happy to discuss further or provide custom materials for your program.

Thank you for your dedication to nursing education!

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'leveluprn-collab',
    target: 'LevelUp RN',
    to: 'info@leveluprn.com',
    subject: 'Collaboration idea for LevelUp RN students',
    body: `Hi LevelUp RN Team,

I'm the founder of Obiomacare — we help nursing students pass the NCLEX Next Generation exam through free clinical judgment training and study guides.

I've been following LevelUp RN's flashcards and study materials — they're fantastic resources for nursing students. I love how you make complex topics approachable.

I'd love to explore a collaboration that would benefit both of our audiences:

Idea 1: Cross-promote resources — we could feature your flashcards in our study guides, and you could share our free NCLEX cheat sheets with your community.

Idea 2: Guest content swap — we write a guest post for your blog, you share your expertise with our audience.

Idea 3: Free resource bundle — We create a joint "NCLEX Essentials Pack" combining your flashcards with our clinical judgment guides.

We have a growing audience of nursing students who would love your products. Interested in exploring this?

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'ncsbn-resources',
    target: 'NCSBN — Dr. Nancy Spector',
    to: 'nspector@ncsbn.org',
    subject: 'Free NCLEX clinical judgment resources for nursing students',
    body: `Hi Dr. Spector,

I'm the founder of Obiomacare — we create free NCLEX study guides with a focus on clinical judgment training for the Next Generation NCLEX.

I've been following NCSBN's development of the new NCLEX format and deeply appreciate the research and rigor behind the Clinical Judgment Measurement Model.

I noticed NCSBN provides resources for educators and students on your website. I'd love to suggest our free clinical judgment training materials as supplementary resources:

• NCLEX Clinical Judgment Case Studies — Step-by-step NGN-style practice
• CJMM Framework Guide — Recognize cues, analyze cues, prioritize hypotheses
• NGN Question Type Breakdown — Case studies, bow-tie, trend questions
• Lab Values with Clinical Significance — Recognition cue training
• Pediatric Milestones NCLEX Guide — Developmental markers with NGN practice

All resources are completely free, align with the NCSBN Clinical Judgment Measurement Model, and include proper citations.

Would you consider adding them as a student resource? I'm happy to adapt them to meet NCSBN standards if needed.

Thank you for advancing nursing licensure standards!

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'nurseorg-guestpost',
    target: 'Nurse.org',
    to: 'editor@nurse.org', // fallback — may need contact form
    subject: 'Guest post idea: "5 NCLEX Study Mistakes That Cost Students Points"',
    body: `Hi Nurse.org Editorial Team,

I've been following Nurse.org for years — your coverage of nursing education and student support is some of the best in the industry.

I'm the founder of Obiomacare, and I'd love to contribute a guest post to Nurse.org. Here's an idea that resonates with your audience:

"5 NCLEX Study Mistakes That Cost Students Points (And How to Avoid Them)"

This would be a data-backed piece based on patterns we've observed helping nursing students prepare for the Next Generation NCLEX. It would cover:
• Mistake #1: Memorizing without understanding clinical judgment
• Mistake #2: Ignoring the new NGN question formats
• Mistake #3: Not practicing with timed case studies
• Mistake #4: Focusing only on content, not prioritization
• Mistake #5: Studying alone instead of using active recall

No promotional content — just genuinely helpful material with a brief author bio linking back to our free resources.

Would this be a good fit for Nurse.org?

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'dailynurse-guestpost',
    target: 'Daily Nurse',
    to: 'editor@dailynurse.com', // fallback — may need contact form
    subject: 'Guest post: "How the New NCLEX Is Different (And What Students Must Know)"',
    body: `Hi Daily Nurse Team,

I'm a long-time reader of Daily Nurse — your mix of news and practical resources is exactly what working nurses need.

I'm the founder of Obiomacare, and I'd love to contribute a guest post about the Next Generation NCLEX:

"How the New NCLEX Is Different From the Old One (And What Nursing Students Must Know)"

This would cover:
• The shift from memorization to clinical judgment
• New question types: case studies, bow-tie, trend
• Why the old study methods don't work anymore
• Evidence-based strategies for NGN success
• Free resources students can use right now

I can also adapt the topic to fit your editorial calendar. No promotional content — just useful information with a brief author bio.

Interested?

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'minoritynurse-guestpost',
    target: 'Minority Nurse',
    to: 'editor@minoritynurse.com', // fallback — may need contact form
    subject: 'Guest post idea: "Resources for International Nurses Seeking U.S. Licensure"',
    body: `Hi Minority Nurse Team,

I've been reading Minority Nurse for years and deeply appreciate your focus on diversity and supporting nurses from all backgrounds.

I'm the founder of Obiomacare, and I'd love to contribute a guest post that aligns with your mission:

"The Complete Guide for International Nurses Seeking U.S. Licensure and NCLEX Success"

This would cover:
• Credential evaluation services (CES, ERES, CGFNS)
• State-by-state licensure requirements
• English proficiency exams (IELTS, TOEFL, OET)
• NCLEX registration for foreign-trained nurses
• Common challenges and how to overcome them
• Success stories and resources

This topic is especially relevant given the growing number of internationally educated nurses entering the U.S. workforce.

Would this be a good fit for your audience?

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'allnurses-resources',
    target: 'AllNurses Forums',
    to: 'admin@allnurses.com', // fallback — may need contact form
    subject: 'Free NCLEX resources for AllNurses student community',
    body: `Hi AllNurses Team,

I've been a member of AllNurses for years and have always valued the community and resources you provide.

I'm the founder of Obiomacare — we create free NCLEX study guides and clinical judgment training materials.

I'd love to suggest adding our free resources to your student nursing section:

• NCLEX Lab Values Reference — Quick reference guide
• ABG Interpretation — Step-by-step with practice questions
• OB Labor Stages & Fetal Monitoring — Complete NCLEX guide
• Nursing Care Plan Templates — 10 examples with NANDA
• Pediatric Milestones — Age-based developmental markers
• EKG Interpretation — Rhythm recognition guide

All completely free, no signup required. They've been helpful to many nursing students preparing for the new NGN format.

Would you consider adding them to your resources list?

Best regards,
Obioma Care
Obiomacare.com
${SENDER_EMAIL}`
  },
  {
    id: 'reddit-studentnurse',
    target: 'r/StudentNurse (mod mail)',
    to: null, // requires Reddit mod mail — cannot send via email
    subject: null,
    body: null // Reddit requires manual mod mail
  }
];

// ─── SETUP TRANSPORTER ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ─── TRACKING ─────────────────────────────────────────────────────
function loadTracking() {
  if (fs.existsSync(TRACKING_FILE)) {
    return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
  }
  return { sent: [], failed: [], lastRun: null };
}

function saveTracking(data) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

// ─── SEND WITH DELAY ──────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmail(email) {
  if (!email.to) {
    console.log(`⏭️  Skipping "${email.target}" — no email address (Reddit mod mail)`);
    return { status: 'skipped', reason: 'No email — use Reddit mod mail' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: email.to,
      subject: email.subject,
      text: email.body,
      replyTo: SENDER_EMAIL
    });
    console.log(`✅ Sent to ${email.target} (${email.to}) — ${info.messageId}`);
    return { status: 'sent', messageId: info.messageId, date: new Date().toISOString() };
  } catch (err) {
    console.error(`❌ Failed to send to ${email.target} (${email.to}): ${err.message}`);
    return { status: 'failed', error: err.message, date: new Date().toISOString() };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const tracking = loadTracking();
  const args = process.argv.slice(2);

  // Check for dry-run mode
  const dryRun = args.includes('--dry-run');
  const testOnly = args.includes('--test');

  console.log(`\n📧 Backlink Outreach Automation`);
  console.log(`   Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`   Delay:  ${DELAY_MS / 1000}s between emails`);
  console.log(`   Mode:   ${dryRun ? 'DRY RUN (no emails sent)' : testOnly ? 'TEST (sends 1 test email to yourself)' : 'LIVE (sending real emails)'}`);
  console.log(`   Total:  ${outreachEmails.length} targets\n`);

  if (testOnly) {
    // Send test email to yourself
    const testEmail = {
      target: 'Test (self)',
      to: SENDER_EMAIL,
      subject: '✅ Backlink outreach automation test',
      body: `This is a test email from the backlink outreach automation script.\n\nIf you received this, the automation is working correctly.\n\nNext step: run without --test to send real outreach emails.`
    };
    const result = await sendEmail(testEmail);
    console.log(`\nTest result: ${result.status}`);
    process.exit(result.status === 'sent' ? 0 : 1);
  }

  for (const email of outreachEmails) {
    // Skip already sent
    const alreadySent = tracking.sent.find(s => s.id === email.id);
    if (alreadySent) {
      console.log(`⏭️  Skipping "${email.target}" — already sent on ${alreadySent.date}`);
      continue;
    }

    if (dryRun) {
      console.log(`📝 [DRY RUN] Would send to: ${email.target} (${email.to || 'N/A'})`);
      console.log(`   Subject: ${email.subject || 'N/A'}`);
      // Don't track dry-runs as sent
      continue;
    } else {
      const result = await sendEmail(email);
      if (result.status === 'sent') {
        tracking.sent.push({ id: email.id, ...result });
      } else if (result.status === 'failed') {
        tracking.failed.push({ id: email.id, ...result });
      } else {
        tracking.sent.push({ id: email.id, ...result });
      }
      saveTracking(tracking);
      
      // Delay before next email (unless last one)
      if (email !== outreachEmails[outreachEmails.length - 1]) {
        process.stdout.write(`   ⏳ Waiting ${DELAY_MS / 1000}s...\n`);
        await sleep(DELAY_MS);
      }
    }
  }

  tracking.lastRun = new Date().toISOString();
  saveTracking(tracking);

  console.log(`\n✅ Done!`);
  console.log(`   Sent:    ${tracking.sent.length}`);
  console.log(`   Failed:  ${tracking.failed.length}`);
  console.log(`   Skipped: ${outreachEmails.length - tracking.sent.length - tracking.failed.length}`);
  console.log(`   Tracking: ${TRACKING_FILE}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
