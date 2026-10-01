# Implementation Plan: Amazon S3 Journey

## Problem Statement
Add a second beginner learning journey — **Amazon S3** — to the existing site at
`studytrails.com/aws-learn/`. Same shape as the AWS Config journey: SEO-friendly,
documentation-backed static pages with accessible interactive visuals, each page
working on its own for readers arriving from search.

## Scope note: this plan vs. the README
The **mechanics** of adding a journey (register the service, folder/file layout,
frontmatter schema, accuracy rules, the visual kit, `npm run verify`, commit and
deploy) are already documented in **`README.md` → "Adding a new service journey"**
and are **not repeated here**. Follow the README for all of that.

This plan only records the **S3-specific decisions** the README can't make for you:
which steps exist, which official docs anchor each one, which facts shape the
content, and which visuals each step gets (reused vs. new). Read the README first,
then use this file as the content/design brief.

## Requirements
- URLs: `/aws-learn/` (hub) → `/aws-learn/s3/` (overview) → `/aws-learn/s3/<step>/`.
  Prev/next and saved progress come for free from the existing routing.
- Audience: beginners, no AWS account needed to follow along.
- Accuracy: check every claim against official AWS sources only — the Amazon S3
  User Guide and the S3 FAQs on `aws.amazon.com`. Each page lists its `sources`
  and a `lastVerified` date. The schema rejects non-AWS source URLs.
- Visuals: custom SVG in the site's existing color tokens, with text labels. No
  AWS icons. Every figure has a caption and a text description; controls are
  keyboard-operable; animations respect reduced-motion; state is shown as text,
  not color alone.
- Each page uses its own concrete example and stands alone for search arrivals.
- Reuse the existing stack, layouts and visual kit. Register `s3` in
  `site/src/data/services.ts` after `config`.

## Background

### What already exists (reuse, don't rebuild)
- Routing, sidebar + scroll-spy, Pagefind search, progress (localStorage
  `st-aws:<service>`), breadcrumbs, prev/next, SEO head + JSON-LD, per-page share
  images, sitemap, 404, deploy pipeline — all service-agnostic. Adding `s3`
  content flows through them with no site-code changes beyond the registry entry
  and any **new** visual components.
- **Reusable visual kit** (injected into MDX without imports, see
  `site/src/components/kit/index.ts`): `Callout`, `KeyTerms`, `Figure`, `Tabs` /
  `TabPanel`, `Stepper`, `Diagram`, `ServiceNode`, `Arrow`, `StepLink`, `Term`.
  These carry straight over to S3.
- **Config-specific kit that does NOT fit S3**: `RuleSimulator`, `CompliancePill`,
  `ServiceSorter`. Don't force these onto S3; build S3-specific visuals instead
  (listed per step below), following the same accessibility pattern (pure logic
  unit-tested, keyboard support, aria-live caption, reduced-motion).

### Facts from the docs that shape the content
Verify each against the S3 User Guide / FAQ at build time; this is the intended
backbone, not a substitute for fetching the pages.
- An **object** = data + metadata + a **key**; objects live in **buckets**. S3 is
  object storage, not a file system — the "folders" in the console are key-name
  prefixes, not real directories.
- Bucket names are **globally unique** across all AWS accounts and follow DNS
  naming rules; buckets live in a specific **Region**.
- S3 is **strongly read-after-write consistent** for all GET/PUT/LIST and for
  metadata operations (since Dec 2020) — no eventual-consistency caveat anymore.
- **Durability** is designed for **11 nines** (99.999999999%); storage classes
  differ on **availability** and cost, not that headline durability (One Zone-IA
  is the exception — single AZ).
- **Storage classes**: S3 Standard, Intelligent-Tiering, Standard-IA, One Zone-IA,
  Glacier Instant Retrieval, Glacier Flexible Retrieval, Glacier Deep Archive.
  Intelligent-Tiering moves objects between tiers automatically; Glacier Deep
  Archive is the cheapest / slowest to retrieve.
