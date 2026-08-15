# Readiness Assessment Item Bank Report

**Generated:** 2026-08-15  
**Source:** `workers-site/api-readiness.js` (`seedReadinessItems()`)  
**Bank size:** 68 items (code comment claims 60 — discrepancy noted)  
**reviewStatus:** All items set to `approved` (no draft items currently in bank)

---

## 1. Derivation / Fresh Split

| Type | Count | % |
|------|-------|---|
| Derived | 26 | 38.2% |
| Fresh (original) | 42 | 61.8% |
| **Total** | **68** | **100%** |

---

## 2. Derivation/Fresh Split by Category

| Category | Total | Derived | Fresh | % Derived |
|----------|-------|---------|-------|-----------|
| fundamentals | 11 | 5 | 6 | 45.5% |
| pharmacology | 9 | 4 | 5 | 44.4% |
| medical_surgical | 11 | 4 | 7 | 36.4% |
| pediatrics | 7 | 4 | 3 | 57.1% |
| maternity | 7 | 4 | 3 | 57.1% |
| mental_health | 7 | 3 | 4 | 42.9% |
| priority_delegation | 9 | 0 | 9 | 0% |
| infection_control | 7 | 2 | 5 | 28.6% |

---

## 3. Difficulty Histogram (all 68 items)

```
0.1: █████ (5)      ▓▓▓▓▓
0.2: ██ (2)         ▓▓
0.3: █████████ (9)  ▓▓▓▓▓▓▓▓▓
0.4: ████ (4)       ▓▓▓▓
0.5: ██████████ (10) ▓▓▓▓▓▓▓▓▓▓
0.6: █████ (5)      ▓▓▓▓▓
0.7: ███████████ (11) ▓▓▓▓▓▓▓▓▓▓▓
0.8: ████████████████ (16) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
0.9: ██████ (6)     ▓▓▓▓▓▓
1.0: (0)            
```

**Range:** 0.10 – 0.96  
**Mean:** ~0.58  
**Median:** ~0.65

### Clumping Analysis

**CRITICAL:** The bank clumps heavily at **0.7–0.8** (27 items = 39.7% of the bank). This is worse than the previously noted 0.4–0.6 clumping.

| Bin | Count | % of Bank |
|-----|-------|-----------|
| 0.1–0.2 | 7 | 10.3% |
| 0.3–0.4 | 13 | 19.1% |
| 0.5–0.6 | 15 | 22.1% |
| **0.7–0.8** | **27** | **39.7%** |
| 0.9–1.0 | 6 | 8.8% |

**Ceiling gap:** No items at difficulty 1.0. The hardest item is 0.96 (osmotic demyelination syndrome).  
**Floor:** Well covered with 5 items at 0.1 and 2 at 0.15.

### Recommended Fresh Items to Fix Distribution

To flatten the histogram, author **8–10 new fresh items** targeting these gaps:

| Target Difficulty | Count Needed | Category Suggestions |
|-------------------|--------------|---------------------|
| 0.20–0.25 | 3 | infection_control, fundamentals, mental_health |
| 0.90–0.95 | 3 | medical_surgical, pharmacology, pediatrics |
| 0.98–1.00 | 2 | priority_delegation, medical_surgical |
| 0.35–0.45 | 2 | maternity, pediatrics |

