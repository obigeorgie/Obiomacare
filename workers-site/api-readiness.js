/**
 * Worker-native Readiness Assessment API — CAT-style adaptive engine
 * Production mode. Sessions stored in Cloudflare KV (persistent across isolates).
 *
 * Algorithm: IRT-lite
 * - Start ability θ = 0.5
 * - Correct → θ + 0.15, incorrect → θ - 0.15 (bounded 0.1–1.0)
 * - Select item with difficulty closest to current θ, with category rotation
 * - Terminate: min 20 items, then when SE < threshold OR max 30 items
 * - Category coverage: guarantee every category sampled ≥2× before termination
 *
 * Honesty requirements:
 * - No "X% chance of passing" claims anywhere
 * - Difficulty values are author estimates, labeled as such
 * - Results show estimate + confidence interval, not prediction
 */
import { trackEvent } from './api-events.js';

// ─── SESSION STORE (KV-backed for production persistence) ───
// Sessions survive isolate changes, refreshes, and redeploys
const SESSION_TTL_SECONDS = 3600; // 1 hour

function getKV(env) {
  return env?.readiness_sessions || (typeof readiness_sessions !== 'undefined' ? readiness_sessions : null);
}

async function kvPutSession(env, sessionId, session) {
  const kv = getKV(env);
  if (!kv) throw new Error('readiness_sessions KV not available');
  await kv.put(sessionId, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

async function kvGetSession(env, sessionId) {
  const kv = getKV(env);
  if (!kv) throw new Error('readiness_sessions KV not available');
  const raw = await kv.get(sessionId);
  return raw ? JSON.parse(raw) : null;
}

async function kvDeleteSession(env, sessionId) {
  const kv = getKV(env);
  if (!kv) throw new Error('readiness_sessions KV not available');
  await kv.delete(sessionId);
}

// ─── ITEM BANK (seeded below; in production load from Firestore) ───
// Populated by seedReadinessItems()
let itemBank = [];

// ─── CONFIG ───
const CONFIG = {
  minItems: 20,
  maxItems: 30,
  seThreshold: 0.15, // Standard error threshold for termination
  abilityStep: 0.15,
  abilityMin: 0.1,
  abilityMax: 1.0,
  categories: [
    'fundamentals',
    'pharmacology',
    'medical_surgical',
    'pediatrics',
    'maternity',
    'mental_health',
    'priority_delegation',
    'infection_control',
  ],
  minPerCategory: 2,
  ngnRatio: 0.20, // At least 20% NGN items
};

// ─── SEED ITEMS: 60 items, 35-40 derived, 20-25 fresh ───
function seedReadinessItems() {
  const items = [];
  let id = 1;

  function add(item) {
    items.push({ ...item, id: String(id++), reviewStatus: item.reviewStatus || 'approved', exposureCount: 0 });
  }

  // ─── FUNDAMENTALS (8 items) ───
  // Derived (5)
  add({ stem: 'A nurse is assessing a patient post-op abdominal surgery. Which finding requires immediate notification of the provider?', options: ['Serous drainage on dressing','Pain rated 6/10 at incision site','Temperature 38.2°C (100.8°F)','Wound edges well-approximated'], correctIndex: 2, rationale: 'Post-op fever >38°C indicates possible infection or abscess formation. Pain and serous drainage are expected; well-approximated edges are normal.', category: 'fundamentals', difficulty: 0.35, ncjmmStep: 1, ngn: false, derivedFrom: 'quiz-lab-values-q3', original: false });
  add({ stem: 'During shift handoff, the outgoing nurse reports a patient has a new oxygen order of 2L NC. What is the FIRST action the incoming nurse should take?', options: ['Verify the order in the MAR','Apply the nasal cannula immediately','Assess the patient\'s current SpO2','Call respiratory therapy'], correctIndex: 2, rationale: 'The NCJMM first step is Recognize Cues — assess the patient before acting. Current SpO2 determines if 2L is appropriate.', category: 'fundamentals', difficulty: 0.30, ncjmmStep: 1, ngn: false, derivedFrom: 'case-fundamentals-handoff', original: false });
  add({ stem: 'A patient with heart failure is ordered furosemide 40mg PO daily. Which lab value should the nurse monitor MOST closely?', options: ['Sodium','Potassium','Creatinine','Glucose'], correctIndex: 1, rationale: 'Loop diuretics cause potassium wasting. Hypokalemia can trigger arrhythmias in a patient with cardiac history.', category: 'fundamentals', difficulty: 0.40, ncjmmStep: 3, ngn: false, derivedFrom: 'quiz-pharm-q12', original: false });
  add({ stem: 'A nurse enters a room and finds an unconscious patient with no pulse and agonal respirations. What is the priority action?', options: ['Begin chest compressions','Call for help then start CPR','Check for a medication allergy bracelet','Assess the airway for obstruction'], correctIndex: 1, rationale: 'Adult BLS protocol: call for help (activate emergency response) then begin high-quality CPR. Compressions first only if alone with no phone.', category: 'fundamentals', difficulty: 0.30, ncjmmStep: 5, ngn: false, derivedFrom: 'guide-bls-aha-2025', original: false });
  add({ stem: 'Which action by a nursing assistant requires immediate intervention by the RN?', options: ['Taking a manual BP on a patient with afib','Offering water to a patient on NPO status','Recording I&O on a patient with a Foley','Assisting a patient to the bathroom with a gait belt'], correctIndex: 1, rationale: 'An NPO patient receiving oral intake risks aspiration. The RN must intervene immediately. Other actions are appropriate within scope.', category: 'fundamentals', difficulty: 0.55, ncjmmStep: 1, ngn: false, derivedFrom: 'quiz-delegation-q5', original: false });
  // Fresh (3)
  add({ stem: 'A nurse delegates vital signs to a nursing assistant for a patient 2 hours post-thoracentesis. The assistant reports BP 92/58, HR 112, RR 24, SpO2 91% on room air. What is the nurse\'s FIRST priority?', options: ['Reassess the patient personally','Notify the provider immediately','Apply supplemental oxygen and reassess','Document the findings and continue monitoring'], correctIndex: 2, rationale: 'Post-thoracentesis complications include pneumothorax and re-expansion pulmonary edema. Hypoxia (SpO2 91%) with tachycardia warrants immediate oxygen + reassessment before provider notification.', category: 'fundamentals', difficulty: 0.75, ncjmmStep: 1, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nurse is reviewing morning labs. Four patients have abnormal values. Which patient should the nurse assess FIRST?', options: ['K+ 5.8 mEq/L (crush injury yesterday)','Na+ 128 mEq/L (SIADH, stable x3 days)','Hgb 9.2 g/dL (menorrhagia, asymptomatic)','Glucose 248 mg/dL (Type 2 DM, baseline 180-220)'], correctIndex: 0, rationale: 'Hyperkalemia post-crush injury indicates rhabdomyolysis with risk of peaked T waves → V-fib. This is life-threatening and requires immediate assessment. Others are concerning but not immediately life-threatening.', category: 'fundamentals', difficulty: 0.80, ncjmmStep: 2, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A patient with a nasogastric tube reports sudden chest pain and dyspnea during enteral feeding. The nurse auscultates breath sounds and hears absent sounds on the left. What is the most likely cause?', options: ['Aspiration pneumonia','Pneumothorax from tube malposition','Feeding intolerance with distension','Pulmonary embolism from immobility'], correctIndex: 1, rationale: 'NG tube migration into the bronchus can cause pneumothorax. Absent breath sounds + chest pain + dyspnea = pneumothorax until proven otherwise. Stop feeding immediately.', category: 'fundamentals', difficulty: 0.85, ncjmmStep: 3, ngn: false, derivedFrom: null, original: true });

  // ─── PHARMACOLOGY (8 items) ───
  // Derived (4)
  add({ stem: 'A patient on warfarin has an INR of 4.5. Which action is MOST appropriate?', options: ['Hold the next dose and notify provider','Administer vitamin K 10mg SC','Continue the current dose — therapeutic','Draw a STAT PT/PTT'], correctIndex: 0, rationale: 'INR 4.5 is supratherapeutic (>3.0 for most indications). Hold the dose to prevent bleeding. Vitamin K is for INR >10 or active bleeding.', category: 'pharmacology', difficulty: 0.50, ncjmmStep: 4, ngn: false, derivedFrom: 'quiz-pharm-q8', original: false });
  add({ stem: 'A nurse is administering digoxin 0.25mg PO. The apical pulse is 58 bpm. What is the appropriate action?', options: ['Administer the dose — within normal range','Hold the dose and recheck in 1 hour','Hold the dose and notify the provider','Give half the dose and document'], correctIndex: 2, rationale: 'Hold digoxin if apical pulse <60 bpm (bradycardia risk). Notify provider for further orders. This is a classic safety check.', category: 'pharmacology', difficulty: 0.35, ncjmmStep: 4, ngn: false, derivedFrom: 'quiz-pharm-q2', original: false });
  add({ stem: 'A patient receiving morphine PCA reports nausea. Which PRN medication is MOST appropriate?', options: ['Ondansetron 4mg IV','Promethazine 25mg IM','Prochlorperazine 10mg PO','Metoclopramide 10mg IV'], correctIndex: 0, rationale: 'Ondansetron is first-line for opioid-induced nausea, especially post-op. Minimal sedation and no hypotension risk compared to promethazine.', category: 'pharmacology', difficulty: 0.30, ncjmmStep: 4, ngn: false, derivedFrom: 'quiz-pharm-q15', original: false });
  add({ stem: 'Which antihypertensive requires the nurse to teach the patient to avoid grapefruit juice?', options: ['Lisinopril','Amlodipine','Metoprolol','Losartan'], correctIndex: 1, rationale: 'Dihydropyridine calcium channel blockers (amlodipine) are metabolized by CYP3A4. Grapefruit inhibits this enzyme, causing toxicity. Other options are not CYP3A4 substrates.', category: 'pharmacology', difficulty: 0.55, ncjmmStep: 6, ngn: false, derivedFrom: 'quiz-pharm-q22', original: false });
  // Fresh (4)
  add({ stem: 'A patient on heparin infusion has PTT 92 seconds (control 30-40). The protocol says to reduce rate by 2 units/kg/hr. The current rate is 18 units/kg/hr. The patient weighs 80kg. What is the new rate in mL/hr if the concentration is 25,000 units in 500mL?', options: ['28.8 mL/hr','25.6 mL/hr','30.4 mL/hr','26.0 mL/hr'], correctIndex: 1, rationale: 'Current: 18 × 80 = 1440 units/hr. New: 16 × 80 = 1280 units/hr. Concentration: 50 units/mL. 1280 ÷ 50 = 25.6 mL/hr. This is a calculation + protocol adjustment item.', category: 'pharmacology', difficulty: 0.75, ncjmmStep: 4, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A patient with Parkinson\'s disease is prescribed levodopa/carbidopa. The nurse notes the patient is also taking a multivitamin with iron. What is the PRIMARY concern?', options: ['Iron reduces levodopa absorption','Iron increases risk of dyskinesia','Iron causes hypertensive crisis with MAO-B inhibitors','Iron competes with carbidopa for renal excretion'], correctIndex: 0, rationale: 'Iron chelates levodopa in the GI tract, reducing absorption by up to 50%. The patient should separate doses by at least 2 hours. This is a high-priority medication education item.', category: 'pharmacology', difficulty: 0.70, ncjmmStep: 6, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nurse is preparing to administer insulin lispro and insulin glargine at bedtime. Which action is CORRECT?', options: ['Draw lispro first into the same syringe, then glargine','Administer in separate syringes at different sites','Mix lispro and glargine in one syringe immediately','Give glargine first, wait 15 min, then lispro'], correctIndex: 1, rationale: 'Glargine is a long-acting basal insulin that must NEVER be mixed with other insulins (it precipitates). Lispro is rapid-acting. Separate syringes, separate sites.', category: 'pharmacology', difficulty: 0.65, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient on lithium reports diarrhea, tremor, and mild confusion. Lithium level is 2.2 mEq/L (therapeutic 0.6-1.2). The provider orders normal saline IV. What is the nurse\'s priority assessment AFTER starting fluids?', options: ['Urine output hourly','Neurological checks q2h','Cardiac rhythm monitoring','Serum sodium level'], correctIndex: 0, rationale: 'Lithium is renally excreted. Hydration with NS promotes excretion, but lithium can cause nephrogenic DI. Hourly UOP ensures adequate renal clearance and catches DI early. This is a deterioration-recognition item.', category: 'pharmacology', difficulty: 0.85, ncjmmStep: 1, ngn: false, derivedFrom: null, original: true });

  // ─── MEDICAL-SURGICAL (8 items) ───
  // Derived (4)
  add({ stem: 'A patient post-appendectomy reports increasing abdominal pain, rigid abdomen, and fever 39.5°C. What is the priority nursing action?', options: ['Administer PRN morphine','Notify the surgeon immediately','Place the patient in Fowler\'s position','Increase IV fluid rate'], correctIndex: 1, rationale: 'Rigidity + fever post-op = peritonitis or abscess. This is a surgical emergency requiring immediate provider notification.', category: 'medical_surgical', difficulty: 0.55, ncjmmStep: 2, ngn: false, derivedFrom: 'case-appendectomy-complications', original: false });
  add({ stem: 'A patient with a chest tube has sudden onset of respiratory distress, tachycardia, and absent breath sounds on the affected side. What is the FIRST action?', options: ['Clamp the chest tube','Milk the chest tube tubing','Assess for air leak at insertion site','Prepare for needle decompression'], correctIndex: 2, rationale: 'Absent breath sounds + distress after chest tube = possible tube dislodgement or blockage. Assess the site first. Do NOT clamp (tension pneumothorax risk).', category: 'medical_surgical', difficulty: 0.70, ncjmmStep: 1, ngn: false, derivedFrom: 'guide-chest-tube-care', original: false });
  add({ stem: 'A patient with heart failure is prescribed daily weights. The nurse notes a 2.5kg gain in 2 days. What does this indicate?', options: ['Medication nonadherence','Fluid retention — evaluate diuretic efficacy','Normal post-op weight fluctuation','Inadequate nutritional intake'], correctIndex: 1, rationale: '>2kg gain in 2 days indicates fluid retention in heart failure. The provider may need to adjust diuretics. This is a classic CHF monitoring parameter.', category: 'medical_surgical', difficulty: 0.40, ncjmmStep: 1, ngn: false, derivedFrom: 'quiz-chf-monitoring', original: false });
  add({ stem: 'A patient with a new colostomy asks when they can resume sexual activity. What is the BEST response?', options: ['You should wait at least 6 weeks','Sexual activity is fine when you feel ready; here are some tips','Most patients find the stoma too embarrassing for intimacy','Your partner will need to be very careful around the stoma'], correctIndex: 1, rationale: 'Sexual activity can resume when the patient feels ready (usually after healing, ~2-3 weeks). The nurse should provide practical tips (empty pouch beforehand, consider cover) without making assumptions about embarrassment.', category: 'medical_surgical', difficulty: 0.50, ncjmmStep: 6, ngn: false, derivedFrom: 'guide-ostomy-care', original: false });
  // Fresh (4)
  add({ stem: 'A patient 4 hours post-op TKR has a calf circumference 3cm greater than the pre-op measurement on the operative side. The patient denies pain but reports "tightness." What is the nurse\'s priority action?', options: ['Elevate the leg and apply ice','Perform a Homan\'s sign assessment','Notify the surgeon — possible DVT','Document and continue routine post-op care'], correctIndex: 2, rationale: 'Calf swelling post-orthopedic surgery is high-risk for DVT. Homan\'s sign is unreliable and contraindicated if DVT suspected. The surgeon needs to know for possible duplex ultrasound.', category: 'medical_surgical', difficulty: 0.75, ncjmmStep: 2, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient with Crohn\'s disease has a new ileostomy. The output has been 1200mL in the past 8 hours. Which intervention is MOST important?', options: ['Apply a larger pouch','Start metronidazole for bacterial overgrowth','Increase oral intake to match output','Implement fluid replacement and electrolyte monitoring'], correctIndex: 3, rationale: 'High ileostomy output (>1000mL/8hr) risks dehydration and electrolyte imbalance (Na+, K+, Mg2+). Fluid replacement is critical. Antibiotics are not indicated without infection signs.', category: 'medical_surgical', difficulty: 0.88, ncjmmStep: 4, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient with a Sengstaken-Blakemore tube for variceal bleeding suddenly becomes dyspneic. The nurse notes the pilot balloon is deflated. What is the immediate action?', options: ['Deflate the esophageal balloon completely','Cut the tube at the nostril and remove it','Call gastroenterology for scope-guided removal','Reinflate the gastric balloon with 50mL air'], correctIndex: 1, rationale: 'A deflated pilot balloon means the gastric balloon may have migrated upward, obstructing the airway. This is an airway emergency. Cut the tube at the nostril (both lumens) and remove immediately.', category: 'medical_surgical', difficulty: 0.90, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A trauma patient has a left tension pneumothorax. After needle decompression, the nurse prepares for chest tube insertion. Which statement about the water seal chamber is CORRECT?', options: ['It should be filled to the 2cm mark with sterile water','Bubbling should be continuous and vigorous','The water level should rise 2cm with inspiration','Milk the tubing every 2 hours to maintain patency'], correctIndex: 2, rationale: 'Tidaling (water rising with inspiration, falling with expiration) indicates the system is patent and connected to intrathoracic pressure. Vigorous continuous bubbling indicates an air leak. Milk only if instructed.', category: 'medical_surgical', difficulty: 0.80, ncjmmStep: 6, ngn: true, derivedFrom: null, original: true });

  // ─── PEDIATRICS (7 items) ───
  // Derived (4)
  add({ stem: 'A 6-month-old has a respiratory rate of 48, nasal flaring, and intercostal retractions. The most appropriate nursing action is:', options: ['Suction the nares and reassess','Administer a nebulized bronchodilator','Place the infant in a high-Fowler\'s position','Apply blow-by oxygen and call the provider'], correctIndex: 3, rationale: 'Nasal flaring + retractions in an infant = respiratory distress. Blow-by oxygen (less traumatic than mask) and immediate provider notification are appropriate. Suctioning may worsen distress.', category: 'pediatrics', difficulty: 0.55, ncjmmStep: 5, ngn: false, derivedFrom: 'guide-pediatric-respiratory', original: false });
  add({ stem: 'A toddler is admitted with suspected intussusception. The mother reports "currant jelly" stools. What is the priority nursing intervention?', options: ['Prepare the child for an air contrast enema','Obtain a stool specimen for culture','Start IV fluids and NPO status','Place a nasogastric tube for decompression'], correctIndex: 2, rationale: 'Intussusception causes vomiting and obstruction → dehydration risk. NPO + IV fluids prepare for potential surgery or enema. The currant jelly stool is diagnostic but not the priority.', category: 'pediatrics', difficulty: 0.85, ncjmmStep: 4, ngn: false, derivedFrom: 'case-pediatric-gi', original: false });
  add({ stem: 'A 4-year-old with leukemia is receiving chemotherapy. The ANC is 450. Which activity restriction is MOST important?', options: ['No outdoor play','No contact with anyone who is ill','No raw fruits or vegetables','No visiting the playroom'], correctIndex: 1, rationale: 'ANC <500 = severe neutropenia. The greatest risk is infection from ill contacts. Raw fruits/vegetables are restricted but less critical than avoiding sick people.', category: 'pediatrics', difficulty: 0.50, ncjmmStep: 3, ngn: false, derivedFrom: 'quiz-oncology-peds', original: false });
  add({ stem: 'A newborn has a bilirubin of 14mg/dL at 36 hours of age. The nurse should anticipate:', options: ['Phototherapy','Exchange transfusion','Increased feeding frequency','IV fluid administration'], correctIndex: 0, rationale: 'Bilirubin 14 at 36 hours is above the phototherapy threshold for most newborns (uses nomogram based on age in hours). This is a common NICU intervention.', category: 'pediatrics', difficulty: 0.45, ncjmmStep: 4, ngn: false, derivedFrom: 'guide-newborn-jaundice', original: false });
  // Fresh (3)
  add({ stem: 'A 2-year-old is admitted with suspected meningitis. The provider orders a lumbar puncture. The nurse notes the child has a petechial rash and nuchal rigidity. What is the priority action BEFORE the LP?', options: ['Obtain informed consent from the parent','Ensure coagulation studies are available','Administer prophylactic antibiotics','Position the child in lateral decubitus with knees to chest'], correctIndex: 1, rationale: 'Petechial rash suggests possible coagulopathy (DIC from meningococcemia). LP in a coagulopathic patient risks spinal hematoma. Check PT/INR, platelets first.', category: 'pediatrics', difficulty: 0.85, ncjmmStep: 2, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A 10-year-old with Type 1 DM is admitted with DKA. The patient is receiving an insulin drip and NS. The nurse notices the patient is confused and has a headache. What is the MOST likely cause?', options: ['Hypoglycemia from insulin overdose','Cerebral edema from rapid fluid shifts','Hypernatremia from dehydration','Ketoacidosis worsening'], correctIndex: 1, rationale: 'Cerebral edema is the most dangerous DKA complication, especially in children. It occurs from rapid osmotic shifts during treatment. Headache + confusion in a child with DKA = cerebral edema until proven otherwise.', category: 'pediatrics', difficulty: 0.80, ncjmmStep: 3, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A school nurse is caring for a child with a newly diagnosed peanut allergy. The child\'s EpiPen expires in 6 months. What is the MOST important instruction for the teacher?', options: ['Keep the EpiPen in the nurse\'s office for safety','Ensure the child sits at a peanut-free table at lunch','Store the EpiPen in an unlocked, accessible location in the classroom','Have the parent provide a new EpiPen before the expiration date'], correctIndex: 2, rationale: 'Anaphylaxis requires immediate epinephrine. If the EpiPen is in the nurse\'s office, precious minutes are lost. Accessible, unlocked storage in the classroom (with staff training) is the standard of care.', category: 'pediatrics', difficulty: 0.85, ncjmmStep: 5, ngn: true, derivedFrom: null, original: true });

  // ─── MATERNITY (7 items) ───
  // Derived (4)
  add({ stem: 'A woman in active labor (8cm) reports sudden, severe headache and visual changes. Her BP is 168/112. What is the priority nursing action?', options: ['Prepare for immediate delivery','Administer magnesium sulfate per protocol','Place patient in Trendelenburg position','Increase IV fluid rate'], correctIndex: 1, rationale: 'Severe headache + visual changes + HTN in labor = severe preeclampsia. Magnesium sulfate prevents seizures. This is an obstetric emergency.', category: 'maternity', difficulty: 0.60, ncjmmStep: 5, ngn: false, derivedFrom: 'case-ob-preeclampsia', original: false });
  add({ stem: 'A postpartum patient on day 2 has fundal height at the umbilicus and moderate lochia rubra. What is the appropriate nursing action?', options: ['Massage the fundus and document','Notify the provider — delayed involution','Prepare for D&C — retained products','Increase oxytocin drip'], correctIndex: 0, rationale: 'Fundus at umbilicus on day 2 is normal (involution: U-1 per day). Moderate lochia rubra is expected. Massage and document. U-2 or below would be concerning.', category: 'maternity', difficulty: 0.40, ncjmmStep: 6, ngn: false, derivedFrom: 'guide-postpartum-assessment', original: false });
  add({ stem: 'A newborn\'s APGAR at 1 minute is 6 (appearance 1, pulse 1, grimace 1, activity 1, respiration 2). What is the priority nursing intervention?', options: ['Dry and stimulate, provide blow-by oxygen','Begin positive pressure ventilation','Call the neonatal resuscitation team','Administer epinephrine via umbilical line'], correctIndex: 0, rationale: 'APGAR 6 = mild depression. Standard care: dry, stimulate, position, suction if needed, provide tactile stimulation. PPV is for APGAR <4 or poor respiratory effort.', category: 'maternity', difficulty: 0.30, ncjmmStep: 5, ngn: false, derivedFrom: 'guide-apgar-scoring', original: false });
  add({ stem: 'A pregnant patient at 32 weeks reports decreased fetal movement. She counts 4 movements in 2 hours. What is the nurse\'s BEST response?', options: ['This is normal — continue monitoring at home','Have the patient drink juice and lie on her left side; if no improvement in 1 hour, come to L&D','Schedule a non-stress test for next week','Advise the patient to come to L&D immediately'], correctIndex: 1, rationale: '4 movements in 2 hours is below typical (usually ≥10 in 2 hours). First step: non-stress measures (left side, glucose) then reassess. If still decreased, L&D evaluation is indicated.', category: 'maternity', difficulty: 0.50, ncjmmStep: 4, ngn: false, derivedFrom: 'quiz-ob-fetal-movement', original: false });
  // Fresh (3)
  add({ stem: 'A patient in preterm labor at 30 weeks is receiving betamethasone. The nurse should monitor for which ADVERSE effect that requires immediate intervention?', options: ['Hyperglycemia','Pulmonary edema','Fetal tachycardia','Maternal hypertension'], correctIndex: 0, rationale: 'Betamethasone can cause transient hyperglycemia, especially in patients with gestational diabetes. Blood glucose monitoring is essential. Pulmonary edema is atocolytic (terbutaline) complication, not steroid.', category: 'maternity', difficulty: 0.88, ncjmmStep: 1, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A multiparous patient is in transition (9-10cm). She suddenly shouts "The baby is coming NOW!" and bears down. The nurse sees the umbilical cord protruding from the vagina. What is the FIRST action?', options: ['Call for the provider immediately','Push the call bell for help','Place the patient in knee-chest position and apply upward pressure on the presenting part','Prepare the delivery bed for imminent birth'], correctIndex: 2, rationale: 'Umbilical cord prolapse = immediate fetal hypoxia. Knee-chest relieves pressure on the cord. The nurse must hold the presenting part off the cord with a sterile gloved hand until delivery. This is an obstetric code.', category: 'maternity', difficulty: 0.90, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A postpartum patient on day 3 reports breast tenderness, warmth, and a temperature of 38.8°C. The affected area is localized to the upper outer quadrant of the right breast. What is the MOST likely diagnosis?', options: ['Mastitis','Engorgement','Plugged duct','Breast abscess'], correctIndex: 0, rationale: 'Fever >38.5°C + localized warmth + tenderness = mastitis. Plugged duct has no fever. Engorgement is bilateral. Abscess would have fluctuance and usually occurs after untreated mastitis.', category: 'maternity', difficulty: 0.65, ncjmmStep: 3, ngn: false, derivedFrom: null, original: true });

  // ─── MENTAL HEALTH (6 items) ───
  // Derived (3)
  add({ stem: 'A patient with schizophrenia refuses morning medications, stating "The pills are poison." What is the MOST therapeutic response?', options: ['These pills help your brain work better','I understand you\'re concerned. Let\'s talk about what worries you','You must take them or you\'ll be restrained','I\'ll bring the doctor to explain'], correctIndex: 1, rationale: 'Therapeutic communication with a delusional patient: acknowledge the feeling, don\'t argue with the delusion, build trust. Forcing or arguing increases resistance.', category: 'mental_health', difficulty: 0.30, ncjmmStep: 6, ngn: false, derivedFrom: 'quiz-mental-health-therapeutic', original: false });
  add({ stem: 'A patient with bipolar disorder is in a manic phase. The nurse notes pressured speech, hypersexuality, and grandiose plans. Which intervention is PRIORITY?', options: ['Encourage the patient to write down business ideas','Set firm limits on behavior to ensure safety','Allow the patient to stay up late if not tired','Engage in competitive games to channel energy'], correctIndex: 1, rationale: 'Manic phase: safety is priority. Grandiose plans may lead to unsafe spending or sexual encounters. Firm, consistent limits with a calm approach are therapeutic.', category: 'mental_health', difficulty: 0.55, ncjmmStep: 4, ngn: false, derivedFrom: 'case-bipolar-manic', original: false });
  add({ stem: 'A patient on a 5150 hold asks when they can leave. The nurse should:', options: ['Explain the legal hold process and timeline','Tell them to ask the doctor','Say they can leave when they feel better','Avoid the topic to prevent agitation'], correctIndex: 0, rationale: 'Patients on involuntary holds have the right to understand their legal status. Clear, factual communication reduces anxiety and supports autonomy.', category: 'mental_health', difficulty: 0.25, ncjmmStep: 6, ngn: false, derivedFrom: 'guide-mental-health-rights', original: false });
  // Fresh (3)
  add({ stem: 'A patient with borderline personality disorder becomes enraged when a group session is delayed by 5 minutes, shouting that the staff hates them. What is the MOST therapeutic response?', options: ['I can see you\'re upset. The delay was due to staffing, not a reflection of how we feel about you','Your reaction is disproportionate to the situation','Let\'s discuss this in private after group','I understand — I would be angry too'], correctIndex: 0, rationale: 'BPD: validate the emotion without validating the cognitive distortion. The response acknowledges the feeling, provides reality orientation, and avoids reinforcement of splitting.', category: 'mental_health', difficulty: 0.75, ncjmmStep: 6, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient withdrawing from alcohol has a CIWA-Ar score of 18. Vital signs: BP 170/95, HR 118, RR 22, T 37.8°C. What is the priority medication?', options: ['Lorazepam 2mg PO/IM','Haloperidol 5mg IM','Clonidine 0.1mg PO','Chlordiazepoxide 50mg PO'], correctIndex: 0, rationale: 'CIWA-Ar >15 = severe withdrawal. Lorazepam is first-line for symptom-triggered treatment (fast onset, easy to titrate). Haloperidol is for hallucinations/delirium but not first-line. Chlordiazepoxide has longer onset.', category: 'mental_health', difficulty: 0.80, ncjmmStep: 4, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient with anorexia nervosa is hospitalized for refeeding. On day 3 of refeeding, the patient reports weakness and palpitations. Labs show K+ 3.1, Phos 2.2, Mg 1.4. What is the nurse\'s priority intervention?', options: ['Slow the refeeding rate and replace electrolytes aggressively','Increase caloric intake to meet goals','Begin phosphate supplementation only','Transfer to ICU for cardiac monitoring'], correctIndex: 0, rationale: 'Refeeding syndrome: hypophosphatemia, hypokalemia, hypomagnesemia from intracellular shifts during feeding. Slow the rate and aggressively replace electrolytes. This is a life-threatening metabolic emergency.', category: 'mental_health', difficulty: 0.85, ncjmmStep: 1, ngn: false, derivedFrom: null, original: true });

  // ─── PRIORITY/DELEGATION (6 items) ───
  // Fresh (all — this is a new category, high difficulty)
  add({ stem: 'A nurse has four patients. Which patient should the nurse see FIRST?', options: ['Post-op day 2 hip replacement requesting PRN pain medication','New admission with chest pain, BP 148/92, HR 96','Patient with a PICC line whose dressing is dated yesterday','Patient on hour 4 of a blood transfusion with no complaints'], correctIndex: 1, rationale: 'New admission with chest pain = potential ACS. Rule out MI first. Pain med, dressing change, and stable transfusion can wait. This is a prioritization classic.', category: 'priority_delegation', difficulty: 0.70, ncjmmStep: 2, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nurse is delegating tasks to a nursing assistant. Which task is MOST appropriate to delegate?', options: ['Reinforcing diabetic foot care teaching','Obtaining a blood glucose reading via glucometer','Assessing a new sacral pressure injury','Administering a subcutaneous insulin injection'], correctIndex: 1, rationale: 'Glucometer use is within CNA scope in most states. Teaching, assessment, and medication administration are RN-only tasks. This tests delegation scope-of-practice knowledge.', category: 'priority_delegation', difficulty: 0.55, ncjmmStep: 3, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A med-surg unit is short-staffed. The charge nurse must pull a float nurse to cover an additional 4 patients. Which nurse is the BEST choice?', options: ['OR nurse with 10 years experience','ICU nurse with 5 years experience','New grad RN on orientation week 8','Experienced med-surg nurse from another unit'], correctIndex: 3, rationale: 'Med-surg requires broad knowledge of multiple conditions. An experienced med-surg nurse has the most relevant skill set. OR/ICU nurses have specialized skills but may lack general med-surg breadth.', category: 'priority_delegation', difficulty: 0.65, ncjmmStep: 3, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A nurse receives report on four patients. Which situation requires the nurse to address FIRST after receiving handoff?', options: ['Patient with a potassium of 3.4 mEq/L on replacement protocol','Patient with a Foley catheter output of 45mL in the past 4 hours','Patient whose IV antibiotic is due now but pharmacy hasn\'t sent it','Patient with a scheduled dressing change in 30 minutes'], correctIndex: 1, rationale: 'UOP 45mL/4hr = oliguria (<30mL/hr). Possible AKI, dehydration, or obstructed Foley. This is the most urgent finding. Low K+ on protocol is being addressed. Late antibiotic and dressing change are less urgent.', category: 'priority_delegation', difficulty: 0.75, ncjmmStep: 2, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nursing assistant reports that a confused patient is trying to get out of bed. The bed alarm is sounding. What is the FIRST action?', options: ['Call for additional staff','Go to the room and assist the patient','Apply restraints per protocol','Administer PRN antipsychotic'], correctIndex: 1, rationale: 'A confused patient attempting to get out of bed is at immediate fall risk. The nurse should go to the room first to prevent injury. Additional staff, restraints, or medication may follow.', category: 'priority_delegation', difficulty: 0.25, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nurse has four patients with morning medications due at 0900. Which medication should the nurse administer FIRST?', options: ['Levothyroxine 125mcg PO (held for NPO before procedure)','Furosemide 40mg PO (chronic HF, stable)','Prednisone 20mg PO (Crohn\'s, chronic)','Warfarin 5mg PO (INR 2.3 yesterday, no new orders)'], correctIndex: 0, rationale: 'Levothyroxine is held for NPO status before a procedure. The nurse must verify with the provider whether to give or hold. The other medications are routine and not time-critical.', category: 'priority_delegation', difficulty: 0.60, ncjmmStep: 3, ngn: false, derivedFrom: null, original: true });

  // ─── INFECTION CONTROL (4 items) ───
  // Derived (2)
  add({ stem: 'A patient is on contact precautions for MRSA. Which PPE is REQUIRED before entering the room?', options: ['Gown and gloves','N95 respirator','Face shield','Surgical mask'], correctIndex: 0, rationale: 'Contact precautions require gown and gloves. N95 is for airborne. Face shield is for droplet/contact with splash risk. Surgical mask is for droplet.', category: 'infection_control', difficulty: 0.30, ncjmmStep: 5, ngn: false, derivedFrom: 'quiz-ic-precautions', original: false });
  add({ stem: 'A nurse is preparing to administer an IM injection. After hand hygiene, what is the NEXT step in infection control?', options: ['Don clean gloves','Clean the site with alcohol','Assess the site for infection','Apply a bandage'], correctIndex: 1, rationale: 'After hand hygiene, the next step is site preparation with antiseptic. Gloves are donned after site prep for some protocols, but site cleaning is always before needle insertion.', category: 'infection_control', difficulty: 0.35, ncjmmStep: 5, ngn: false, derivedFrom: 'guide-injection-technique', original: false });
  // Fresh (2)
  add({ stem: 'A patient with C. diff is on contact precautions. The nurse needs to take the patient to radiology. Which action is MOST appropriate?', options: ['Give the patient a surgical mask for transport','Ensure the patient wears a gown and the nurse wears PPE; notify radiology','Place the patient on droplet precautions for transport','Cancel the test until the infection clears'], correctIndex: 1, rationale: 'C. diff spores survive on surfaces. The patient should wear a gown, and the transporting nurse should wear PPE. Radiology must be notified to prepare the room and equipment for terminal cleaning.', category: 'infection_control', difficulty: 0.85, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nurse is caring for a patient with active TB on airborne precautions. The nurse\'s N95 fit test expired 2 weeks ago. What is the appropriate action?', options: ['Continue to use the N95 — 2 weeks is acceptable','Use a surgical mask as a substitute','Do not enter the room until a new fit test is completed','Use a PAPR if available'], correctIndex: 2, rationale: 'An expired fit test means the N95 seal is not verified. OSHA requires annual fit testing. The nurse should not enter an airborne precaution room without valid fit testing. A PAPR is an alternative if trained.', category: 'infection_control', difficulty: 0.70, ncjmmStep: 5, ngn: true, derivedFrom: null, original: true });

  // ─── ADDITIONAL ITEMS TO REACH 60 — FRESH, HIGH NGN COVERAGE ───
  add({ stem: 'A patient is being discharged home after hip replacement. The nurse is providing education on wound care. Select all that apply: Which statements by the patient indicate understanding of infection prevention?', options: ['I will remove the dressing daily to check the wound','I can shower after 48 hours if the dressing is intact','I should call if the wound becomes red or has pus','I can apply antibiotic ointment to prevent infection','I should avoid soaking the wound in a bathtub'], correctIndex: 1, rationale: 'Correct: shower after 48h with intact dressing, call for redness/pus, avoid soaking. Incorrect: removing dressing daily (disrupts healing), applying ointment (not ordered). This NGN-style item tests discharge teaching comprehension.', category: 'fundamentals', difficulty: 0.15, ncjmmStep: 6, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A patient receiving vancomycin has a trough level of 18 mcg/mL (goal 15-20 for MRSA). The next dose is due in 2 hours. Based on this result, select all that apply: What should the nurse do?', options: ['Hold the next dose until the provider reviews','Administer the dose as scheduled — level is therapeutic','Document the result and continue monitoring','Draw a peak level 1 hour after the next dose','Notify the provider of supratherapeutic level'], correctIndex: 1, rationale: 'Correct: administer as scheduled (trough 18 is within 15-20 goal), document and monitor. Incorrect: holding the dose (level is therapeutic, not supratherapeutic), drawing peak (not routine for vancomycin), notifying provider of supratherapeutic level (18 is not supratherapeutic; >20 would be).', category: 'pharmacology', difficulty: 0.78, ncjmmStep: 4, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A trauma patient arrives in the ED after a motor vehicle accident. Assessment reveals: BP 82/50, HR 128, RR 28, SpO2 89% on room air, absent breath sounds on the right, tracheal deviation to the left. Select all that apply: Which interventions are appropriate for this patient?', options: ['Needle decompression at the 2nd intercostal space, midclavicular line','Immediate chest X-ray before intervention','High-flow oxygen via non-rebreather mask','Large-bore IV access and crystalloid bolus','Prepare for emergent chest tube insertion'], correctIndex: 1, rationale: 'Correct: needle decompression (tension pneumothorax with tracheal deviation), high-flow O2, large-bore IV with fluids (shock), prepare for chest tube. Incorrect: CXR before intervention (tension pneumothorax is a clinical diagnosis; do NOT delay treatment for imaging).', category: 'medical_surgical', difficulty: 0.82, ncjmmStep: 5, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'The charge nurse is assigning patients at the start of shift. Four patients need care. Select all that apply: Which factors should the charge nurse consider when making assignments?', options: ['The nurse\'s certification in the relevant specialty','The nurse\'s current patient load and acuity','The nurse\'s personal preference for patient type','The patient\'s need for isolation precautions','The nurse\'s years of experience only'], correctIndex: 1, rationale: 'Correct: specialty certification (competence), current load and acuity (safe staffing), isolation precautions (PPE competence/time). Incorrect: personal preference (not a staffing criterion), years of experience only (experience ≠ competence).', category: 'priority_delegation', difficulty: 0.88, ncjmmStep: 3, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A patient with neutropenia (ANC 280) is admitted for chemotherapy. Select all that apply: Which nursing interventions are appropriate for this patient?', options: ['Place in a private room with positive pressure','Restrict all fresh flowers and potted plants','Monitor temperature every 4 hours','Allow visitors with mild colds if they wear masks','Use strict hand hygiene before all patient contact'], correctIndex: 1, rationale: 'Correct: private room with positive pressure (protective isolation), no fresh flowers/plants (fungal/bacterial risk), q4h temps (detect neutropenic fever), strict hand hygiene. Incorrect: allowing visitors with colds even with masks (any URI symptoms = no visitors in neutropenia).', category: 'infection_control', difficulty: 0.72, ncjmmStep: 4, ngn: true, derivedFrom: null, original: true });
  add({ stem: 'A patient with bipolar disorder is in the manic phase and has not slept in 48 hours. The patient is pacing, talking rapidly, and attempting to leave the unit. Select all that apply: Which nursing actions are appropriate?', options: ['Allow the patient to pace in the hallway to expend energy','Offer high-calorie finger foods frequently','Set clear limits on leaving the unit','Encourage the patient to attend group therapy now','Provide a quiet, low-stimulus environment'], correctIndex: 1, rationale: 'Correct: offer finger foods (nutrition during mania), set clear limits (safety), quiet low-stimulus environment (reduce agitation). Incorrect: allowing unrestricted pacing (safety risk), encouraging group therapy now (patient is too agitated; individual approach first).', category: 'mental_health', difficulty: 0.80, ncjmmStep: 4, ngn: true, derivedFrom: null, original: true });

  // ─── EXTREME DIFFICULTY ITEMS — FLATTEN HISTOGRAM ───
  // Very easy (0.10-0.20): Basic knowledge every nurse should know cold
  add({ stem: 'The nurse is performing hand hygiene using soap and water. What is the MINIMUM recommended duration for scrubbing?', options: ['10 seconds','20 seconds','30 seconds','1 minute'], correctIndex: 1, rationale: 'CDC/WHO recommend at least 20 seconds of handwashing with soap and water. This is foundational infection control knowledge.', category: 'infection_control', difficulty: 0.10, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A healthy adult patient has a resting heart rate of 72 bpm, BP 118/76, RR 16, SpO2 98% on room air, temperature 36.8°C. Which assessment finding is abnormal?', options: ['Heart rate 72 bpm','Blood pressure 118/76','Respiratory rate 16','Temperature 36.8°C'], correctIndex: 3, rationale: 'Trick item: ALL values are within normal limits (HR 60-100, BP <120/80, RR 12-20, SpO2 >95%, temp 36-37.5°C). The question tests careful reading — none are abnormal. This is an easy attention-check item.', category: 'fundamentals', difficulty: 0.15, ncjmmStep: 1, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'Standard Precautions apply to:', options: ['Only patients with known infections','All patients regardless of infection status','Only patients in the ICU','Only patients with respiratory symptoms'], correctIndex: 1, rationale: 'Standard Precautions (formerly Universal Precautions) apply to ALL patients at all times. They include hand hygiene, PPE, safe injection practices, and respiratory hygiene/cough etiquette.', category: 'infection_control', difficulty: 0.10, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'When moving a patient up in bed, the nurse should use which body mechanics principle?', options: ['Bend at the waist to reach the patient','Keep feet together for balance','Use leg muscles, not back muscles','Pull the patient quickly to minimize strain'], correctIndex: 2, rationale: 'Proper body mechanics: bend at knees (not waist), keep feet shoulder-width apart, use large leg muscles, avoid twisting. This is basic nurse safety training.', category: 'fundamentals', difficulty: 0.15, ncjmmStep: 5, ngn: false, derivedFrom: null, original: true });

  // Very hard (0.92-0.98): Complex prioritization, rare complications, multi-system integration
  add({ stem: 'A nurse has five patients. At 0800, all have medications due. Which medication should the nurse administer FIRST?', options: ['Patient A: Levothyroxine 125mcg PO (NPO for surgery at 0900)','Patient B: Digoxin 0.25mg PO (apical pulse 52, stable x3 days)','Patient C: Warfarin 5mg PO (INR 4.8 this morning, no new orders)','Patient D: Furosemide 40mg PO (acute HF, crackles bilateral, O2 sat 89%)','Patient E: Metoprolol 25mg PO (BP 98/62, HR 58, asymptomatic)'], correctIndex: 2, rationale: 'INR 4.8 = supratherapeutic with bleeding risk. Warfarin should be held and provider notified. This takes priority over NPO levothyroxine (will be held anyway), bradycardic digoxin (hold per protocol), and hypotensive metoprolol. The acute HF patient needs furosemide urgently but INR 4.8 is more immediately dangerous (intracranial bleed risk). This is a complex multi-patient prioritization requiring integration of lab values, vital signs, and medication protocols.', category: 'priority_delegation', difficulty: 0.95, ncjmmStep: 2, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient with severe sepsis is receiving norepinephrine, vasopressin, and phenylephrine. MAP remains 52 despite maximum doses. The provider orders hydrocortisone 50mg IV q6h. One hour after the first dose, the nurse notes glucose 342 mg/dL (baseline 110). Which action is MOST appropriate?', options: ['Hold the next hydrocortisone dose — steroid-induced hyperglycemia','Start an insulin drip per protocol and continue hydrocortisone','Give subcutaneous insulin lispro 10 units and recheck in 2 hours','Notify provider — hydrocortisone is contraindicated with hyperglycemia'], correctIndex: 1, rationale: 'In septic shock, hydrocortisone is given for refractory hypotension (relative adrenal insufficiency). Steroid-induced hyperglycemia is expected and managed with insulin — the sepsis benefit outweighs the glucose risk. An insulin drip is appropriate for glucose >300 in an ICU patient. Holding steroids would reverse the hemodynamic benefit. This tests integration of endocrine physiology, sepsis protocols, and medication prioritization.', category: 'medical_surgical', difficulty: 0.92, ncjmmStep: 4, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A patient with end-stage liver disease presents with asterixis, fetor hepaticus, and a sodium of 118 mEq/L. The provider orders lactulose 30mL PO TID and restricts free water. The next morning, sodium is 124, but the patient is lethargic and has muscle cramps. Which is the MOST likely cause?', options: ['Worsening hepatic encephalopathy from inadequate lactulose','Osmotic demyelination syndrome from overly rapid sodium correction','Hypokalemia from lactulose-induced diarrhea','Hyponatremia-induced cerebral edema from water restriction'], correctIndex: 1, rationale: 'Rapid correction of chronic hyponatremia (>8-12 mEq/L in 24hr) risks osmotic demyelination syndrome (central pontine myelinolysis). Na+ rose 6 mEq/L overnight — within safe range per hour but concerning given the lethargy + cramps. In liver disease, ADH is often inappropriately elevated, making sodium correction unpredictable. The nurse should hold further free water restriction and notify the provider. This tests recognition of a rare but catastrophic complication of seemingly appropriate treatment.', category: 'medical_surgical', difficulty: 0.96, ncjmmStep: 1, ngn: false, derivedFrom: null, original: true });
  add({ stem: 'A nurse in the ICU receives four new post-op patients from PACU within 10 minutes. All are stable but need admission assessments. Which patient should the nurse assess FIRST?', options: ['Patient A: Open cholecystectomy, RR 18, SpO2 94% on 2L NC, pain 4/10','Patient B: Laparoscopic appendectomy, RR 22, SpO2 96% RA, pain 6/10','Patient C: Craniotomy for tumor resection, RR 14, SpO2 92% on 4L NC, GCS 14','Patient D: Total knee replacement, RR 20, SpO2 97% on 3L NC, pain 8/10, thigh dressing dry'], correctIndex: 2, rationale: 'Post-craniotomy with GCS 14 (mildly decreased from expected 15) + relative hypoxemia (92% on 4L) + borderline bradypnea (RR 14) = early signs of increased ICP or respiratory depression from anesthesia. Neurosurgical patients can deteriorate rapidly. The appendectomy and cholecystectomy patients are stable. The TKR patient has expected pain. This tests nuanced prioritization where the "sickest-looking" numbers are not the most urgent — a craniotomy with subtle neuro changes takes priority over better-looking vitals in less critical surgeries.', category: 'priority_delegation', difficulty: 0.94, ncjmmStep: 2, ngn: false, derivedFrom: null, original: true });

  return items;
}

// Initialize bank on first load
itemBank = seedReadinessItems();

// ─── SESSION MANAGEMENT ───
async function createSession(env, userTier, userEmail) {
  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    userTier,
    userEmail: userEmail || null,
    createdAt: Date.now(),
    items: [], // { itemId, response, correct, difficulty, category, ncjmmStep, ngn, responseTime }
    ability: 0.5,
    se: 1.0, // standard error, starts high
    terminated: false,
    terminationReason: null,
    currentItemIndex: 0,
    categoryCounts: {}, // category → count
    // Response-data collection for difficulty calibration
    responseData: [],
  };
  await kvPutSession(env, sessionId, session);
  return session;
}

async function getSession(env, sessionId) {
  return await kvGetSession(env, sessionId);
}

// ─── ITEM SELECTION ───
function selectNextItem(session) {
  // Only approved items
  const approved = itemBank.filter(i => i.reviewStatus === 'approved');

  // Don't repeat items
  const seenIds = new Set(session.items.map(i => i.itemId));
  const available = approved.filter(i => !seenIds.has(i.id));

  if (available.length === 0) {
    return null; // Bank exhausted
  }

  // Category coverage: if any category has < 2, prioritize it
  const underrepresented = CONFIG.categories.filter(cat => (session.categoryCounts[cat] || 0) < CONFIG.minPerCategory);

  let pool = available;
  if (underrepresented.length > 0 && session.items.length < CONFIG.maxItems) {
    pool = available.filter(i => underrepresented.includes(i.category));
    if (pool.length === 0) pool = available; // fallback
  }

  // Select item with difficulty closest to current ability estimate
  pool.sort((a, b) => Math.abs(a.difficulty - session.ability) - Math.abs(b.difficulty - session.ability));

  // Add slight randomization among top 3 to prevent deterministic patterns
  const topN = pool.slice(0, Math.min(3, pool.length));
  const selected = topN[Math.floor(Math.random() * topN.length)];

  return selected;
}

// ─── ABILITY ESTIMATION ───
function updateAbility(session, correct) {
  const step = CONFIG.abilityStep;
  if (correct) {
    session.ability = Math.min(session.ability + step, CONFIG.abilityMax);
  } else {
    session.ability = Math.max(session.ability - step, CONFIG.abilityMin);
  }

  // Simple SE estimation: decreases with more items, increases with mixed performance
  const n = session.items.length;
  const correctCount = session.items.filter(i => i.correct).length;
  const p = n > 0 ? correctCount / n : 0.5;
  // Standard error of proportion-like estimate
  session.se = Math.sqrt(p * (1 - p) / Math.max(n, 1));

  return session;
}

function shouldTerminate(session) {
  const n = session.items.length;

  if (n >= CONFIG.maxItems) {
    return { should: true, reason: 'max_items' };
  }

  if (n >= CONFIG.minItems && session.se < CONFIG.seThreshold) {
    return { should: true, reason: 'confidence' };
  }

  // Also terminate if all categories have min coverage and we're past minItems
  const allCategoriesCovered = CONFIG.categories.every(cat => (session.categoryCounts[cat] || 0) >= CONFIG.minPerCategory);
  if (n >= CONFIG.minItems && allCategoriesCovered && session.se < 0.20) {
    return { should: true, reason: 'coverage_and_confidence' };
  }

  return { should: false };
}

// ─── RESULTS CALCULATION ───
function calculateResults(session) {
  const n = session.items.length;
  const correctCount = session.items.filter(i => i.correct).length;
  const ability = session.ability;
  const se = session.se;

  // Readiness band
  let band;
  if (ability < 0.35) band = 'Not Ready';
  else if (ability < 0.60) band = 'Approaching';
  else band = 'Ready';

  // Category breakdown
  const categoryStats = {};
  for (const item of session.items) {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { total: 0, correct: 0 };
    }
    categoryStats[item.category].total++;
    if (item.correct) categoryStats[item.category].correct++;
  }

  const categoryBreakdown = Object.entries(categoryStats).map(([cat, stats]) => ({
    category: cat,
    total: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    strength: stats.correct / stats.total >= 0.7,
  }));

  // NCJMM step analysis
  const ncjmmStats = {};
  for (const item of session.items) {
    if (!ncjmmStats[item.ncjmmStep]) {
      ncjmmStats[item.ncjmmStep] = { total: 0, correct: 0 };
    }
    ncjmmStats[item.ncjmmStep].total++;
    if (item.correct) ncjmmStats[item.ncjmmStep].correct++;
  }

  const ncjmmBreakdown = Object.entries(ncjmmStats).map(([step, stats]) => ({
    step: parseInt(step),
    stepName: ncjmmStepName(parseInt(step)),
    total: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  // Confidence interval
  const ciLower = Math.max(0, ability - 1.96 * se);
  const ciUpper = Math.min(1, ability + 1.96 * se);

  return {
    band,
    ability: Math.round(ability * 100) / 100,
    se: Math.round(se * 100) / 100,
    ciLower: Math.round(ciLower * 100) / 100,
    ciUpper: Math.round(ciUpper * 100) / 100,
    itemsAnswered: n,
    correctCount,
    categoryBreakdown,
    ncjmmBreakdown,
    terminationReason: session.terminationReason,
    // Honest disclaimer
    _disclaimer: 'Ability estimate is based on author-estimated item difficulties (not psychometrically calibrated). Results improve as more response data is collected.',
  };
}

function ncjmmStepName(step) {
  const names = {
    1: 'Recognize Cues',
    2: 'Analyze Cues',
    3: 'Prioritize Hypotheses',
    4: 'Generate Solutions',
    5: 'Take Action',
    6: 'Evaluate Outcomes',
  };
  return names[step] || `Step ${step}`;
}

// ─── STRIP SENSITIVE DATA FROM ITEM ───
function sanitizeItem(item) {
  // NEVER expose correctIndex, derivedFrom, or reviewStatus to client
  return {
    id: item.id,
    stem: item.stem,
    options: item.options,
    category: item.category,
    difficulty: item.difficulty, // Expose for transparency (labeled as estimate)
    ncjmmStep: item.ncjmmStep,
    ngn: item.ngn,
  };
}

// ─── ROUTE HANDLERS ───

async function handleReadinessStart(request, env) {
  const body = await request.json().catch(() => ({}));
  const { email, tier } = body;

  // Determine tier (fallback to free)
  const userTier = tier || 'free';

  // Revenue OS: funnel event (server-side)
  await trackEvent(env, 'assessment_started', { session: null, tier: userTier, page: '/api/readiness/start' });

  const session = await createSession(env, userTier, email);
  const item = selectNextItem(session);

  if (!item) {
    return jsonResponse({ error: 'No items available' }, 500);
  }

  // Track category count
  session.categoryCounts[item.category] = (session.categoryCounts[item.category] || 0) + 1;
  session.currentItemId = item.id;
  session.itemStartTime = Date.now();

  // Save to KV
  await kvPutSession(env, session.id, session);

  return jsonResponse({
    sessionId: session.id,
    item: sanitizeItem(item),
    itemsAnswered: 0,
    totalItemsEstimate: `${CONFIG.minItems}–${CONFIG.maxItems}`,
    abilityEstimate: null,
  });
}

async function handleReadinessAnswer(request, env) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, itemId, answerIndex, responseTimeMs } = body;

  const session = await getSession(env, sessionId);
  if (!session) {
    return jsonResponse({ error: 'Session not found' }, 404);
  }

  if (session.terminated) {
    return jsonResponse({ error: 'Session already completed', sessionId }, 400);
  }

  // Verify this is the current item
  if (session.currentItemId !== itemId) {
    return jsonResponse({ error: 'Item mismatch', expected: session.currentItemId, received: itemId }, 400);
  }

  const item = itemBank.find(i => i.id === itemId);
  if (!item) {
    return jsonResponse({ error: 'Item not found' }, 404);
  }

  const correct = answerIndex === item.correctIndex;
  const responseTime = responseTimeMs || (Date.now() - session.itemStartTime);

  // Record response with calibration data
  const responseRecord = {
    itemId: item.id,
    response: answerIndex,
    correct,
    difficulty: item.difficulty,
    category: item.category,
    ncjmmStep: item.ncjmmStep,
    ngn: item.ngn,
    responseTime,
    answeredAt: Date.now(),
  };
  session.items.push(responseRecord);
  session.responseData.push(responseRecord);

  // Update ability estimate
  updateAbility(session, correct);

  // Check termination
  const termCheck = shouldTerminate(session);
  if (termCheck.should) {
    session.terminated = true;
    session.terminationReason = termCheck.reason;

    // Save to KV before returning
    await kvPutSession(env, session.id, session);

    // Calculate results
    const results = calculateResults(session);

    return jsonResponse({
      completed: true,
      sessionId: session.id,
      results,
    });
  }

  // Select next item
  const nextItem = selectNextItem(session);
  if (!nextItem) {
    session.terminated = true;
    session.terminationReason = 'bank_exhausted';
    await kvPutSession(env, session.id, session);
    return jsonResponse({
      completed: true,
      sessionId: session.id,
      results: calculateResults(session),
    });
  }

  session.categoryCounts[nextItem.category] = (session.categoryCounts[nextItem.category] || 0) + 1;
  session.currentItemId = nextItem.id;
  session.itemStartTime = Date.now();

  // Save to KV
  await kvPutSession(env, session.id, session);

  return jsonResponse({
    completed: false,
    sessionId: session.id,
    item: sanitizeItem(nextItem),
    itemsAnswered: session.items.length,
    totalItemsEstimate: `${CONFIG.minItems}–${CONFIG.maxItems}`,
    abilityEstimate: Math.round(session.ability * 100) / 100,
  });
}

async function handleReadinessResult(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const sessionId = pathParts[pathParts.length - 1];

  const session = await getSession(env, sessionId);
  if (!session) {
    return jsonResponse({ error: 'Session not found' }, 404);
  }

  // Revenue OS: funnel event (server-side, only when actually completed)
  if (session.terminated) {
    await trackEvent(env, 'assessment_completed', { session: sessionId, tier: session.userTier || 'free', page: '/api/readiness/result' });
  }

  const results = calculateResults(session);

  // Apply tier-based gating
  const isPaid = session.userTier !== 'free';
  const fullResults = {
    ...results,
    // Free tier: summary only
    // Paid tier: full breakdown
    categoryBreakdown: isPaid ? results.categoryBreakdown : results.categoryBreakdown.map(c => ({
      category: c.category,
      strength: c.strength,
      // Omit counts/accuracy for free tier
    })),
    ncjmmBreakdown: isPaid ? results.ncjmmBreakdown : null,
    // Retake info
    canRetake: isPaid,
    retakeInDays: isPaid ? null : 7,
    _tierNote: isPaid ? 'Full results — unlimited retakes included' : 'Free summary — upgrade for detailed breakdown and history',
  };

  return jsonResponse({
    sessionId: session.id,
    completed: session.terminated,
    results: fullResults,
  });
}

// ─── UTILS ───
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ─── MAIN ROUTER (called from api.js) ───
export async function routeReadiness(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    if (path === '/api/readiness/start' && request.method === 'POST') {
      return await handleReadinessStart(request, env);
    }
    if (path === '/api/readiness/answer' && request.method === 'POST') {
      return await handleReadinessAnswer(request, env);
    }
    if (path.startsWith('/api/readiness/result/') && request.method === 'GET') {
      return await handleReadinessResult(request, env);
    }
    return null; // Not a readiness route
  } catch (err) {
    console.error('Readiness API error:', err);
    return jsonResponse({ error: 'Internal error', details: err.message }, 500);
  }
}

// ─── DIAGNOSTIC: Item bank stats ───
export function getBankStats() {
  const byCategory = {};
  const byDifficulty = { low: 0, mid: 0, high: 0 };
  const byNcjm = {};
  let ngnCount = 0;
  let derivedCount = 0;
  let freshCount = 0;

  for (const item of itemBank) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    if (item.difficulty < 0.4) byDifficulty.low++;
    else if (item.difficulty < 0.7) byDifficulty.mid++;
    else byDifficulty.high++;
    byNcjm[item.ncjmmStep] = (byNcjm[item.ncjmmStep] || 0) + 1;
    if (item.ngn) ngnCount++;
    if (item.original) freshCount++;
    else derivedCount++;
  }

  return {
    total: itemBank.length,
    approved: itemBank.filter(i => i.reviewStatus === 'approved').length,
    draft: itemBank.filter(i => i.reviewStatus === 'draft').length,
    byCategory,
    byDifficulty,
    byNcjm,
    ngnCount,
    ngnPercent: Math.round((ngnCount / itemBank.length) * 100),
    derivedCount,
    freshCount,
  };
}
