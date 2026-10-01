# AWS Learning Journeys

Beginner-friendly, documentation-backed learning journeys for AWS services,
published at **https://www.studytrails.com/aws-learn/**. The first journey covers
**AWS Config**. The site is a static [Astro](https://astro.build) build served
from a real `/aws-learn/` folder next to the WordPress site on Bluehost.

## Layout

```
AWS_Services/
  deploy.sh                 # build, verify and rsync dist/ to Bluehost
  deploy.config.example     # copy to deploy.config (gitignored) and fill in
  docs/                     # the implementation plan
  journeys/<service>/*.mdx  # the content you edit
  site/                     # the Astro project (don't edit dist/)
```

Journey content lives in `journeys/`, *outside* the Astro project, so writing a
page never means touching site code:

```
journeys/<service>/index.mdx      ->  /aws-learn/<service>/           (overview)
journeys/<service>/<step>.mdx     ->  /aws-learn/<service>/<step>/    (a step)
```

## Working on the site

All commands run from `site/`:

```bash
cd site
npm install        # one time (Node >= 22.12; mise provides a suitable version)
npm run dev        # local dev server
npm run build      # produce dist/ (also runs Pagefind indexing)
npm run verify     # the full gate: unit tests, type check, e2e, build, dist checks
```

Narrower checks: `npm test` (unit), `npm run check` (types), `npm run test:dist`
(SEO/structure over the built `dist/`), `npm run test:e2e` (Playwright + axe).

## Adding a new service journey

Say you're adding **Amazon S3** (`s3`). The build cross-checks the service
registry against the `journeys/` folders, so these steps go together.

1. **Register the service.** Add an entry to `site/src/data/services.ts`, in the
   order the hub should list it:

   ```ts
   export const SERVICES: readonly Service[] = [
     { id: 'config', name: 'AWS Config' },
     { id: 's3', name: 'Amazon S3' },   // id = URL segment and folder name
   ];
   ```

   The build fails if a service here has no `journeys/<id>/` folder, or a folder
   exists with no entry here.

2. **Create the content folder** `journeys/s3/` with:
   - `index.mdx` — the overview (no `order`).
   - one `*.mdx` per step, each with an `order` of 1, 2, 3, … (no gaps or
     duplicates — `site/src/lib/journey.ts` enforces this).

3. **Write the frontmatter** on every page. Schema in
   `site/src/lib/schema.ts`:

   ```yaml
   ---
   title: "What Is Amazon S3? A Beginner's Guide"   # page <h1> and <title>
   navTitle: "What is S3?"                           # sidebar / breadcrumb label
   description: "…"                                  # <= 160 characters
   summary: "…"                                      # shown in step lists / hub
   order: 1                                          # steps only; omit on index.mdx
   sources:                                          # at least one; see below
     - title: "What Is Amazon S3?"
       url: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
   lastVerified: 2026-10-01                          # YYYY-MM-DD
   ---
   ```

   **Accuracy rules (from the plan):** check every claim against official AWS
   docs only. `sources` URLs must be `https` on `docs.aws.amazon.com` or
   `aws.amazon.com` — the schema rejects anything else. Set `lastVerified` to
   the date you checked.

4. **Write the body** in MDX. Visual-kit components (`Callout`, `KeyTerms`,
   `Figure`, `Tabs`, `StepLink`, diagrams, …) are injected into content
   automatically — use them without importing. See the existing
   `journeys/config/*.mdx` and the kit reference at `site/src/kit/components.mdx`.
   Give each page a **Key terms** section and at least one callout.

5. **Build and verify:**

   ```bash
   cd site && npm run verify
   ```

   This catches ordering mistakes, a description over 160 chars, a non-AWS
   source URL, a missing h1, broken internal links, and more.

6. **Commit** locally with a Conventional Commit, e.g.
   `feat(s3): add the Amazon S3 journey`. Don't push or deploy until the content
   is reviewed.

## Deploying

See `deploy.sh` for usage. In short, from the repo root:

```bash
cp deploy.config.example deploy.config   # one time; fill in SSH + REMOTE_PATH
./deploy.sh --build                      # test + build + verify, no upload
./deploy.sh --dry-run                    # show what would upload
./deploy.sh                              # test + build + verify + upload
```

Safety notes:

- `deploy.sh` runs the unit tests, the type check and the dist/SEO checks
  **before** any upload, and aborts on failure.
- rsync uses `--delete`, so `deploy.sh` **refuses to run unless `REMOTE_PATH`
  ends in `/aws-learn`** — this prevents it from ever mirroring over the WordPress
  site at `public_html/`.
- `site/public/.htaccess` ships the `/aws-learn/` 404 page, disables directory
  listings and sets cache headers. It only affects `/aws-learn/`.
- Deploying touches the production site. The folder is `/aws-learn` (not
  `/aws`) because WordPress already has a post whose slug collides with `/aws`.
  Only run the live upload after the content is reviewed.

After the first deploy, submit `https://www.studytrails.com/aws-learn/sitemap-index.xml`
in Google Search Console (`robots.txt` belongs to WordPress).
