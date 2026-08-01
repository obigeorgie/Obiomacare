// AI Tutor for Obioma Care — Clinical Judgment Mastery System
// Uses structured content + intelligent routing (no external LLM required)

const COURSE_CONTENT = {
  cjmm: {
    title: "Clinical Judgment Measurement Model",
    steps: [
      {
        name: "Recognize Cues",
        description: "Identify relevant and important information from patient data.",
        keyPoints: [
          "Look for abnormal vital signs",
          "Note changes in patient behavior or appearance",
          "Review lab values outside normal range",
          "Listen to what the patient and family report"
        ],
        example: "A patient with BP 90/60, HR 110, complaining of chest pain — these are cues that something is wrong."
      },
      {
        name: "Analyze Cues",
        description: "Interpret the meaning of cues and identify patterns.",
        keyPoints: [
          "What do these cues mean together?",
          "Are they related to a specific condition?",
          "How severe is the situation?",
          "What body system is affected?"
        ],
        example: "Low BP + high HR + chest pain = possible shock, cardiac event, or internal bleeding."
      },
      {
        name: "Prioritize Hypotheses",
        description: "Rank potential problems by urgency and likelihood.",
        keyPoints: [
          "Use ABCDE method: Airway, Breathing, Circulation, Disability, Exposure",
          "Life-threatening conditions come first",
          "Consider Maslow's hierarchy",
          "Think: what will kill the patient first?"
        ],
        example: "In chest pain patient: cardiac ischemia > anxiety > musculoskeletal pain"
      },
      {
        name: "Generate Solutions",
        description: "Identify expected outcomes and nursing interventions.",
        keyPoints: [
          "What is the goal? (stable vitals, pain relief, etc.)",
          "What nursing actions can achieve this?",
          "What will you monitor?",
          "What are the priorities?"
        ],
        example: "For chest pain: ECG, troponins, O2, IV access, morphine if ordered"
      },
      {
        name: "Take Action",
        description: "Implement the chosen interventions.",
        keyPoints: [
          "Start with highest priority",
          "Communicate with the healthcare team",
          "Document all actions",
          "Reassess frequently"
        ],
        example: "Place on cardiac monitor, administer O2 at 2L NC, obtain 12-lead ECG"
      },
      {
        name: "Evaluate Outcomes",
        description: "Assess whether interventions were effective.",
        keyPoints: [
          "Did the patient's condition improve?",
          "Are vital signs stabilizing?",
          "Does the patient report less pain?",
          "Do you need to escalate care?"
        ],
        example: "After O2 and rest, chest pain reduced from 8/10 to 3/10 — intervention effective."
      }
    ]
  },
  
  abcde: {
    title: "ABCDE Prioritization Method",
    description: "The ER nurse's framework for rapid patient assessment",
    steps: [
      { letter: "A", name: "Airway", action: "Ensure airway is patent. Look for obstruction, stridor, snoring.", priority: 1 },
      { letter: "B", name: "Breathing", action: "Assess rate, depth, symmetry, O2 saturation. Listen for abnormal breath sounds.", priority: 2 },
      { letter: "C", name: "Circulation", action: "Check pulse, BP, capillary refill, skin color/temperature. Look for bleeding.", priority: 3 },
      { letter: "D", name: "Disability", action: "Level of consciousness (AVPU: Alert, Voice, Pain, Unresponsive). Check pupils.", priority: 4 },
      { letter: "E", name: "Exposure", action: "Remove clothing to assess for injuries, rashes, burns. Check temperature.", priority: 5 }
    ]
  },
  
  sata: {
    title: "SATA Strategy",
    description: "How to beat Select All That Apply questions",
    rules: [
      "Treat EACH option as a separate true/false question",
      "Don't look for patterns (like 'pick 3') — NCLEX randomizes correct answer count",
      "Read the question stem carefully — what is it REALLY asking?",
      "If unsure about one option, evaluate it independently",
      "Choose the SAFEST nursing action when in doubt"
    ],
    example: {
      question: "A patient post-appendectomy reports pain at 8/10. Which actions are appropriate?",
      options: [
        "Administer prescribed pain medication",
        "Assess surgical incision",
        "Encourage deep breathing exercises",
        "Position for comfort",
        "Call the surgeon immediately"
      ],
      correct: [0, 1, 2, 3],
      rationale: "All are appropriate except calling surgeon immediately — that's only needed for complications like infection or dehiscence."
    }
  },
  
  labValues: {
    title: "Critical Lab Values",
    values: [
      { test: "Hemoglobin", normal: "12-16 g/dL (F), 14-18 g/dL (M)", critical: "<7 or >20", action: "Transfusion likely needed if <7" },
      { test: "WBC", normal: "4,500-11,000/μL", critical: ">30,000 or <2,000", action: "Infection risk or immunosuppression" },
      { test: "Platelets", normal: "150,000-400,000/μL", critical: "<50,000", action: "Bleeding risk — avoid IM injections" },
      { test: "Potassium", normal: "3.5-5.0 mEq/L", critical: ">6.0 or <2.5", action: "Cardiac monitoring, IV calcium if high" },
      { test: "Sodium", normal: "136-145 mEq/L", critical: ">160 or <120", action: "Seizure risk if rapid change" },
      { test: "Glucose", normal: "70-100 mg/dL (fasting)", critical: ">400 or <40", action: "Insulin protocol or D50 if symptomatic" },
      { test: "Creatinine", normal: "0.6-1.2 mg/dL", critical: ">4.0", action: "Acute kidney injury — fluid management" },
      { test: "BNP", normal: "<100 pg/mL", critical: ">400", action: "Heart failure exacerbation likely" }
    ]
  },
  
  pharmacology: {
    title: "High-Alert Medications",
    drugs: [
      { name: "Insulin", risk: "Hypoglycemia", checks: "Always double-check type and units", antidote: "D50 (dextrose) if hypoglycemic" },
      { name: "Heparin", risk: "Bleeding", checks: "Monitor aPTT, platelets", antidote: "Protamine sulfate" },
      { name: "Warfarin", risk: "Bleeding", checks: "Monitor INR (goal 2-3)", antidote: "Vitamin K, PCC" },
      { name: "Morphine", risk: "Respiratory depression", checks: "Monitor RR, sedation level", antidote: "Narcan (naloxone)" },
      { name: "Digoxin", risk: "Toxicity (n/v, arrhythmias)", checks: "Check level (therapeutic 0.5-0.9)", antidote: "Digibind" },
      { name: "Lithium", risk: "Nephrotoxicity, neurotoxicity", checks: "Monitor level (0.6-1.2)", antidote: "Supportive care, dialysis if severe" }
    ]
  },
  
  delegation: {
    title: "5 Rights of Delegation",
    rights: [
      "Right Task: Can a UAP/LPN do this? (ADLs, vitals, ambulation)",
      "Right Circumstance: Is the patient stable?",
      "Right Person: Does the delegatee have training?",
      "Right Direction/Communication: Clear, concise, specific instructions",
      "Right Supervision: Appropriate monitoring and evaluation"
    ],
    cannotDelegate: [
      "Initial assessment",
      "Medication administration (except in some LPN scopes)",
      "Patient education (initial)",
      "Care planning",
      "Complex clinical judgment"
    ]
  }
};

