const fs = require('fs');
const path = require('path');

// FAQ content mapped by filename keyword
const faqMap = {
  'nclex-lab-values-memorization-guide': {
    faqs: [
      { q: "What lab values are most important for the NCLEX?", a: "The most frequently tested lab values on the NCLEX include CBC (WBC, RBC, Hgb, Hct, platelets), BMP (sodium, potassium, chloride, CO2, BUN, creatinine, glucose), coagulation studies (PT/INR, aPTT), cardiac enzymes (troponin, BNP), and ABG values. Obioma's Lab Values Guide covers normal ranges, critical values, and clinical significance for each." },
      { q: "How do I memorize lab values for the NCLEX?", a: "Use mnemonics, color-coded flashcards, and clinical association rather than rote memorization. For example, associate potassium with cardiac arrhythmias, or creatinine with kidney function. Spaced repetition through daily quizzes is the most effective retention strategy." },
      { q: "What are critical lab values I need to know?", a: "Critical values requiring immediate intervention include: potassium <2.5 or >6.5 mEq/L, sodium <120 or >160 mEq/L, glucose <40 or >400 mg/dL, hemoglobin <7 g/dL, platelets <20,000/μL, and pH <7.25 or >7.55 on ABG. Always prioritize patient safety actions for critical values." },
      { q: "Are lab value questions common on the Next Gen NCLEX?", a: "Yes. NGN case studies frequently embed lab values within unfolding scenarios. You must interpret results in clinical context, not just identify normal ranges. The NGN tests whether you recognize abnormal values and select appropriate nursing actions." }
    ]
  },
  'nclex-abg-interpretation-guide': {
    faqs: [
      { q: "What is the ROME method for ABG interpretation?", a: "ROME stands for Respiratory Opposite, Metabolic Equal. If pH and PaCO2 move in opposite directions, the primary disorder is respiratory. If pH and HCO3 move in the same direction, the primary disorder is metabolic. This mnemonic helps you identify the primary acid-base imbalance quickly." },
      { q: "How do you know if compensation is occurring on an ABG?", a: "Compensation is present when the non-primary system attempts to correct the pH. In respiratory compensation, PaCO2 changes to offset metabolic issues. In metabolic compensation, HCO3 changes to offset respiratory issues. Full compensation returns pH to the normal range (7.35-7.45); partial compensation does not." },
      { q: "What is the most common cause of respiratory acidosis?", a: "Hypoventilation is the most common cause, resulting from COPD exacerbation, opioid overdose, chest trauma, neuromuscular disorders, or sedation. The key nursing intervention is to address the underlying cause and support ventilation, which may require mechanical ventilation in severe cases." },
      { q: "How many ABG questions are on the NCLEX?", a: "ABG interpretation appears in 3-5% of NCLEX questions, often embedded in case studies or prioritization scenarios. The NGN format frequently presents ABG results within unfolding cases requiring clinical judgment about oxygenation, ventilation, and acid-base status." }
    ]
  },
  'nclex-pharmacology-drug-classes': {
    faqs: [
      { q: "What are the most important drug classes for the NCLEX?", a: "The most heavily tested drug classes include: cardiac medications (ACE inhibitors, beta-blockers, diuretics, digoxin), anticoagulants (heparin, warfarin, DOACs), antidiabetic agents (insulin, metformin, sulfonylureas), antibiotics (penicillins, cephalosporins, fluoroquinolones), and emergency medications (epinephrine, atropine, adenosine). Focus on mechanisms, side effects, and nursing considerations." },
      { q: "How do you memorize medication suffixes for NCLEX?", a: "Medication suffixes reveal drug classes: -olol (beta-blockers), -pril (ACE inhibitors), -sartan (ARBs), -statin (HMG-CoA reductase inhibitors), -dipine (calcium channel blockers), -azole (antifungals), -mycin (antibiotics). Obioma's suffix guide provides a complete list with memory aids." },
      { q: "What are high-alert medications on the NCLEX?", a: "ISMP high-alert medications include insulin, anticoagulants, opioids, chemotherapy, neuromuscular blocking agents, and concentrated electrolytes. The NCLEX tests your knowledge of double-check requirements, independent verification, and patient-specific dosing for these medications." },
      { q: "Are dosage calculation questions on the Next Gen NCLEX?", a: "Yes, though fewer than on the traditional NCLEX. NGN may embed dosage calculations within case studies or use fill-in-the-blank formats. Master dimensional analysis for safe medication administration." }
    ]
  },
  'nclex-cardiac-disorders': {
    faqs: [
      { q: "What cardiac disorders are most common on the NCLEX?", a: "The most frequently tested cardiac disorders include heart failure (systolic and diastolic), myocardial infarction, atrial fibrillation, hypertension, and valvular disease. The NCLEX emphasizes nursing assessments, medication administration, patient education, and recognizing complications." },
      { q: "What is the MONA protocol for chest pain?", a: "MONA stands for Morphine, Oxygen, Nitroglycerin, and Aspirin. It's the initial treatment for suspected myocardial infarction. However, always assess the patient first—obtain vital signs, check contraindications (especially for nitroglycerin), and confirm the diagnosis with a 12-lead ECG." },
      { q: "How do you differentiate left-sided from right-sided heart failure?", a: "Left-sided heart failure causes pulmonary congestion (dyspnea, crackles, orthopnea, pink frothy sputum). Right-sided heart failure causes systemic congestion (JVD, peripheral edema, hepatomegaly, ascites). Both require different nursing priorities and interventions." },
      { q: "What are the H's and T's of cardiac arrest?", a: "The reversible causes of cardiac arrest are the 6 H's (Hypovolemia, Hypoxia, Hydrogen ion/acidosis, Hypo-/Hyperkalemia, Hypothermia, Hypoglycemia) and the 5 T's (Tension pneumothorax, Tamponade, Toxins, Thrombosis-pulmonary, Thrombosis-coronary). These guide ACLS interventions beyond CPR and defibrillation." }
    ]
  },
  'nclex-clinical-judgment-framework': {
    faqs: [
      { q: "What is the NCSBN Clinical Judgment Measurement Model?", a: "The NCSBN CJMM is a 6-step framework: Recognize Cues, Analyze Cues, Prioritize Hypotheses, Generate Solutions, Take Action, and Evaluate Outcomes. It's the foundation of the Next Generation NCLEX and tests your ability to think like a practicing nurse." },
      { q: "How is clinical judgment different from critical thinking?", a: "Critical thinking is the broader cognitive process of analyzing information. Clinical judgment is the specific application of critical thinking to nursing situations—making decisions about patient care based on assessment data, nursing knowledge, and clinical reasoning. The NCLEX now explicitly tests clinical judgment." },
      { q: "What are the most common NCLEX traps in clinical judgment questions?", a: "Common traps include: selecting assessment when the question asks for intervention (or vice versa), choosing the 'textbook' answer instead of the safest action, prioritizing convenience over patient safety, and missing subtle cues in the question stem. Always identify what the question is actually asking." },
      { q: "How can I improve my clinical judgment for the NCLEX?", a: "Practice with case studies that unfold over multiple questions. Use the 'what if' method—after answering, ask what would happen if you chose differently. Study nursing priorities (ABC, Maslow's, safety first). Obioma's Clinical Judgment Core trains this skill through structured case walkthroughs." }
    ]
  },
  'nclex-maternity-study-guide': {
    faqs: [
      { q: "What maternity topics are most common on the NCLEX?", a: "The most frequently tested maternity topics include pregnancy complications (preeclampsia, gestational diabetes, preterm labor), labor stages and nursing care, postpartum assessment (BUBBLE-HE), newborn assessment (APGAR), and breastfeeding support. Medication safety in pregnancy is also heavily tested." },
      { q: "What are the stages of labor?", a: "First stage: cervical dilation (latent, active, transition). Second stage: pushing and birth. Third stage: delivery of the placenta. Fourth stage: immediate postpartum recovery (first 1-4 hours). Each stage has specific nursing assessments and interventions." },
      { q: "How is preeclampsia managed on the NCLEX?", a: "Preeclampsia management includes: blood pressure monitoring, seizure prophylaxis with magnesium sulfate, fetal monitoring, and delivery if severe. Monitor for magnesium toxicity (decreased reflexes, respiratory depression, oliguria). The NCLEX tests recognition of worsening symptoms and appropriate interventions." },
      { q: "What is the APGAR score and when is it assessed?", a: "The APGAR score assesses newborn status at 1 and 5 minutes after birth. It evaluates Appearance (color), Pulse (heart rate), Grimace (reflex irritability), Activity (muscle tone), and Respiration. Scores 7-10 are normal, 4-6 require intervention, 0-3 require resuscitation." }
    ]
  },
  'nclex-mental-health-nursing': {
    faqs: [
      { q: "What mental health disorders are most common on the NCLEX?", a: "The most tested mental health topics include schizophrenia, bipolar disorder, major depression, anxiety disorders, personality disorders (especially BPD), substance use disorders, and eating disorders. Therapeutic communication techniques are also frequently tested." },
      { q: "What are the most important therapeutic communication techniques?", a: "Key techniques include: active listening, open-ended questions, restating, reflecting, clarifying, and summarizing. Avoid: giving false reassurance, giving advice, changing the subject, and asking 'why' questions. The NCLEX tests which response best demonstrates therapeutic communication." },
      { q: "How do you prioritize patients on a mental health unit?", a: "Prioritize safety first: suicidal or homicidal ideation, elopement risk, and aggression. Then address medication needs, withdrawal symptoms, and psychotic symptoms. The patient with active suicidal intent always requires 1:1 observation and is the highest priority." },
      { q: "What are common side effects of antipsychotic medications?", a: "Common side effects include: extrapyramidal symptoms (dystonia, akathisia, pseudoparkinsonism), tardive dyskinesia, neuroleptic malignant syndrome (emergency), anticholinergic effects, sedation, and metabolic syndrome (weight gain, diabetes, dyslipidemia). Monitor for these and educate patients accordingly." }
    ]
  },
  'nclex-emergency-drugs': {
    faqs: [
      { q: "What emergency medications must I know for the NCLEX?", a: "Essential emergency medications include: epinephrine (cardiac arrest, anaphylaxis), atropine (bradycardia), adenosine (SVT), amiodarone (ventricular arrhythmias), naloxone (opioid overdose), magnesium sulfate (Torsades de Pointes, eclampsia), and calcium gluconate (hyperkalemia). Know indications, doses, and nursing considerations." },
      { q: "What is the ACLS algorithm for cardiac arrest?", a: "The ACLS algorithm: confirm unresponsiveness, call for help and AED, begin CPR (30:2), apply AED/analyze rhythm. Shockable rhythms (VF/pulseless VT): defibrillate, then CPR, epinephrine every 3-5 min, amiodarone. Non-shockable (asystole/PEA): CPR, epinephrine, identify and treat reversible causes (H's and T's)." },
      { q: "How do you reverse anticoagulant overdose?", a: "Warfarin: vitamin K and fresh frozen plasma. Heparin: protamine sulfate. DOACs (apixaban, rivaroxaban): andexanet alfa or 4-factor PCC. The NCLEX tests recognition of bleeding signs and appropriate reversal agents." },
      { q: "What is the first-line treatment for anaphylaxis?", a: "Epinephrine 0.3-0.5 mg IM in the anterolateral thigh is the first-line and most critical treatment. Antihistamines and corticosteroids are adjunctive but do not replace epinephrine. Position the patient supine with legs elevated to support circulation." }
    ]
  },
  'nclex-fluids-electrolytes-deep-dive': {
    faqs: [
      { q: "What are the most important electrolytes for the NCLEX?", a: "The most critical electrolytes are potassium, sodium, calcium, and magnesium. Each has specific normal ranges, clinical manifestations of imbalance, and nursing interventions. Potassium and calcium imbalances can cause life-threatening cardiac arrhythmias and are highest priority." },
      { q: "How do I calculate IV drip rates?", a: "Use the formula: (Total volume in mL ÷ Time in minutes) × Drop factor (gtt/mL). For macrodrip sets: 10, 15, or 20 gtt/mL. For microdrip: 60 gtt/mL. Always double-check your calculation and verify the order before administration." },
      { q: "What are the signs of fluid overload?", a: "Fluid overload manifestations include: weight gain, edema (peripheral, pulmonary), JVD, crackles, dyspnea, increased BP, bounding pulse, and decreased hematocrit. Common in heart failure, renal failure, and excessive IV fluid administration." },
      { q: "What nursing interventions are needed for hyperkalemia?", a: "Immediate interventions: stop potassium intake, obtain ECG, administer calcium gluconate (cardiac protection), insulin with glucose (shifts K+ into cells), sodium bicarbonate (if acidotic), and kayexalate or dialysis for removal. This is a medical emergency requiring rapid intervention." }
    ]
  },
  'nclex-respiratory-disorders': {
    faqs: [
      { q: "What respiratory disorders are most common on the NCLEX?", a: "The most frequently tested respiratory disorders include COPD, asthma, pneumonia, pulmonary embolism, tuberculosis, ARDS, and pneumothorax. The NCLEX emphasizes oxygen therapy, airway management, medication administration, and recognizing respiratory distress." },
      { q: "When should oxygen therapy be used cautiously?", a: "Use oxygen cautiously in COPD patients with chronic CO2 retention. High-flow O2 can suppress the hypoxic drive to breathe. Titrate to maintain SpO2 88-92% in COPD. For other patients, the goal is typically SpO2 >94%. Always follow the prescribed flow rate and monitor response." },
      { q: "What are the signs of a pulmonary embolism?", a: "Classic signs include sudden dyspnea, pleuritic chest pain, tachypnea, tachycardia, hypoxia, and hemoptysis. Risk factors include immobility, surgery, pregnancy, oral contraceptives, and history of DVT. This is a medical emergency requiring immediate intervention." },
      { q: "How do you differentiate COPD from asthma on the NCLEX?", a: "COPD is chronic, progressive, and primarily caused by smoking. Symptoms are persistent with gradual decline. Asthma is episodic, triggered by allergens/exercise, and reversible with bronchodilators. COPD patients may retain CO2; asthmatics typically do not. Treatment differs: COPD requires long-acting bronchodilators; asthma uses inhaled corticosteroids and rescue inhalers." }
    ]
  }
};

const contentDir = 'content';
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html') && f !== 'index.html');

let updated = 0;

for (const file of files) {
  const base = file.replace('.html', '');
  
  // Find matching FAQ entry
  let faqEntry = null;
  for (const [key, data] of Object.entries(faqMap)) {
    if (base.includes(key.replace('nclex-', ''))) {
      faqEntry = data;
      break;
    }
  }
  
  if (!faqEntry) continue;
  
  const filepath = path.join(contentDir, file);
  let html = fs.readFileSync(filepath, 'utf8');
  
  // Skip if already has FAQ schema
  if (html.includes('FAQPage')) continue;
  
  // Build FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqEntry.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };
  
  const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>`;
  
  // Insert before closing </head>
  html = html.replace('</head>', schemaScript + '\n</head>');
  
  fs.writeFileSync(filepath, html);
  updated++;
}

console.log(`Added FAQ schema to ${updated} pages`);
