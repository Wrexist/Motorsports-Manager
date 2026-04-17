# Start a **new project** from this codebase

You cannot “fork” into a new GitHub repository **from inside this repo alone** — creating the empty target repo and setting remotes is done **on your machine** (or in GitHub’s UI). This doc gives copy-paste steps.

Choose one path:

---

## Option A — GitHub fork (stays linked to upstream)

Use when you want pull requests back to `Motorsports-Manager` / Pit Lane Manager.

1. Open the repository on GitHub.
2. Click **Fork** (pick your account or org).
3. Clone **your** fork:

```bash
git clone https://github.com/YOUR_USER/YOUR_FORK.git
cd YOUR_FORK
npm ci
npm run verify
```

4. Rename the app in `package.json`, `capacitor.config.ts`, `index.html`, and `README.md` if you are making a derivative product (keep `CLAUDE.md` legal rules unless your product has different counsel).

---

## Option B — New repo with **no** GitHub fork link (recommended for a separate product)

You get a clean history (optional) and a new `origin`.

### 1. Create an empty repo on GitHub

Create `https://github.com/YOU/new-open-wheel-manager` (empty, no README).

### 2. Clone this repo locally (full history)

```bash
git clone https://github.com/Wrexist/Motorsports-Manager.git pit-lane-work
cd pit-lane-work
```

### 3. Point `origin` at your new repo and push

```bash
git remote rename origin upstream   # optional: keep upstream for pulling fixes
git remote add origin https://github.com/YOU/new-open-wheel-manager.git
git push -u origin main
```

If GitHub rejected because the remote is not empty, use a fresh clone with `--mirror` only when you know what you are doing; for an empty repo, a normal `git push -u origin main` is enough.

### 4. Install and verify

```bash
npm ci
npm run verify
```

---

## Option C — **Copy files only** (no git history)

Good when you want a minimal handoff or to strip history.

From the repo root:

```bash
./scripts/new-project-from-this-repo.sh /absolute/path/to/MyNewGame
cd /absolute/path/to/MyNewGame
git init
git add -A
git commit -m "chore: initial import from Pit Lane Manager codebase"
# create empty GitHub repo, then:
git remote add origin https://github.com/YOU/MyNewGame.git
git branch -M main
git push -u origin main
```

The script excludes `node_modules`, `dist`, and `.git` so you get a clean tree.

---

## After any option: re-identify the product

Update at least:

| File | What to change |
| ---- | -------------- |
| `package.json` | `name`, `description` |
| `capacitor.config.ts` | `appId`, `appName` |
| `index.html` | `<title>`, meta description |
| `README.md` | Product name and links |
| Store / legal | Follow `docs/legal/naming-disclaimer.md` |

Do **not** use protected series trademarks in UI or store metadata (`CLAUDE.md`).

---

## If you meant “fork Dynasty Manager (football)”

That is a **different** codebase. You would import or copy files from **that** project into a new repo, then follow Prompt 1 in `docs/agents/pit-lane-manager-prompt-library.md` (delete football modules, rename domain). This repository does not contain Dynasty’s source.