// Question classifier to route to appropriate content
function classifyQuestion(question) {
  const q = question.toLowerCase();
  
  if (q.includes('sata') || q.includes('select all') || q.includes('multiple answer')) {
    return 'sata';
  }
  if (q.includes('lab') || q.includes('value') || q.includes('cbc') || q.includes('bmp') || q.includes('wbc') || q.includes('potassium') || q.includes('sodium')) {
    return 'labValues';
  }
  if (q.includes('delegate') || q.includes('uap') || q.includes('lpn') || q.includes('cna')) {
    return 'delegation';
  }
  if (q.includes('prioritize') || q.includes('abcde') || q.includes('airway') || q.includes('breathing')) {
    return 'abcde';
  }
  if (q.includes('drug') || q.includes('medication') || q.includes('pharm') || q.includes('insulin') || q.includes('heparin')) {
    return 'pharmacology';
  }
  if (q.includes('cjmm') || q.includes('clinical judgment') || q.includes('cue') || q.includes('analyze') || q.includes('framework')) {
    return 'cjmm';
  }
  if (q.includes('step') || q.includes('how to') || q.includes('what is') || q.includes('explain')) {
    return 'cjmm';
  }
  
  return 'cjmm'; // Default to CJMM framework
}

function generateExplanation(topic, question) {
  const content = COURSE_CONTENT[topic];
  if (!content) return "I don't have specific content on that topic yet. Try asking about clinical judgment, SATA questions, lab values, prioritization, delegation, or pharmacology.";
  
  let response = `## ${content.title}\n\n`;
  
  if (topic === 'cjmm') {
    response += "The Clinical Judgment Measurement Model has 6 steps:\n\n";
    content.steps.forEach((step, i) => {
      response += `${i + 1}. **${step.name}**\n`;
      response += `   ${step.description}\n`;
      response += `   Key points: ${step.keyPoints.join('; ')}\n`;
      response += `   Example: ${step.example}\n\n`;
    });
  }
  
  if (topic === 'abcde') {
    response += "Use ABCDE for rapid assessment:\n\n";
    content.steps.forEach(step => {
      response += `**${step.letter} — ${step.name}** (Priority ${step.priority})\n`;
      response += `${step.action}\n\n`;
    });
    response += "Remember: Always start with Airway — without it, nothing else matters.";
  }
  
  if (topic === 'sata') {
    response += "Here's how to beat SATA questions:\n\n";
    content.rules.forEach(rule => {
      response += `• ${rule}\n`;
    });
    response += "\n**Example:**\n";
    response += `${content.example.question}\n`;
    response += `Correct answers: Options ${content.example.correct.map(i => i + 1).join(', ')}\n`;
    response += `Rationale: ${content.example.rationale}`;
  }
  
  if (topic === 'labValues') {
    response += "Critical lab values every nurse must know:\n\n";
    content.values.forEach(v => {
      response += `**${v.test}**\n`;
      response += `Normal: ${v.normal}\n`;
      response += `Critical: ${v.critical}\n`;
      response += `Action: ${v.action}\n\n`;
    });
  }
  
  if (topic === 'pharmacology') {
    response += "High-alert medications — know these cold:\n\n";
    content.drugs.forEach(d => {
      response += `**${d.name}**\n`;
      response += `Risk: ${d.risk}\n`;
      response += `Checks: ${d.checks}\n`;
      response += `Antidote: ${d.antidote}\n\n`;
    });
  }
  
  if (topic === 'delegation') {
    response += "The 5 Rights of Delegation:\n\n";
    content.rights.forEach(r => {
      response += `• ${r}\n`;
    });
    response += "\n**CANNOT delegate to UAP:**\n";
    content.cannotDelegate.forEach(item => {
      response += `• ${item}\n`;
    });
  }
  
  return response;
}

