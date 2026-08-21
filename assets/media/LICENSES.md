# Asset License Ledger

All media assets generated for Obioma Care. AI-generated medical diagrams require anatomical accuracy review before publication.

## Format

| filename | generated | tool | prompt summary | license | reviewStatus | reviewer | reviewedAt | usage |
|----------|-----------|------|----------------|---------|--------------|----------|------------|-------|

## Legend
- **reviewStatus**: `pending` | `reviewed` | `rejected` | `published`
- **license**: `ai-generated-obioma` — created via agent image generation for exclusive Obioma Care use
- **No asset may be published with reviewStatus != `reviewed`**
- **reviewer and reviewedAt MUST be filled by a named human on review** — pipeline never sets these fields

## Standing Rules

1. **AI generators fail on TEXT, not drawings.** Every label on every asset gets human proofreading before review flips to `reviewed`.
2. **Each label appears exactly once.** Duplicate labels are treated as errors.
3. **Anatomical spelling must be correct.** "Larynx" not "Lannyx", "bronchi" not "bronchis".
4. **Cranial nerves are numbered I–XII in Roman numerals.** No garbled text ("WII"), no duplicates, no omissions.
5. **Color conventions must match oxygenation status:** oxygenated blood = coral red, deoxygenated = blue.
6. **Versioned key convention (ratified 2026-08-18):** superseded assets get new `-v2`/`-v3`
   keys instead of same-key replacement — immutable cache headers make same-key refresh
   impossible without zone-level cache purge. Old keys are deleted from R2. The ledger
   and every embed MUST reference the current key; never re-use a superseded name.

---

## Blockout Pass — 5 Core System Diagrams

