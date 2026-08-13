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

// Reddit r/StudentNurse modmail (we'll use the contact form approach)
// Actually, Reddit doesn't have direct email for modmail. We'll document the approach instead.

// Reddit post draft
const redditPost = {
  subreddit: 'StudentNurse',
  title: '[Resource] Free NCLEX NGN Study Platform — 74 Guides + 10 Interactive Cases',
  body: `Hi everyone,

I'm Nnamdi, an ER nurse who recently built a free NCLEX study platform called **Obioma Care**.

**What's free:**
• 74 study guides (lab values, pharmacology, cardiac, OB, peds, etc.)
• 10 interactive NGN case studies with rationales
• 4 downloadable cheat sheets
• Clinical judgment framework

**The case engine** simulates the new NCLEX format (case studies with SATA, ordering, etc.) and gives instant feedback.

No signup. No ads. Just free resources.

**Check it out:** https://obiomacare.com/case-engine.html

Happy to answer questions!

— Nnamdi, RN`
};

// Save Reddit post draft
fs.writeFileSync(
  path.join(__dirname, '../outreach/reddit-post-draft.md'),
  `# Reddit Post Draft for r/StudentNurse

## Subreddit: r/StudentNurse
## Title: ${redditPost.title}

${redditPost.body}

---

## Posting Instructions

1. Go to https://www.reddit.com/r/StudentNurse/submit
2. Select "Text" post type
3. Paste title and body above
4. Flair as "Resource" or "Study Help"
5. Post during high-traffic hours (US evening, 7-10 PM EST)

## Follow-up Strategy

- Monitor comments for 24 hours after posting
- Reply to questions promptly
- Do NOT overly promote — focus on being helpful
- If post does well, consider cross-posting to r/Nursing

## Rules Check

Before posting, verify r/StudentNurse rules:
- [ ] No spam/self-promotion (must provide value)
- [ ] No affiliate links
- [ ] Must be nursing-related
- [ ] No asking for homework help

This post should comply as it's a free resource with no affiliate links.
`
);

console.log('✅ Reddit post draft saved to outreach/reddit-post-draft.md');
console.log('⚠️  Manual posting required — Reddit does not support email/API posting');