function generatePracticeQuestion(topic) {
  const questions = {
    cjmm: [
      {
        question: "A patient reports chest pain (8/10), BP 88/52, HR 118, RR 24, O2 sat 91% on room air. Using the CJMM, what should the nurse do FIRST?",
        options: [
          "Administer prescribed morphine",
          "Apply O2 via nasal cannula",
          "Call the physician",
          "Obtain a 12-lead ECG"
        ],
        correct: 1,
        rationale: "Using ABCDE prioritization within CJMM: Airway is patent (talking), Breathing is compromised (O2 91%). Address breathing FIRST before circulation (BP/HR) or other actions."
      },
      {
        question: "Which finding requires IMMEDIATE intervention?",
        options: [
          "K+ 3.2 mEq/L",
          "HR 52 bpm in a patient on metoprolol",
          "O2 sat 89% on 2L NC",
          "Blood glucose 185 mg/dL"
        ],
        correct: 2,
        rationale: "O2 sat 89% indicates hypoxemia — life-threatening. K+ 3.2 is low but not immediately dangerous. HR 52 on beta-blocker may be expected. BG 185 is elevated but not emergent."
      }
    ],
    sata: [
      {
        question: "A patient with heart failure has the following orders. Which should the nurse question? (Select all that apply)",
        options: [
          "NS at 125 mL/hr",
          "Furosemide 40 mg IV push",
          "Morphine 2 mg IV PRN",
          "Salt-restricted diet",
          "Daily weights"
        ],
        correct: [0],
        rationale: "NS at 125 mL/hr = 3000 mL/day. Heart failure patients need fluid restriction (typically 1500-2000 mL/day). Normal saline adds sodium load. All other options are appropriate HF care."
      }
    ],
    labValues: [
      {
        question: "Which lab value requires immediate notification of the provider?",
        options: [
          "Na+ 138 mEq/L",
          "K+ 5.8 mEq/L",
          "Glucose 110 mg/dL",
          "Creatinine 1.1 mg/dL"
        ],
        correct: 1,
        rationale: "K+ 5.8 is critically high (>5.0). Risk of cardiac arrhythmias. Needs cardiac monitoring, kayexalate, possible calcium. Other values are within normal or near-normal range."
      }
    ]
  };
  
  const pool = questions[topic] || questions.cjmm;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateHint(question) {
  const q = question.toLowerCase();
  
  if (q.includes('first') || q.includes('priority') || q.includes('initial')) {
    return "Think ABCDE: Airway, Breathing, Circulation, Disability, Exposure. What will kill the patient fastest?";
  }
  if (q.includes('sata') || q.includes('select all')) {
    return "Treat each option as a separate true/false question. Don't look for patterns.";
  }
  if (q.includes('delegate')) {
    return "Remember: assessment, planning, and clinical judgment CANNOT be delegated. Only stable patients with predictable outcomes.";
  }
  if (q.includes('lab') || q.includes('value')) {
    return "Know your critical values. Potassium >5 or <3, glucose >400 or <40, platelets <50K all need immediate action.";
  }
  
  return "Break this down using the CJMM: What cues do you see? What do they mean? What's the priority?";
}

module.exports = {
  COURSE_CONTENT,
  classifyQuestion,
  generateExplanation,
  generatePracticeQuestion,
  generateHint
};