Specific item ideas:
1. **0.20** — Infection control: "A nurse is removing PPE after caring for a patient on contact precautions. What is the correct sequence?" (gloves → gown → hand hygiene — basic but critical)
2. **0.22** — Fundamentals: "A patient asks for a glass of water. The nurse checks the chart and sees NPO status. What is the appropriate response?"
3. **0.25** — Mental health: "A patient with depression says 'I don't see the point in anything.' What is the nurse's first priority assessment?" (suicide risk)
4. **0.92** — Medical-surgical: "A patient with TBI has CPP 55 mmHg, ICP 18 mmHg, MAP 73. After mannitol and hyperventilation, ICP drops to 12 but CPP falls to 48. What is the priority intervention?" (raise MAP/CPP, cerebral perfusion trumps ICP)
5. **0.95** — Pharmacology: "A patient on chronic prednisone presents with hypotension, hyperkalemia, and hyponatremia. Cortisol is undetectable. ACTH is elevated. The provider orders hydrocortisone 100mg IV. One hour later, the patient develops ventricular tachycardia. What is the most likely cause?" (mineralocorticoid deficiency + rapid correction → arrhythmia from electrolyte shifts)
6. **0.98** — Priority/delegation: "A charge nurse has 6 patients, 2 call-offs, and a new admission arriving in 10 minutes. Four patients have PRN pain meds due. Which action demonstrates the BEST use of nursing resources while maintaining safety?" (complex staffing + acuity + delegation)
7. **1.00** — Medical-surgical: "A burn patient with 40% TBSA has received 4L of lactated Ringer's in 8 hours per Parkland formula. Urine output is 15mL/hr. BP 88/50, HR 132, lactate 4.2. The provider orders albumin 25g IV and dopamine infusion. The nurse should question which order and why?" (albumin in burn resuscitation is controversial; dopamine is second-line after norepinephrine)

---

## 4. Full 68-Item Inventory

| # | Category | Difficulty | NCJMM Step | NGN | Source |
|---|----------|-----------|------------|-----|--------|
| 1 | fundamentals | 0.35 | 1 | No | derived:quiz-lab-values-q3 |
| 2 | fundamentals | 0.30 | 1 | No | derived:case-fundamentals-handoff |
| 3 | fundamentals | 0.40 | 3 | No | derived:quiz-pharm-q12 |
| 4 | fundamentals | 0.30 | 5 | No | derived:guide-bls-aha-2025 |
| 5 | fundamentals | 0.55 | 1 | No | derived:quiz-delegation-q5 |
| 6 | fundamentals | 0.75 | 1 | No | original |
| 7 | fundamentals | 0.80 | 2 | **Yes** | original |
| 8 | fundamentals | 0.85 | 3 | No | original |
| 9 | pharmacology | 0.50 | 4 | No | derived:quiz-pharm-q8 |
| 10 | pharmacology | 0.35 | 4 | No | derived:quiz-pharm-q2 |
| 11 | pharmacology | 0.30 | 4 | No | derived:quiz-pharm-q15 |
| 12 | pharmacology | 0.55 | 6 | No | derived:quiz-pharm-q22 |
| 13 | pharmacology | 0.75 | 4 | **Yes** | original |
| 14 | pharmacology | 0.70 | 6 | No | original |
| 15 | pharmacology | 0.65 | 5 | No | original |
| 16 | pharmacology | 0.85 | 1 | No | original |
| 17 | medical_surgical | 0.55 | 2 | No | derived:case-appendectomy-complications |
| 18 | medical_surgical | 0.70 | 1 | No | derived:guide-chest-tube-care |
| 19 | medical_surgical | 0.40 | 1 | No | derived:quiz-chf-monitoring |
| 20 | medical_surgical | 0.50 | 6 | No | derived:guide-ostomy-care |
| 21 | medical_surgical | 0.75 | 2 | No | original |
| 22 | medical_surgical | 0.88 | 4 | No | original |
| 23 | medical_surgical | 0.90 | 5 | No | original |
| 24 | medical_surgical | 0.80 | 6 | **Yes** | original |
| 25 | pediatrics | 0.55 | 5 | No | derived:guide-pediatric-respiratory |
| 26 | pediatrics | 0.85 | 4 | No | derived:case-pediatric-gi |
| 27 | pediatrics | 0.50 | 3 | No | derived:quiz-oncology-peds |
| 28 | pediatrics | 0.45 | 4 | No | derived:guide-newborn-jaundice |
| 29 | pediatrics | 0.85 | 2 | No | original |
| 30 | pediatrics | 0.80 | 3 | No | original |
| 31 | pediatrics | 0.85 | 5 | **Yes** | original |
| 32 | maternity | 0.60 | 5 | No | derived:case-ob-preeclampsia |
| 33 | maternity | 0.40 | 6 | No | derived:guide-postpartum-assessment |
| 34 | maternity | 0.30 | 5 | No | derived:guide-apgar-scoring |
| 35 | maternity | 0.50 | 4 | No | derived:quiz-ob-fetal-movement |
| 36 | maternity | 0.88 | 1 | No | original |
| 37 | maternity | 0.90 | 5 | No | original |
| 38 | maternity | 0.65 | 3 | No | original |
| 39 | mental_health | 0.30 | 6 | No | derived:quiz-mental-health-therapeutic |
| 40 | mental_health | 0.55 | 4 | No | derived:case-bipolar-manic |
| 41 | mental_health | 0.25 | 6 | No | derived:guide-mental-health-rights |
| 42 | mental_health | 0.75 | 6 | No | original |
| 43 | mental_health | 0.80 | 4 | No | original |
| 44 | mental_health | 0.85 | 1 | No | original |
| 45 | priority_delegation | 0.70 | 2 | No | original |
| 46 | priority_delegation | 0.55 | 3 | No | original |
| 47 | priority_delegation | 0.65 | 3 | **Yes** | original |
| 48 | priority_delegation | 0.75 | 2 | No | original |
| 49 | priority_delegation | 0.25 | 5 | No | original |
| 50 | priority_delegation | 0.60 | 3 | No | original |
| 51 | infection_control | 0.30 | 5 | No | derived:quiz-ic-precautions |
| 52 | infection_control | 0.35 | 5 | No | derived:guide-injection-technique |
| 53 | infection_control | 0.85 | 5 | No | original |
| 54 | infection_control | 0.70 | 5 | **Yes** | original |
| 55 | fundamentals | 0.15 | 6 | **Yes** | original |
| 56 | pharmacology | 0.78 | 4 | **Yes** | original |
| 57 | medical_surgical | 0.82 | 5 | **Yes** | original |
| 58 | priority_delegation | 0.88 | 3 | **Yes** | original |
| 59 | infection_control | 0.72 | 4 | **Yes** | original |
| 60 | mental_health | 0.80 | 4 | **Yes** | original |
| 61 | infection_control | 0.10 | 5 | No | original |
| 62 | fundamentals | 0.15 | 1 | No | original |
| 63 | infection_control | 0.10 | 5 | No | original |
| 64 | fundamentals | 0.15 | 5 | No | original |
| 65 | priority_delegation | 0.95 | 2 | No | original |
| 66 | medical_surgical | 0.92 | 4 | No | original |
| 67 | medical_surgical | 0.96 | 1 | No | original |
| 68 | priority_delegation | 0.94 | 2 | No | original |

