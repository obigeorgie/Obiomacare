const fs = require('fs');
const path = require('path');

// Postiz API config
const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';

// Integration IDs
const INTEGRATIONS = {
  'x': 'cmrqspwfp0843qj0yyiru88sy',
  'instagram': 'cmrrmzsu20dg4qj0ym3m4eskv',
  'tiktok': 'cmrrmrnsz0dj4pc0yzrtdgo2q',
  'linkedin': 'cmplx746g04hxma0y5w4fdyxv',
};

// Video episodes with shortened X versions
const VIDEOS = [
  {
    id: 'trap-001-potassium',
    title: 'Potassium + Digoxin = Deadly Combo',
    captionX: '🚨 NCLEX Trap: K+ + Digoxin\n\nPatient on digoxin, K+ 3.2, PVCs. FIRST action?\n\nA) Give digoxin\nB) Hold digoxin, check K+\nC) K+ only\nD) Rapid response\n\nAnswer: B\n\nHypokalemia = toxicity risk. Always check K+ first!\n\n#nclex #nursingstudent',
    captionLinkedIn: '🚨 NCLEX Trap of the Day: Potassium + Digoxin\n\nThis medication-lab combination kills more patients than you think.\n\nScenario: Your patient on digoxin has K+ 3.2 and PVCs.\n\nCorrect action: Hold digoxin, check potassium, notify provider.\n\nWhy: Hypokalemia INCREASES digoxin toxicity risk.\n\n💡 Remember: ALWAYS check K+ before giving digoxin.\n\n#nclex #nursingstudent #clinicaljudgment #patientSafety',
    file: '/root/.openclaw/workspace/obioma-care/video/out/trap-001-potassium.mp4'
  },
  {
    id: 'trap-002-abcs',
    title: 'ABCs vs. The Distraction',
    captionX: '🚨 NCLEX Trap: Prioritization\n\nPost-op: BP 88/52, RR 28, saturated dressing, family wants pain meds, IV bad. FIRST?\n\nA) Change dressing\nB) Pain meds\nC) Restart IV\nD) Assess airway\n\nAnswer: D\n\nABCs always first!\n\n#nclex #prioritization',
    captionLinkedIn: '🚨 NCLEX Trap of the Day: ABCs vs. Distraction\n\nThe NCLEX gives you multiple urgent tasks. 95% pick the wrong priority.\n\nScenario: Post-op patient with BP 88/52, RR 28, saturated dressing, demanding family, infiltrated IV.\n\nCorrect answer: Assess airway & breathing FIRST.\n\n💡 The ABC Rule: Airway → Breathing → Circulation. Everything else comes after.\n\n#nclex #nursingstudent #clinicaljudgment #prioritization',
    file: '/root/.openclaw/workspace/obioma-care/video/out/trap-002-abcs.mp4'
  },
  {
    id: 'trap-003-delegation',
    title: 'Who Do You Delegate To?',
    captionX: '🚨 NCLEX Trap: Delegation\n\nWho gets the bed bath?\nA) RN\nB) LPN\nC) UAP\nD) PT\n\nAnswer: C\n\nRN: Assessment, meds, sterile, teaching\nUAP: ADLs, stable VS, routine tasks\n\n#nclex #delegation',
    captionLinkedIn: '🚨 NCLEX Trap of the Day: Delegation\n\nThe NCLEX doesn\'t ask you to LIST the 5 rights — it gives you a scenario.\n\nScenario: 4 patients need different care. Who do you delegate the bed bath to?\n\nAnswer: UAP (Unlicensed Assistive Personnel)\n\n💡 RN keeps: Assessment, teaching, medication, sterile procedures.\n💡 UAP gets: ADLs, stable VS, routine tasks.\n\n#nclex #delegation #nursingstudent #clinicaljudgment',
    file: '/root/.openclaw/workspace/obioma-care/video/out/trap-003-delegation.mp4'
  },
  {
    id: 'trap-004-sata',
    title: 'SATA: The True/False Method',
    captionX: '🚨 NCLEX Trap: SATA\n\nThe method that makes SATA easy:\n\nTreat EACH option as True/False.\n\nNo patterns. No overthinking.\n\nTrue = select it\nFalse = skip it\n\nThat\'s the secret!\n\n#nclex #sata #testtips',
    captionLinkedIn: '🚨 NCLEX Trap of the Day: SATA Questions\n\nSATA questions terrify nursing students. Here\'s the method that makes them easy.\n\nThe Secret: Treat EACH option as a standalone true/false question.\n\nDon\'t look for patterns.\nDon\'t overthink.\n\nIf it\'s true → select it\nIf it\'s false → skip it\n\n💡 No partial credit on NCLEX — all correct or nothing.\n\n#nclex #sata #nursingstudent #testtips',
    file: '/root/.openclaw/workspace/obioma-care/video/out/trap-004-sata.mp4'
  },
  {
    id: 'trap-005-isolation',
    title: 'Isolation Precautions Made Simple',
    captionX: '🚨 NCLEX Trap: Isolation\n\nTB patient. What PPE?\nA) Surgical mask\nB) N95\nC) Gloves\nD) Face shield\n\nAnswer: B\n\nAirborne = N95\nDroplet = Surgical mask\nContact = Gown + gloves\n\n#nclex #infectioncontrol #ppe',
    captionLinkedIn: '🚨 NCLEX Trap of the Day: Isolation Precautions\n\nContact? Droplet? Airborne? One trick tells you instantly.\n\nScenario: Patient has suspected tuberculosis. What PPE before entering?\n\nAnswer: N95 respirator + standard precautions.\n\n💡 Isolation Memory:\n• AIRBORNE = N95 (TB, measles, chickenpox)\n• DROPLET = Surgical mask (flu, COVID, pertussis)\n• CONTACT = Gown + gloves (MRSA, C. diff)\n\n#nclex #infectioncontrol #ppe #nursingstudent',
    file: '/root/.openclaw/workspace/obioma-care/video/out/trap-005-isolation.mp4'
  }
];