- **Security defaults**: new buckets **block all public access** and are private;
  **Block Public Access** is on by default. Access is granted via IAM policies,
  bucket policies, and (legacy) ACLs — ACLs are disabled by default on new buckets
  (Object Ownership = bucket owner enforced).
- **Encryption**: S3 applies **SSE-S3 by default** to new objects (since Jan 2023).
  Options: SSE-S3, SSE-KMS, SSE-C.
- **Versioning** keeps multiple versions of an object; once enabled it can only be
  suspended, not switched off; delete markers are how deletes behave with
  versioning on.
- **Lifecycle rules** transition objects between storage classes or expire them on
  a schedule.
- **Static website hosting** serves content directly from a bucket; this is a
  distinct feature from normal object access.
- The two canonical "which do I use?" confusions for beginners:
  bucket policy vs IAM policy vs ACL, and S3 vs EBS vs EFS (object vs block vs file).

### Page plan (examples per page, taken from the docs)

| Step | Target search phrase | Visuals | Example |
|---|---|---|---|
| Overview (`index.mdx`) | Amazon S3 tutorial for beginners | JourneyMap (reused) with progress ticks | — |
| what-is-amazon-s3 | What is Amazon S3 | **BucketAnatomy** (bucket → object = key + data + metadata), object-vs-filesystem callout, use-case tabs | Storing `photos/2026/cat.jpg` and why the "folder" is just a key prefix |
| buckets-and-objects | S3 buckets and objects explained | **KeyPrefixExplorer** (flat keyspace shown as a tree, toggle "real folders? no"), global-naming diagram, Region placement with ServiceNode | Why `my-bucket` may be taken by another account |
| storage-classes | S3 storage classes compared | **StorageClassMatrix** (interactive: pick access pattern → recommended class; axes = retrieval speed vs cost), lifecycle timeline Stepper | A log file moving Standard → Standard-IA → Glacier Deep Archive over 180 days |
| security-and-access | S3 bucket policy vs IAM vs ACL / block public access | **AccessDecisionFlow** ("is this request allowed?" walk-through of Block Public Access → policies → default-deny), encryption Tabs (SSE-S3/KMS/C) | A request to a private bucket being denied by Block Public Access |
| versioning-and-lifecycle | S3 versioning and lifecycle rules | **VersionTimeline** (puts/deletes build a version stack, delete-marker shown), lifecycle rule builder (read-only, from docs) | Recovering an object after an accidental delete via its previous version |
| s3-vs-ebs-vs-efs | S3 vs EBS vs EFS difference | **StorageSorter** (click-to-assign workloads to object/block/file — adapt the ServiceSorter pattern, scoring unit-tested) + comparison table + "where to go next" | Choosing storage for a database volume vs a media library vs a shared home dir |

Step order (frontmatter `order`): 1 what-is-amazon-s3, 2 buckets-and-objects,
3 storage-classes, 4 security-and-access, 5 versioning-and-lifecycle,
6 s3-vs-ebs-vs-efs. (6 steps + overview, mirroring Config.)

## New vs. reused components

