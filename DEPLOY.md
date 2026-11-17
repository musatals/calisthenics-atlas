# Deploy Calisthenics Atlas v1.3

This is a complete static website. There are no dependencies, secrets, build steps, or database migrations.

## Upload to GitHub (web interface)

1. Download and extract the `calisthenics-atlas-v1.3-training-workspace.zip` archive.
2. Open `https://github.com/musatals/calisthenics-atlas` in the account with write access.
3. Choose **Add file → Upload files**, then drag the **contents** of the extracted `calisthenics-atlas` folder into the upload area. Do not upload the enclosing folder as a subdirectory.
4. Verify that `index.html`, `styles.css`, `script.js`, `exercises/`, `assets/`, and `articles/` will appear at the repository root. Commit to `main`.
5. If GitHub says a same-named file already exists, replace/update the old copy as part of the commit; do not delete unrelated repository content.

## Deploy on Vercel

1. Sign in to the Vercel account and team containing the intended project (`mosq1`, if correct).
2. If `calisthenics-atlas` already exists, open **Settings → Git** and verify it is linked to `musatals/calisthenics-atlas` on branch `main`.
3. Otherwise, **Add New → Project → Import Git Repository** and choose `musatals/calisthenics-atlas`.
4. Use **Framework Preset: Other**, **Root Directory: `./`**, no build command, and no custom output directory.
5. After a successful build, confirm that `/`, `/exercises.html`, `/anatomy.html`, `/programs.html` and `/exercises/push-up.html`, `/training.html` and `/skill-tree.html` all resolve.

## Validate locally

From the extracted `calisthenics-atlas` directory, run:

```bash
python scripts/validate_site.py
python -m http.server 8000
```

Open http://localhost:8000 in a browser. `node --check script.js` and `node --check workspace.js` provide optional JavaScript syntax checks.

The Training Studio and Skill Map store data in each browser’s local storage, so use an ordinary local or HTTPS origin for interactive testing. Local file access restrictions may prevent persistence. The pages use no remote database or account.

## Publication note

Source-linked exercise advice is general educational information; posture and anatomy diagrams are original conceptual graphics, not measured activation data. A coach or clinician should review specialized exercise guidance before publication as certified instruction.
