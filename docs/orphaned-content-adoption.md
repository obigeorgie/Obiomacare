# Orphaned public/content Pages — Adoption List (2026-08-18)

23 pages exist in `public/content/` with NO source in `content/` (outside the build
pipeline). Recommendation per page: **ADOPT** (copy source into `content/` so the
pipeline owns it — media gate, injection, rebuilds all apply) or **RETIRE** (remove
from production + fix inbound links). No changes executed — awaiting line-item approval.

| # | Page | Inbound | Recommendation | Rationale |
|---|------|---------|----------------|-----------|
| 1 | `nclex-clinical-judgment-framework` | 19 | **ADOPT** | Flagship, heavily linked; no pipeline counterpart |
| 2 | `nclex-lab-values-cheat-sheet` | 8 | **ADOPT** | High inbound; distinct cheat-sheet format (complements `nclex-lab-values-memorization-guide`) |
| 3 | `nclex-anxiety-management` | 6 | **ADOPT** | High inbound; unique topic in pipeline |
| 4 | `sata-questions-strategy` | 6 | **ADOPT** | Higher-inbound of the SATA pair; unique strategy content |
| 5 | `nclex-clinical-judgment-5-steps` | 5 | **ADOPT** | Distinct 5-step decoder format |
| 6 | `nclex-pharmacology-drug-classes` | 1 | **ADOPT** | Complementary pharm content (pipeline has only oncology-pharm) |
| 7 | `nclex-pharmacology-mnemonics` | 2 | **ADOPT** | Complementary pharm content |
| 8 | `pediatric-milestones-reference` | 1 | **ADOPT** | Quick-reference format (complements `nclex-pediatric-milestones`) |
| 9 | `nclex-case-study-sepsis-walkthrough` | 0 | **ADOPT** | Unique clinical-judgment walkthrough content |
| 10 | `ngn-case-studies-examples` | 1 | **ADOPT** | Unique NGN examples content |
| 11 | `what-is-next-generation-nclex` | 3 | **ADOPT** | Foundational NGN explainer |
| 12 | `nclex-delegation-assignment` | 1 | **ADOPT** | Better of the delegation pair (has inbound) |
| 13 | `30-day-nclex-study-plan` | 5 | **RETIRE** | **Pass-promise claims** ("pass on your first attempt", "100%") — violates rule #6 + conflicts with CAT readiness positioning. Link fixes → `/content/` hub |
| 14 | `nclex-30-day-study-plan` | 0 | **RETIRE** | "100%" claim + 30-day-pass framing conflicts with readiness positioning |
| 15 | `nclex-2-week-study-plan-complete` | 1 | **RETIRE** | No claim violation, but 2-week-pass framing conflicts with readiness positioning (owner may prefer ADOPT-with-reframe) |
| 16 | `nclex-abcde-prioritization-method` | 0 | **RETIRE** | Superseded by pipeline `nclex-prioritization-frameworks` |
| 17 | `nclex-priority-abcde-method` | 1 | **RETIRE** | Superseded by `nclex-prioritization-frameworks`. Link fix |
| 18 | `nclex-prioritization-strategy` | 1 | **RETIRE** | Superseded by `nclex-prioritization-frameworks`. Link fix |
| 19 | `nclex-prioritization-strategy-master` | 0 | **RETIRE** | Superseded by `nclex-prioritization-frameworks` |
| 20 | `delegation-assignment-guide` | 0 | **RETIRE** | Duplicate of #12 (adopted); SEO cannibalization |
| 21 | `nclex-sata-questions-strategy` | 3 | **RETIRE** | Duplicate of #4 (adopted). Link fixes → #4 |
| 22 | `nclex-clinical-judgment-framework-master` | 2 | **RETIRE** | Duplicate of #1 (adopted). Link fixes → #1 |
| 23 | `why-nursing-students-struggle-nclex-next-gen` | 2 | **ADOPT** | Unique topic, no dup |

**Summary: 12 ADOPT · 11 RETIRE.**

## Execution plan (on approval)
- **ADOPT**: copy `public/content/<slug>.html` → `content/<slug>.html` (identical bytes; pipeline-owned thereafter — build, media gate, injection all apply).
- **RETIRE**: delete `public/content/<slug>.html`; fix inbound links (sources in `content/` + stale public files) per the link-fix notes; retired URLs → 404 (or 301 to target where noted).
- Verify: rebuild, full link crawl zero broken, no orphan remains, pre-report-check OK.
