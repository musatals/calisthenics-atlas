# Calisthenics Atlas · Interactive Training Workspace v1.3

A deployable, dependency-free, accessible static educational website about bodyweight training.

## What's included

- Responsive homepage and 15 linked articles
- **38 fully dedicated exercise pages** in `exercises/`, each with original pose SVG and anatomy-region SVG
- **76 original SVG teaching illustrations** in `assets/exercise-diagrams/` and `assets/anatomy-diagrams/`
- A broad original hero illustration in WebP (`assets/calisthenics-atlas-hero.webp`)
- Exercise explorer with keyword, movement family, and difficulty filters
- Anatomy atlas explaining broad muscle groups and diagram limitations
- Exercise-specific setup, performance steps, common mistakes/fixes, readiness criteria and safety notices
- Five progression families with internal links to related exercise pages
- Cross-links into beginner, balanced and skill-oriented training templates
- `exercise-data.json` for straightforward structured editorial maintenance
- `scripts/validate_site.py` for automated static link and asset checks
- **Training Studio** (`training.html`): generate adaptable 2–4 day routines by goal, experience and safe equipment; customize sets and reps; log completed sessions; export/import training data locally
- **Interactive Skill Map** (`skill-tree.html`): explore five progressions and mark steps Not started, Practicing or Confident, stored locally in the browser
- `workspace.js` and `workspace.css` provide both interactive features without a backend or third-party services

## Run locally

Run `python -m http.server 8000` at the repository root and visit http://localhost:8000.

## Deploy to Vercel

Import `musatals/calisthenics-atlas` and choose **Framework Preset: Other**, **Root Directory: ./**, and **no build command**. The `vercel.json` file supports static hosting.

## Editorial responsibility

All pose and anatomy drawings are **conceptual illustrations**, not a photographic technique analysis, anatomical dissection, measured muscle activation, or diagnostic advice. Exercises and sample programs are educational generalizations, not individualized prescriptions. Check anchors and supports carefully. For relevant updated guidelines, refer to CDC adult physical activity guidance, ACE Exercise Library, and the 2026 ACSM resistance-training position stand.

Content should receive review from qualified movement professionals before being presented as authoritative individual instruction.