| Component | Status | Notes |
|---|---|---|
| JourneyMap, Callout, KeyTerms, Figure, Tabs/TabPanel, Stepper, Diagram, ServiceNode, Arrow, StepLink, Term | **reuse** | no changes needed |
| BucketAnatomy | **new** | SVG, static + optional hover labels |
| KeyPrefixExplorer | **new** | tree view of a flat keyspace; keyboard expand/collapse |
| StorageClassMatrix | **new** | pure "pattern → class" logic unit-tested |
| AccessDecisionFlow | **new** | Stepper-based walk-through; reuses Stepper logic |
| VersionTimeline | **new** | pure version-stack logic unit-tested |
| StorageSorter | **new, adapt** | fork the `ServiceSorter` pattern (don't modify the Config one) with S3/EBS/EFS buckets; scoring unit-tested |

If any new component turns out to generalize, add it to
`site/src/components/kit/index.ts` so later journeys can reuse it; otherwise keep
it local to the S3 pages.

## Task Breakdown
Commit locally after each task with Conventional Commits (`feat(s3): …`). Don't
push or deploy until the content is reviewed. Run `cd site && npm run verify`
before every commit — it catches ordering gaps, >160-char descriptions, non-AWS
source URLs, missing h1, broken links, etc.

### Task 1: Register the journey and scaffold all pages
- Add `{ id: 's3', name: 'Amazon S3' }` to `SERVICES` after `config`.
- Create `journeys/s3/` with `index.mdx` (overview, no `order`) and six stub
  step `.mdx` files with correct `order`, `navTitle`, placeholder `description`
  (<=160 chars), `summary`, one real `sources` entry each, and `lastVerified`.
- Each stub has a single `# h1` and a Key terms + one callout placeholder so the
  structure checks pass.
- Verify: `npm run verify` is green; `/aws-learn/s3/` and all six steps route and
  link in order via sidebar, breadcrumbs and prev/next.
- Demo: click the full journey end to end with placeholder content.

### Task 2: what-is-amazon-s3 + buckets-and-objects (content + visuals)
- Fetch and cite the S3 User Guide intro + "Buckets overview" / "Objects
  overview" pages. Write real titles/descriptions, Key terms, callouts.
- Build **BucketAnatomy**, **KeyPrefixExplorer** (unit-test any expand/collapse or
  key-parsing logic), and the global-naming / Region diagram using ServiceNode.
- Each visual: caption + text description, keyboard support, reduced-motion. With
  JS disabled, the core text must still be present.
- Verify + Playwright/axe on both pages. Demo: the two foundational steps read
  cleanly and the keyspace explorer makes "no real folders" land.

### Task 3: storage-classes + versioning-and-lifecycle (content + visuals)
- Cite the storage-classes and versioning/lifecycle User Guide pages. Get the
  class list and the 11-nines / One Zone-IA nuance exactly right.
- Build **StorageClassMatrix** (pure pattern→class recommendation, unit-tested)
  and **VersionTimeline** (pure version-stack + delete-marker logic, unit-tested);
  reuse Stepper for the lifecycle timeline.
- Verify + Playwright/axe. Demo: pick an access pattern and see the recommended
  class; walk a put/delete/restore sequence on the version timeline.

### Task 4: security-and-access (content + visuals)
- Cite Block Public Access, bucket policy / IAM / ACL, and default encryption
  pages. Pin the current defaults (BPA on, ACLs disabled, SSE-S3 by default).
- Build **AccessDecisionFlow** (Stepper-based allow/deny walk-through) and the
  encryption Tabs. Show deny decisions as text, not color alone.
- Verify + Playwright/axe. Demo: follow a request to a private bucket and see
  where it's blocked.

### Task 5: s3-vs-ebs-vs-efs + overview/hub copy (content + visuals)
- Cite the S3 vs EBS vs EFS comparison guidance (object vs block vs file).
- Build **StorageSorter** by adapting the `ServiceSorter` pattern into a new
  component (leave the Config one untouched); unit-test the scoring. Add the
  comparison table and "where to go next" links.
- Fill in the real `index.mdx` overview copy (six-step summary, like Config's).
- Verify + full Playwright/axe. Demo: the whole S3 journey is complete end to end
  and the hub lists both journeys.

### Task 6: Deploy
- No pipeline changes needed — `deploy.sh`, `.htaccess` and the `/aws-learn`
  guard already cover any new journey. Run `./deploy.sh --build`, then
  `--dry-run`, then the live deploy **only after the user confirms** (production).
- Nothing new for Search Console: the existing sitemap index already picks up the
  new pages.
- Demo: the Amazon S3 journey is live at
  `https://www.studytrails.com/aws-learn/s3/`.
