# Kikō PMO OS — v4.1a (static)

A working-memory layer for managing business opportunities as a hierarchy of
Portfolio → Project → Branch → Work Item. Pure HTML/CSS/JS — no build tools,
no npm, no framework. Runs entirely in the browser and saves to your device.

**Principle:** Import › Merge › Export. Never overwrite.

---

## What's in this folder

```
/
├── index.html      app shell
├── style.css       wabi-sabi visual language
├── app.js          all logic (vanilla JS)
└── README.md       this file
```

That's the whole app. Open `index.html` in any browser and it works.

---

## First-trial features

- **Capture** — paste text or a screenshot, then classify it (Update / Work / Branch / Project / Suggest-Portfolio). Disposable; nothing becomes a Portfolio without your confirmation.
- **Import** — load an Excel/CSV file or paste CSV. Modes: Preview Diff · Merge · Append. Produces an Import Report (created / updated / merged / ignored / conflicts). Never replaces existing data.
- **Merge / Convert** — on any node's detail page, convert it down the allowed transforms (Project→Branch, Branch→Work, Work→Project, Portfolio→Freeze). History is preserved.
- **Portfolio** — the hierarchy tree, filtered by state (active / incubator / inbox / frozen / archived), with a live WIP meter (deliver 2 · build 1 · explore 1).
- **Daily PMO** — today's ONE work item + up to 2 secondary, with inline status toggle.
- **Export** — raw Nodes.xlsx (re-importable) and a PMO Snapshot in Excel + Markdown for external discussion (e.g. ChatGPT).

Deferred for later: OCR, cloud sync, automation, PWA.

---

## Storage & data

Your data is saved in **your browser's localStorage** on the device you're using.
It survives refreshes and app restarts, but it does **not** sync between devices.
Each phone / computer keeps its own copy. Use **Export** to move data between
devices or to back it up.

On first run the app offers to import the seed projects via a Preview Diff —
choose **Confirm Import** to load them, or **Start Empty**.

---

## Try it locally first (optional)

Just double-click `index.html`, or open it in any browser. Everything works
except: file downloads and the Excel library need an internet connection the
first time (the Excel library loads from a CDN). CSV and Markdown always work.

---

## Deploy to GitHub Pages

Follow these steps exactly.

### 1. Upload files

1. Go to <https://github.com> and sign in (create a free account if needed).
2. Click the **+** in the top-right → **New repository**.
3. Name it, for example, `kiko-pmo`. Leave it **Public**. Click **Create repository**.
4. On the new repo page, click **uploading an existing file** (the link in the
   "Quick setup" box). 
5. Drag **all four files** — `index.html`, `style.css`, `app.js`, `README.md` —
   into the upload area. Make sure they are at the **top level**, not inside a folder.
6. Click **Commit changes**.

### 2. Enable Pages

1. In your repo, click **Settings** (top menu).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, select **main** and folder **/ (root)**. Click **Save**.
5. Wait about 1 minute. The page will show:
   *"Your site is live at https://YOUR-USERNAME.github.io/kiko-pmo/"*

### 3. Open the URL

1. Open that link in your phone's browser:
   `https://YOUR-USERNAME.github.io/kiko-pmo/`
2. The app loads. Choose **Business Dev** and confirm the seed import.

### 4. Add to Home Screen

**iPhone (Safari):**
1. Tap the **Share** button (square with an up-arrow).
2. Scroll down, tap **Add to Home Screen**.
3. Tap **Add**. The Kikō icon now sits on your home screen and opens full-screen.

**Android (Chrome):**
1. Tap the **⋮** menu (top-right).
2. Tap **Add to Home screen** (or **Install app**).
3. Tap **Add**. The app appears in your launcher.

---

## Updating the app later

Edit the files on your computer, then in GitHub: open the repo → click the file →
the pencil (Edit) icon → paste the new contents → **Commit changes**. Pages
redeploys automatically within a minute. Your saved data is untouched (it lives
in your browser, not in the repo).

---

## Import file format

When importing Excel/CSV, use these columns (a header row is optional):

```
title, type, parentTitle, summary
```

- `type` — one of: `portfolio`, `project`, `branch`, `work`
- `parentTitle` — the exact title of the parent node (leave blank for portfolios)
- Rows whose parent can't be found are listed as **conflicts** (not imported)

Example:

```
title,type,parentTitle,summary
新支線,branch,竹餐盤供貨,LOGO 第二版
刀模報價,work,新支線,向工廠詢價
```

---

## Roadmap note

Once this static version has earned its keep over a couple of weeks, the natural
next step is a migration to React (componentized, easier to extend) and then
optional Google Sheets sync for team sharing. The data model is already frozen
and stable, so that migration is additive — your exported data carries straight over.