| filename | generated | tool | prompt summary | license | reviewStatus | reviewer | reviewedAt | usage |
|----------|-----------|------|----------------|---------|--------------|----------|------------|-------|
| cardiovascular-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human cardiovascular system: heart with four labeled chambers (Right Atrium, Right Ventricle, Left Atrium, Left Ventricle — each labeled once only), major arteries in coral red (#FF6B5B) for oxygenated blood, major veins in blue (#0ea5e9) for deoxygenated blood, pulmonary artery in blue (deoxygenated to lungs), pulmonary veins in coral (oxygenated from lungs), aorta labeled "Aorta", superior vena cava labeled "Superior Vena Cava", dark navy (#0f172a) background, clean vector-like style, white leader line labels | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-16 | nclex-cardiac-disorders |
| respiratory-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human respiratory system: nasal cavity, pharynx, larynx (correct spelling), trachea, main bronchi (left and right — correct spelling), bronchioles, alveoli, diaphragm, gas exchange arrows O2 coral in / CO2 blue out, dark navy background, clean labels. NOTE: double "Main bronchi" is intentional (left + right main bronchus). | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-16 | nclex-copd-asthma-deep-dive |
| neuro-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human nervous system: brain lateral view with labeled lobes (frontal, parietal, temporal, occipital), brainstem (midbrain, pons, medulla), cerebellum, spinal cord segments (cervical, thoracic, lumbar, sacral). No cranial nerve inset. Non-blocking: left half is dead space — crop/rebalance in future pass. | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-16 | nclex-neurological-disorders |
| renal-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human renal system: kidney cross-section + nephron inset. v4 regenerated with EXPLICIT LABEL LIST enumerated in prompt: Cortex, Medulla, Renal pelvis, Ureter, Glomerulus, Proximal convoluted tubule, Loop of Henle, Distal convoluted tubule, Collecting duct — each exactly once. APPROVED v4: all labels correct, no duplicates. | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-16 | nclex-dialysis-renal-replacement |
| gi-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human GI system: tract from mouth to anus, esophagus, stomach, small intestine segments, large intestine segments, liver, gallbladder, pancreas. NOTE: absorption icons arbitrarily placed ("Fat" on transverse colon is wrong). Follow-up: anchor icons to small intestine or remove next pass. | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-16 | nclex-gi-disorders |

## Tranche 2 — 5 Additional System Diagrams

| filename | generated | tool | prompt summary | license | reviewStatus | reviewer | reviewedAt | usage |
|----------|-----------|------|----------------|---------|--------------|----------|------------|-------|
| musculoskeletal-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human musculoskeletal system: full body skeleton anterior view (skull, vertebral column, rib cage, pelvis, upper/lower extremities), major joints labeled (shoulder, elbow, wrist, hip, knee, ankle), skeletal muscles overlaid on key groups (deltoid, biceps, quadriceps, hamstrings, gastrocnemius), dark navy background, clean white labels, each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-18 | nclex-musculoskeletal-disorders-deep-dive |
| integumentary-system-diagram-v2.webp | 2026-08-18 | kimi-k3 image generation | v2: skin layers cross-section — stratum corneum, stratum basale, dermis, hair follicle, sebaceous gland, sweat gland, blood vessels, nerve endings, hypodermis, fat cell, hair shaft, arrector pili, Meissner corpuscle, Pacinian corpuscle, fingernail — each label exactly once; fat-cell labels merged to one; stratum corneum leader at OUTERMOST layer, stratum basale at DEEPEST epidermis. Owner clinical pre-screen 2026-08-18: all 15 labels correct. | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-18 | nclex-burns-integumentary-disorders | — | — | nclex-burns-integumentary-disorders |
| wound-healing-stages-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of wound healing stages in 4 horizontal panels: Hemostasis (platelets, fibrin mesh), Inflammatory (neutrophils, macrophages), Proliferative (angiogenesis, collagen deposition), Maturation (collagen reorganization, scar tissue), with time markers (0-1 days, 1-6 days, 4-21 days, 21 days-2 years), dark navy background, clean white labels | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-18 | nclex-burns-wound-care-deep-dive |
| hematopoiesis-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of hematopoiesis: pluripotent stem cell branching to myeloid (RBCs, platelets, neutrophils, eosinophils, basophils, monocytes) and lymphoid (B cells, T cells, NK cells) lineages, bone marrow inset, dark navy background, clean white labels, each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-18 | nclex-hematology-disorders |
| eye-anatomy-diagram-v2.webp | 2026-08-18 | kimi-k3 image generation | v2: eye cross-section — cornea, pupil, iris, lens, anterior chamber, ciliary body, vitreous humor, sclera, choroid, retina, fovea centralis, optic nerve — each label exactly once (enumerated-list pattern per renal v4). Owner clinical pre-screen 2026-08-18: all 12 labels correct, zero dupes; watermarked corner cropped. | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-18 | nclex-sensory-disorders | — | — | nclex-sensory-disorders |

---

*Last updated: 2026-08-18*

| endocrine-system-diagram-v1.webp | 2026-08-18 | kimi image generation | AI-generated (Kimi), enumerated-label prompt pattern — endocrine system cross-section: pituitary, thyroid, parathyroid, adrenal, pancreas, pineal, hypothalamus — each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-19 | nclex-endocrine-disorders |
| musculoskeletal-system-diagram-v1.webp | 2026-08-18 | kimi image generation | AI-generated (Kimi), enumerated-label prompt pattern — musculoskeletal system: skeleton, major muscle groups, joint types — each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-19 | nclex-musculoskeletal-disorders |
| hepatobiliary-pancreas-diagram-v2.webp | 2026-08-18 | kimi image generation | AI-generated (Kimi), enumerated-label prompt pattern — liver, gallbladder, pancreas anatomy with biliary tree — v2 canonical (v1 never entered pipeline) — each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-19 | nclex-liver-pancreas-disorders |
| immune-lymphatic-system-diagram-v1.webp | 2026-08-18 | kimi image generation | AI-generated (Kimi), enumerated-label prompt pattern — immune/lymphatic system: thymus, spleen, lymph nodes, tonsils, bone marrow, lymphatic vessels — each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-19 | nclex-immune-disorders |
| pediatric-congenital-cardiac-diagram-v3.webp | 2026-08-18 | kimi image generation | AI-generated (Kimi), enumerated-label prompt pattern — congenital cardiac defects: ASD, VSD, PDA, TOF, TGA — v3 canonical (v1/v2 rejected for shunt-arrow errors, never entered pipeline) — each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-19 | nclex-pediatric-cardiac-congenital |

| female-reproductive-system-diagram-v1.webp | 2026-08-18 | kimi image generation | AI-generated (Kimi), enumerated-label prompt pattern — female reproductive system cross-section: ovaries, fallopian tubes, uterus, cervix, vagina, endometrium, myometrium — each label exactly once | ai-generated-obioma | reviewed | Nnamdi Okorafor, RN | 2026-08-19 | nclex-reproductive-health-basics |
| OER batch fda-pharm2e-001 | FDA Prescribing Information · Digoxin · Furosemide · Lisinopril · Warfarin · Insulin lispro labels | Public domain (17 U.S.C. §105) | https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=digoxin + https://api.fda.gov/drug/label.json | 30 | Source: FDA drug labels (US government work, public domain) | reviewed | Nnamdi Okorafor, RN | 2026-08-21T07:56:21Z |
| OER batch fda-pharm2e-002 | FDA Prescribing Information · Metformin · Levothyroxine · Metoprolol · Atorvastatin · Albuterol · Heparin labels | Public domain (17 U.S.C. §105) | https://api.fda.gov/drug/label.json + https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name= | 36 | Source: FDA drug labels (US government work, public domain) | reviewed | Nnamdi Okorafor, RN | 2026-08-21T08:14:14Z |
| OER batch fda-pharm2e-003 | FDA Prescribing Information · Amoxicillin · Prednisone · Ondansetron · Clopidogrel · Morphine · Phenytoin labels | Public domain (17 U.S.C. §105) | https://api.fda.gov/drug/label.json + https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name= | 36 | Source: FDA drug labels (US government work, public domain) | reviewed | Nnamdi Okorafor, RN | 2026-08-21T08:40:01Z |
| OER batch fda-pharm2e-004 | FDA Prescribing Information · Amiodarone · Carbamazepine · Haloperidol · Enoxaparin · Nitroglycerin · Valproic acid labels | Public domain (17 U.S.C. §105) | https://api.fda.gov/drug/label.json + https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name= | 36 | Source: FDA drug labels (US government work, public domain) | reviewed | Nnamdi Okorafor, RN | 2026-08-21T08:22:08Z |
| OER batch fda-pharm2e-005 | FDA Prescribing Information · Spironolactone · Metronidazole · Ciprofloxacin · Diltiazem · Labetalol · Gabapentin labels | Public domain (17 U.S.C. §105) | https://api.fda.gov/drug/label.json + https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name= | 35 | Source: FDA drug labels (US government work, public domain) | pending |  |  |
| OER batch fda-pharm2e-006 | FDA Prescribing Information · Hydralazine · Vancomycin · Ceftriaxone · Clindamycin · Dexamethasone · Lorazepam labels | Public domain (17 U.S.C. §105) | https://api.fda.gov/drug/label.json + https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name= | 36 | Source: FDA drug labels (US government work, public domain) | reviewed | Nnamdi Okorafor, RN | 2026-08-21T10:05:04Z |
| OER batch fda-pharm2e-007 | FDA Prescribing Information · Losartan · Nifedipine · Verapamil · Fluoxetine · Tramadol · Pantoprazole labels | Public domain (17 U.S.C. §105) | https://api.fda.gov/drug/label.json + https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name= | 35 | Source: FDA drug labels (US government work, public domain) | pending |  |  |