---

## 5. NGN Coverage

| Category | NGN Items | Total | % NGN |
|----------|-----------|-------|-------|
| fundamentals | 2 | 11 | 18.2% |
| pharmacology | 2 | 9 | 22.2% |
| medical_surgical | 2 | 11 | 18.2% |
| pediatrics | 1 | 7 | 14.3% |
| maternity | 0 | 7 | 0% |
| mental_health | 1 | 7 | 14.3% |
| priority_delegation | 2 | 9 | 22.2% |
| infection_control | 2 | 7 | 28.6% |
| **Total** | **12** | **68** | **17.6%** |

Target is 20%. Maternity has zero NGN items — add at least one SATA-style maternity item.

---

## 6. reviewStatus Count

| Status | Count |
|--------|-------|
| approved | 68 |
| draft | 0 |

All items are approved. To test the draft fence, temporarily set one item to `reviewStatus: 'draft'`.

---

## 7. Summary & Action Items

1. **Bank size mismatch:** Code claims 60 items; actual count is 68. Update comment or trim to 60.
2. **Difficulty clumping:** 39.7% of items are at 0.7–0.8. Need 8–10 fresh items at 0.2–0.25 and 0.9–1.0 to flatten.
3. **NGN gap:** Maternity has 0 NGN items. Add 1–2 SATA-style maternity items.
4. **No draft items:** All 68 are `approved`. The draft fence is in place but untested with real draft data.
