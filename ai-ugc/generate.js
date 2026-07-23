#!/usr/bin/env node
/**
 * AI UGC Content Generator for Obioma Care
 * Generates social media posts, ad creatives, and video scripts
 * Usage: node ai-ugc/generate.js --type=post --topic=prioritization --count=5
 */

const fs = require('fs');
const path = require('path');

// Content templates and frameworks
const CONTENT_FRAMEWORKS = {
  post: {
    hooks: [
      "I watched a new grad freeze when 3 patients crashed at once.",
      "The NGN NCLEX isn't testing what you think it's testing.",
      "10 years in ER and I still use this framework every shift.",
      "Your nursing school didn't teach you this. But your patients need it.",
      "The difference between a good nurse and a great nurse? It's not knowledge.",
      "Stop memorizing drugs. Start thinking in frameworks.",
      "This is what I tell every new grad on their first day in ER.",
      "You passed the NCLEX. Now you need to survive the floor."
    ],
    bodies: [
      "Most students study for the NCLEX by memorizing. But the new NGN format tests CLINICAL JUDGMENT — not recall. Here's the framework that actually works...",
      "Prioritization isn't about ABC. It's about THIS sequence that experienced nurses use instinctively. Let me break it down...",
      "I made this mistake as a new grad. My preceptor caught it. Now I teach every student to avoid it. Thread 🧵",
      "The SBAR your school taught you? It's not wrong. But it's not what gets results at 3 AM when the attending is cranky. Here's what actually works...",
      "3 patients, 1 nurse, limited resources. Who do you see first? 90% of students get this wrong. The answer isn't in your textbook."
    ],
    ctas: [
      "🔗 Save this. Your future self will thank you.",
      "🩺 Tag a nursing student who needs to see this.",
      "📚 Full framework in bio.",
      "💬 Drop a 🧠 if this clicked for you.",
      "🔖 Bookmark this for clinical rotations.",
      "Want the complete system? Link in bio →"
    ]
  },
  
  ad: {
    headlines: [
      "Stop Cramming. Start Thinking Like a Nurse.",
      "The NGN NCLEX is Different. Your Prep Should Be Too.",
      "From ER Nurse to Your Study Guide: Real Clinical Judgment Frameworks",
      "New Grads: This is What School Didn't Teach You",
      "Pass the NCLEX. Survive the Floor. Think Like an Experienced Nurse."
    ],
    descriptions: [
      "Clinical Judgment Mastery System — built from 10+ years ER & oncology experience. NGN-focused frameworks, real case walkthroughs, and prioritization tools. $67.",
      "Not another note dump. Real decision frameworks from a nurse who's been there. NGN NCLEX prep that teaches you to THINK, not memorize.",
      "The #1 reason new grads struggle? They memorized for the test but can't think through scenarios. This changes everything."
    ],
    ctas: ["Get Instant Access", "Start Mastering Clinical Judgment", "Get the Complete System"]
  },
  
  video_script: {
    intro: [
      "Okay, real talk. I just got off a 12-hour shift and I need to tell you something about the NCLEX that nobody's talking about.",
      "I'm going to show you exactly how I think through a crashing patient. This is what 10 years in ER looks like.",
      "Your nursing school taught you the 5 rights of medication. They didn't teach you THIS."
    ],
    hook: [
      "And if you're studying for the NGN NCLEX, this is the difference between passing and failing.",
      "This one framework changed how every student I mentor approaches clinical scenarios.",
      "I wish someone had shown me this on my first day. Would have saved me months of panic."
    ],
    content: [
      "Step 1: Recognize the cues. Not every abnormal lab is urgent. Here's how I filter signal from noise...",
      "Step 2: Analyze. This is where most students get stuck. Let me show you the questions I ask myself...",
      "Step 3: Prioritize. ABC is a start, but it's not enough. Here's what ER nurses actually do...",
      "Step 4: Take action. And no, it's not always the most invasive intervention first."
    ],
    outro: [
      "If you want the complete framework with 30+ practice scenarios, link in bio. Built from real experience, not a textbook.",
      "Save this. Share it with a classmate who's stressing about the NCLEX. And if you want the full system, you know where to find it.",
      "Drop a 🧠 if this helped. And remember — you're not just studying for a test. You're learning to keep people alive. No pressure."
    ]
  }
};

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generatePost(topic, includeCta = true) {
  const framework = CONTENT_FRAMEWORKS.post;
  let post = random(framework.hooks) + '\n\n';
  post += random(framework.bodies) + '\n\n';
  if (includeCta) post += random(framework.ctas);
  return post;
}

function generateAd(variation = 1) {
  const framework = CONTENT_FRAMEWORKS.ad;
  return {
    headline: random(framework.headlines),
    description: random(framework.descriptions),
    cta: random(framework.ctas),
    variation
  };
}

function generateVideoScript(duration = '60s') {
  const framework = CONTENT_FRAMEWORKS.video_script;
  return {
    intro: random(framework.intro),
    hook: random(framework.hook),
    content: framework.content.slice(0, duration === '60s' ? 2 : 4),
    outro: random(framework.outro),
    duration,
    word_count_estimate: duration === '60s' ? 150 : 300
  };
}

function generateContentCalendar(days = 30) {
  const topics = ['prioritization', 'ngn-format', 'er-stories', 'sbar', 'new-grad-tips', 'clinical-judgment', 'medication-safety', 'delegation'];
  const calendar = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const topic = topics[i % topics.length];
    
    calendar.push({
      date: date.toISOString().split('T')[0],
      topic,
      type: i % 3 === 0 ? 'video' : 'post',
      content: i % 3 === 0 ? generateVideoScript('60s') : generatePost(topic)
    });
  }
  
  return calendar;
}

// CLI
const args = process.argv.slice(2);
const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'post';
const topic = args.find(a => a.startsWith('--topic='))?.split('=')[1] || 'prioritization';
const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1] || '5');

console.log(`\n🎯 Generating ${count} ${type}(s) about ${topic}\n`);

let output;
switch(type) {
  case 'post':
    output = Array.from({length: count}, () => generatePost(topic));
    break;
  case 'ad':
    output = Array.from({length: count}, (_, i) => generateAd(i + 1));
    break;
  case 'video':
    output = generateVideoScript(count === 1 ? '60s' : '90s');
    break;
  case 'calendar':
    output = generateContentCalendar(count);
    break;
  default:
    console.log('Unknown type. Use: post | ad | video | calendar');
    process.exit(1);
}

// Save output
const outputDir = path.join(__dirname, 'generated');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `${type}-${topic}-${timestamp}.json`;
fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(output, null, 2));

console.log('Generated:');
console.log(JSON.stringify(output, null, 2));
console.log(`\n💾 Saved to: ai-ugc/generated/${filename}`);
