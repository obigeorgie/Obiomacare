const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// SMTP config from .env
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@obiomacare.com',
    pass: 'WpinB:AQaB45ia6'
  }
});

// Prospects to email
const prospects = [
  {
    to: 'admissions@chamberlain.edu',
    subject: 'Free NCLEX resource for Chamberlain nursing students',
    body: `Hi there,

I'm Nnamdi, an RN and founder of Obioma Care — we create free NCLEX study guides and clinical judgment training tools for nursing students.

I came across Chamberlain's nursing resource page and noticed you collect helpful links for students. I'd love to suggest adding our free resources:

• NCLEX Lab Values Quick Reference — 40+ essential ranges with clinical context
• NGN Clinical Judgment Case Engine — 10 interactive scenarios using the NCSBN framework
• Electrolyte Mnemonics Cheat Sheet — SALT LOSS, MURDER, CATS (printable)

All completely free, no signup required. Built by an ER nurse with 15 years of experience.

We'd be honored to be included.

Either way, thank you for supporting nursing students!

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com
admin@obiomacare.com`
  },
  {
    to: 'nursing@wgu.edu',
    subject: 'Free NCLEX NGN resources for WGU nursing students',
    body: `Hi there,

I'm Nnamdi, an RN and founder of Obioma Care — we build free NCLEX Next Gen study tools for nursing students.

WGU's competency-based nursing program is impressive. I noticed your student resources page and thought our free tools would be a great fit:

• 74 Free NCLEX Study Guides — Lab values, pharmacology, body systems, specialty nursing
• Interactive NGN Case Engine — 10 clinical judgment scenarios with instant feedback
• Downloadable Cheat Sheets — Lab values, electrolytes, emergency drugs, ABG interpretation

Everything is free, requires no registration, and follows the NCSBN Clinical Judgment Measurement Model.

Would love to be included in your resource list.

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  },
  {
    to: 'nursing.admissions@jhu.edu',
    subject: 'Free clinical judgment resources for JH nursing students',
    body: `Hi there,

I'm Nnamdi, an ER nurse and founder of Obioma Care. I came across the JH nursing student resources page while researching clinical judgment training materials.

We recently built a free NGN Case Engine with 10 interactive clinical scenarios that follow the NCSBN's Clinical Judgment Measurement Model:

→ Recognize Cues → Analyze → Prioritize → Generate Solutions → Act → Evaluate

Students get immediate feedback with rationales. No signup required.

We also have 74 free study guides covering lab values, pharmacology, cardiac care, and more.

Would love to be included in your resource list, or happy to discuss a guest post on clinical judgment training if that would be valuable.

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  },
  {
    to: 'resources@nurse.org',
    subject: 'Free NCLEX NGN resource for Nurse.org students',
    body: `Hi there,

Long-time reader of Nurse.org — your content has helped me throughout my career. I'm Nnamdi, an RN and founder of Obioma Care.

We built a free NCLEX Next Gen training platform with:

• 74 evidence-based study guides
• 10 interactive clinical judgment cases
• Downloadable quick references
• NCSBN CJMM framework training

All free. No signup. No ads.

I noticed your student resources section and thought this would be a valuable addition for your readers preparing for the new NCLEX.

Would love to be included.

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  },
  {
    to: 'editor@dailynurse.com',
    subject: 'Free NCLEX resource suggestion for Daily Nurse',
    body: `Hi there,

I'm Nnamdi, an ER nurse and founder of Obioma Care — a free NCLEX Next Gen study platform.

We recently published 74 study guides + launched an interactive NGN Case Engine with 10 clinical judgment scenarios. Students practice the exact format the new NCLEX uses, with instant feedback.

Everything is free and requires no registration.

Thought this would be a great resource for Daily Nurse readers. Would love to be included in your resource list.

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  },
  {
    to: 'contact@freshrn.com',
    subject: 'Collaboration idea: NGN resources for new grads',
    body: `Hi there,

Love what you're doing at Fresh RN — helping new grads transition to practice is so needed.

I'm Nnamdi, an ER nurse and founder of Obioma Care. We build free NCLEX Next Gen training tools. I noticed your resource page focuses heavily on new grad transition — our clinical judgment framework is exactly what helps new grads think through scenarios on the floor.

A few collaboration ideas:
• Free resource for your audience — Custom NGN case study or cheat sheet
• Guest post — "How Clinical Judgment Training Helps New Grads Thrive"
• Resource page addition — Link to our free case engine

No promotional content — just genuinely useful material.

Interested?

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  },
  {
    to: 'info@nsna.org',
    subject: 'Free NCLEX NGN resource for NSNA members',
    body: `Hi there,

I'm Nnamdi, an RN and founder of Obioma Care — a free NCLEX Next Gen study platform.

The new NCLEX tests clinical judgment, not just knowledge recall. We built tools specifically for this transition:

• NGN Case Engine — 10 interactive scenarios following the NCSBN CJMM
• 74 Study Guides — Evidence-based content with clinical context
• Downloadable Resources — Cheat sheets, mnemonics, quick references

All free. No registration required.

I'd love to have Obioma Care listed as a resource for NSNA members preparing for the NGN. Would this be possible?

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  },
  {
    to: 'katie@straightanursingstudent.com',
    subject: 'Guest post idea: Clinical Judgment for the NGN',
    body: `Hi Katie,

I've been following Straight A Nursing for a while — your study tips are incredibly practical. I'm Nnamdi, an ER nurse and founder of Obioma Care.

I'd love to contribute a guest post that would resonate with your audience. Here's the pitch:

"5 NGN Scenarios That Trip Up Every Nursing Student (And How to Think Through Them)"

Real case studies. Real rationales. No fluff.

I can also create a free downloadable companion checklist for your readers.

No promotional content — just genuinely useful material with a brief author bio.

Would this work for you?

Best,
Nnamdi Georgie, RN
Obioma Care | obiomacare.com`
  }
];

async function sendEmails() {
  console.log('📧 Sending backlink outreach emails...\n');
  
  const results = [];
  
  for (let i = 0; i < prospects.length; i++) {
    const prospect = prospects[i];
    console.log(`[${i + 1}/${prospects.length}] Sending to ${prospect.to}...`);
    
    try {
      const info = await transporter.sendMail({
        from: 'Nnamdi Georgie, RN <admin@obiomacare.com>',
        to: prospect.to,
        subject: prospect.subject,
        text: prospect.body,
        replyTo: 'admin@obiomacare.com'
      });
      
      console.log(`  ✅ Sent: ${info.messageId}`);
      results.push({ to: prospect.to, status: 'sent', messageId: info.messageId });
      
      // Rate limit: wait 5 seconds between emails
      if (i < prospects.length - 1) {
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
      results.push({ to: prospect.to, status: 'failed', error: err.message });
    }
  }
  
  console.log('\n📊 Results:');
  console.log('==========');
  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);
  
  // Save results
  const logPath = path.join(__dirname, '../outreach/email-drafts/sent-log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    date: new Date().toISOString(),
    results
  }, null, 2));
  console.log(`\n💾 Log saved to ${logPath}`);
}

sendEmails().catch(console.error);
