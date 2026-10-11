# Nitya Vodela — portfolio

This folder is the whole site. It's plain HTML, CSS, and JavaScript — no build
step, no install, nothing to run. You can open `index.html` directly in a
browser to preview it locally, or follow the steps below to put it online.

## What's in here

```
index.html     the page itself — structure only, rarely needs editing
styles.css     all visual styling (colors, layout, type, the heat palette)
script.js      the behavior — heat lens, cursor, scrolling, galleries, etc.
content.js     EVERYTHING YOU'D ACTUALLY EDIT: project text, links, your resume & socials
assets/        your real images, videos, and resume PDF, grouped by project
```

You will almost never need to open `script.js` or `styles.css`. Day to day,
you'll be editing `content.js` and adding files to `assets/`.

---

## Going live with GitHub + Cloudflare Pages

**1. Create a repository**
- On github.com, click **New repository**.
- Name it anything (e.g. `portfolio`). Keep it **Public** — Cloudflare's
  free plan needs this, and a public portfolio is meant to be seen anyway.
- Don't add a README or .gitignore — you already have one.

**2. Upload this folder**
- Open your new repository, click **Add file → Upload files**.
- Drag in everything *inside* this folder — `index.html`, `styles.css`,
  `script.js`, `content.js`, and the whole `assets/` folder — not the folder
  itself, its contents. Commit the upload.

**3. Connect Cloudflare Pages**
- Create a free account at **pages.cloudflare.com**.
- **Create a project → Connect to Git**, authorize GitHub, pick this
  repository.
- Build settings: leave everything blank/default — there is no build
  command and no output directory to set (or if it asks, output directory
  is `/`, i.e. the repo root).
- Click **Save and Deploy**.

That's it. Within a minute or two you'll have a live URL like
`portfolio-xyz.pages.dev`. From now on, **every time you save a change on
GitHub, the live site updates automatically** within about a minute — no
redeploy step, nothing to ask me to do.

A custom domain (like `nityavodela.com`) can be added later from the same
Cloudflare Pages project settings, whenever you're ready for one.

---

## Editing content

Everything editable lives in **`content.js`**. Open it on GitHub (click the
file, then the pencil icon to edit), make your change, and commit — the
live site updates within a minute.

### Change some text
Find the project (e.g. `'redline'`) inside `DETAILS` or `CASES` and edit the
text between quotes. Keep the quotes and commas exactly as they are.

```js
'redline': {
  status: 'Live',              // <- the small label on the project card
  title: 'Redline',            // <- the project name
  summary: '...',              // <- shown in the hover card
  ...
```

### Swap or add an image/video
1. Drop the new file into the matching folder in `assets/` (e.g.
   `assets/redline/`).
2. In `content.js`, find that project's `media:` list in `CASES`, and point
   an entry's `src` at the new filename:

```js
{ type: 'image', src: 'assets/redline/redline-score.jpg', alt: 'The risk score and rewrite' }
```

For a video, use `type: 'video'` and include a `poster` (a still frame shown
before it plays):

```js
{ type: 'video', src: 'assets/redline/redline-demo.mp4', poster: 'assets/redline/redline-demo-poster.jpg', alt: 'Describe what the video shows' }
```

Keep videos short and under a few MB — large files slow the page down for
visitors. JPEGs around 1600–2000px on the long edge are plenty sharp.

### Add a whole new project
1. Make a new folder in `assets/`, e.g. `assets/newproject/`, with its images.
2. In `content.js`, copy an existing entry in `DETAILS` (for the hover card)
   and `CASES` (for the full story) and change the key and the text — e.g.
   duplicate the `'dsl'` block, rename it `'newproject'`.
3. In `index.html`, copy one `<article class="project" data-detail="...">`
   block in the Work section and change `data-detail` to match your new key,
   plus its status/title/description text.

### Remove a project
Delete its `<article>` block from `index.html`, and its entries from
`DETAILS` and `CASES` in `content.js`. You can leave its `assets/` folder in
place or delete it — either is fine.

### Your contact details and resume
All in the `CONTACT` block at the bottom of `content.js` — socials, and the
resume PDF/preview pages (swap the files in `assets/resume/` and update the
filenames here to update your resume).

---

## A note on this split

This folder is the exact same site you reviewed and approved, just organized
differently: the design, the heat effect, the glass cursor, the galleries,
the dark/light modes — all identical. The only real change is that images
and video are now their own files instead of being buried as text inside
the script, which makes the page lighter and faster, and makes `content.js`
the one place you'll actually need to open to make a change.
