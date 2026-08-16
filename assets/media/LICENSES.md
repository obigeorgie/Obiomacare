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

---

## Blockout Pass — 5 Core System Diagrams

| filename | generated | tool | prompt summary | license | reviewStatus | reviewer | reviewedAt | usage |
|----------|-----------|------|----------------|---------|--------------|----------|------------|-------|
| cardiovascular-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human cardiovascular system: heart with four labeled chambers (Right Atrium, Right Ventricle, Left Atrium, Left Ventricle — each labeled once only), major arteries in coral red (#FF6B5B) for oxygenated blood, major veins in blue (#0ea5e9) for deoxygenated blood, pulmonary artery in blue (deoxygenated to lungs), pulmonary veins in coral (oxygenated from lungs), aorta labeled "Aorta" (not "Body"), superior vena cava labeled "Superior Vena Cava" (not "Vena Cavae"), dark navy (#0f172a) background, clean vector-like style, white leader line labels, no duplicate labels | ai-generated-obioma | pending | — | — | nclex-cardiac-disorders |
| respiratory-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human respiratory system: nasal cavity, pharynx, larynx (spelled correctly), trachea, bronchi, bronchioles, alveoli as dot clusters, diaphragm as curved muscle line, gas exchange arrows O2 coral in / CO2 blue out, dark navy background, clean labels | ai-generated-obioma | pending | — | — | nclex-copd-asthma-deep-dive |
| neuro-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human nervous system: brain lateral view with labeled lobes (frontal, parietal, temporal, occipital), brainstem (midbrain, pons, medulla), cerebellum, spinal cord segments (cervical, thoracic, lumbar, sacral), cranial nerves I–XII numbered, dark navy background, clean labels | ai-generated-obioma | pending | — | — | nclex-neurological-disorders |
| renal-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human renal system: kidney cross-section (cortex, medulla, pelvis), magnified nephron inset with glomerulus filtration, proximal convoluted tubule, loop of Henle, distal convoluted tubule, collecting duct, reabsorption/secretion arrows, dark navy background, clean labels | ai-generated-obioma | pending | — | — | nclex-dialysis-renal-replacement |
| gi-system-diagram.webp | 2026-08-16 | gemini-3.1-flash-image-preview | Flat medical illustration of human GI system: tract from mouth to anus (esophagus, stomach, small intestine segments, large intestine segments), liver, gallbladder, pancreas, absorption zones marked, dark navy background, clean labels | ai-generated-obioma | pending | — | — | nclex-gi-disorders |

---

*Last updated: 2026-08-16*
