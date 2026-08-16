# Obioma Care — Media Style Guide

## Visual Identity for Medical Illustrations

### Style
- **Flat medical illustration** — diagram clarity over photorealism
- **Vector-like aesthetic** — clean shapes, no gradients on anatomy
- **Consistent perspective** — anterior/frontal for body systems unless oblique adds clarity
- **Label style** — leader lines in `--text-secondary` (#94A3B8), labels in `--text-primary` (#E2E8F0), 14px

### Color Palette (from design-tokens/tokens.css)
| Role | Hex | Usage |
|------|-----|-------|
| Background | #0f172a | Dark navy canvas |
| Primary accent | #FF6B5B | Highlights, callouts, arterial blood |
| Secondary accent | #0ea5e9 | Venous blood, fluid pathways |
| Tertiary accent | #22c55e | Normal/healthy indicators |
| Caution | #f59e0b | Warning zones, borderline values |
| Text primary | #E2E8F0 | Labels, body copy |
| Text secondary | #94A3B8 | Leader lines, captions |
| Structure | #475569 | Bones, connective tissue |

### Anatomy-Specific Conventions
- **Cardiovascular**: Arteries in coral (#FF6B5B), veins in blue (#0ea5e9), heart chambers labeled
- **Respiratory**: Airways in coral, alveoli clusters as dot patterns, diaphragm as curved line
- **Neuro**: Brain lobes color-coded, cranial nerves numbered, spinal cord as segmented column
- **Renal**: Nephron as flow diagram, filtration/ reabsorption/ secretion arrows, fluid balance visual
- **GI**: Tract as simplified tube, liver/pancreas as adjacent organs, absorption zones marked

### Technical Specs
- **Format**: WebP (lossy, quality 85)
- **Max width**: 1200px for content, 800px for thumbnails
- **Aspect ratio**: 16:9 for hero/diagrams, 3:2 for thumbnails
- **Lazy loading**: `loading="lazy"` for below-fold images
- **Alt text**: Required — anatomical description + context (e.g., "Diagram of the nephron showing filtration, reabsorption, and secretion pathways")

### Review Gate
Every anatomical diagram must be reviewed for accuracy before publish.
`reviewStatus`: pending → reviewed → published