async function schedulePost(content, platform, scheduledDate) {
  const integrationId = INTEGRATIONS[platform];
  if (!integrationId) {
    console.log(`⚠️ No integration for ${platform}`);
    return { skipped: true };
  }

  const platformSettings = {
    'tiktok': {
      __type: 'tiktok',
      privacy_level: 'PUBLIC_TO_EVERYONE',
      duet: false,
      stitch: false,
      comment: true,
      autoAddMusic: 'no',
      content_posting_method: 'DIRECT_POST'
    },
    'instagram': {
      __type: 'instagram-standalone',
      post_type: 'reel'
    },
    'x': {
      __type: 'x',
      who_can_reply_post: 'everyone'
    },
    'linkedin': {
      __type: 'linkedin-page'
    }
  };

  const payload = {
    type: 'schedule',
    creationMethod: 'API',
    date: scheduledDate,
    shortLink: true,
    tags: [],
    posts: [{
      integration: { id: integrationId },
      value: [{
        content: content,
        image: [],
        delay: 0
      }],
      settings: platformSettings[platform] || {}
    }]
  };

  try {
    const response = await fetch(`${API_URL}/public/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ ${platform} at ${scheduledDate} → ${result.id || 'scheduled'}`);
    return { success: true, id: result.id };
  } catch (err) {
    console.error(`❌ ${platform}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('📹 NCLEX Trap Video Scheduler\n');
  console.log('⚠️ Note: Media uploads not supported via Postiz API.');
  console.log('Videos must be uploaded manually to TikTok/Instagram.\n');
  console.log('Scheduling text posts with links to X and LinkedIn...\n');

  // Schedule for tomorrow through next 5 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(12, 0, 0, 0); // Noon UTC

  let success = 0;
  let failed = 0;

  for (let i = 0; i < VIDEOS.length; i++) {
    const video = VIDEOS[i];
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(startDate.getDate() + i);
    const dateStr = scheduledDate.toISOString();

    console.log(`\n🎬 ${video.title}`);
    console.log(`📅 ${dateStr}`);

    // Schedule to X (short caption)
    const xResult = await schedulePost(video.captionX, 'x', dateStr);
    if (xResult.success) success++;
    else failed++;

    // Schedule to LinkedIn (longer caption)
    const liResult = await schedulePost(video.captionLinkedIn, 'linkedin', dateStr);
    if (liResult.success) success++;
    else failed++;

    // Note about manual upload
    console.log(`📝 Upload video manually to TikTok & Instagram: ${video.file}`);

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n🏁 Done: ${success} scheduled, ${failed} failed`);
  console.log('\n📱 Remember: Upload videos manually to TikTok & Instagram Reels!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
