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

---

## Blockout Pass — 5 Core System Diagrams

| filename | generated | tool | prompt summary | license | reviewStatus | reviewer | reviewedAt | usage |
|----------|-----------|------|----------------|---------|--------------|----------|------------|-------|
| cardiovascular-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human cardiovascular system: heart with four labeled chambers (Right Atrium, Right Ventricle, Left Atrium, Left Ventricle — each labeled once only), major arteries in coral red (#FF6B5B) for oxygenated blood, major veins in blue (#0ea5e9) for deoxygenated blood, pulmonary artery in blue (deoxygenated to lungs), pulmonary veins in coral (oxygenated from lungs), aorta labeled "Aorta", superior vena cava labeled "Superior Vena Cava", dark navy (#0f172a) background, clean vector-like style, white leader line labels | ai-generated-obioma | reviewed | Kimi (Owner) | 2026-08-16 | nclex-cardiac-disorders |
| respiratory-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human respiratory system: nasal cavity, pharynx, larynx (correct spelling), trachea, main bronchi (left and right — correct spelling), bronchioles, alveoli, diaphragm, gas exchange arrows O2 coral in / CO2 blue out, dark navy background, clean labels. NOTE: double "Main bronchi" is intentional (left + right main bronchus). | ai-generated-obioma | reviewed | Kimi (Owner) | 2026-08-16 | nclex-copd-asthma-deep-dive |
| neuro-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human nervous system: brain lateral view with labeled lobes (frontal, parietal, temporal, occipital), brainstem (midbrain, pons, medulla), cerebellum, spinal cord segments (cervical, thoracic, lumbar, sacral). No cranial nerve inset. Non-blocking: left half is dead space — crop/rebalance in future pass. | ai-generated-obioma | reviewed | Kimi (Owner) | 2026-08-16 | nclex-neurological-disorders |
| renal-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human renal system: kidney cross-section (cortex, medulla, pelvis), magnified nephron inset with glomerulus, proximal convoluted tubule, loop of Henle, distal convoluted tubule, collecting duct. REJECTED v1+v2: "Renal pelvis" and "Proximal convoluted tubule" each labeled twice. v3 pending: each label EXACTLY ONCE — no duplicates anywhere. | ai-generated-obioma | rejected | Kimi (Owner) | 2026-08-16 | — |
| gi-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human GI system: tract from mouth to anus, esophagus, stomach, small intestine segments, large intestine segments, liver, gallbladder, pancreas. NOTE: absorption icons arbitrarily placed ("Fat" on transverse colon is wrong). Follow-up: anchor icons to small intestine or remove next pass. | ai-generated-obioma | reviewed | Kimi (Owner) | 2026-08-16 | nclex-gi-disorders |

---

*Last updated: 2026-08-16*
