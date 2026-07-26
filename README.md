# Sum Sovath Portfolio

A dark, animated personal portfolio for Sum Sovath. The project uses plain HTML, CSS, and vanilla JavaScript with local GSAP, Three.js, Typed.js, and Font Awesome assets. Portfolio content lives in beginner-editable JSON files, so normal updates do not require editing HTML components.

## Detected Stack

- Framework: static HTML5, CSS3, and vanilla JavaScript
- Package manager: npm
- Runtime: Node.js 20 or newer
- Animation libraries: GSAP, Three.js, and Typed.js
- Production output: `dist/`
- Deployment configuration: Vercel through `vercel.json`
- External form service: Formspree, after a real form ID is configured

No runtime npm packages are required. Node.js is used for content validation, local serving, builds, and editing commands.

## Open And Install

1. Install Node.js 20 or newer.
2. Open VS Code.
3. Choose **File > Open Folder** and select this project folder.
4. Open the VS Code terminal.
5. Run:

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the URL printed by the command, normally `http://127.0.0.1:4173/`. If that port is busy, the server automatically tries the next available port. Changes to files in `content/` regenerate the browser data while the server is running; refresh the browser to see them.

## Content Files

Edit files in `content/`, not `js/portfolio-data.generated.js`.

| File | What it controls |
| --- | --- |
| `content/profile.json` | Name, title, introduction, location, email, photo, resume, hero roles |
| `content/about.json` | Biography, information cards, verified statistics |
| `content/navigation.json` | Navigation labels, targets, visibility, order |
| `content/story.json` | Personal story timeline |
| `content/skills.json` | Skills, categories, learning status, order |
| `content/experience.json` | Jobs, teaching, training, and volunteer experience |
| `content/projects.json` | Project cards, images, tags, links, status, visibility |
| `content/learning.json` | Learning roadmap and language learning |
| `content/education.json` | Education and additional training |
| `content/certificates.json` | Verified certificate cards |
| `content/achievements.json` | Achievements and disabled activity placeholders |
| `content/blog.json` | Blog topics and publication status |
| `content/social-links.json` | GitHub, LinkedIn, Telegram, and email links |
| `content/settings.json` | Formspree endpoint, filters, availability, empty-state text |

The examples in `content/templates/` are never loaded by the website. See [EDIT_PORTFOLIO.md](EDIT_PORTFOLIO.md) for exact beginner instructions.

## Content Commands

```bash
npm run list-content
npm run validate-content
npm run sync-content
npm run add-project
npm run add-experience
npm run add-certificate
```

The three `add-*` commands ask questions in the terminal, generate a unique ID, validate input, optionally copy an image into `public/uploads/`, create a backup in `content/backups/`, update the correct JSON file, and regenerate the browser data. Existing images are never overwritten without confirmation.

After a manual JSON edit, run:

```bash
npm run validate-content
npm run sync-content
```

Validation reports malformed JSON, duplicate IDs and orders, required fields, dates, URLs, and missing upload files. A validation error returns a nonzero exit code and prevents a production build.

## Upload Folders

- Profile photos: `public/uploads/profile/`
- Project images: `public/uploads/projects/`
- Certificate images: `public/uploads/certificates/`
- Experience images: `public/uploads/experience/`
- Resume PDFs: `public/uploads/resume/`

Each folder includes a small README. Public paths begin with `/uploads/`, for example `/uploads/projects/my-api.jpg`.

## Contact Form

The form submits `name`, `email`, `subject`, and `message` asynchronously. It has required fields, trimming, length limits, accessible errors, an aria-live status, a Formspree honeypot, network-error handling, and duplicate-submission protection. It does not use `mailto:` and does not log visitor data.

The current endpoint is intentionally a placeholder:

```text
https://formspree.io/f/YOUR_FORMSPREE_ID
```

To enable real delivery to `sumsovath99@gmail.com`:

1. Create a Formspree form and verify that address in the Formspree account.
2. Copy the public endpoint, such as `https://formspree.io/f/abcdwxyz`.
3. Open `content/settings.json`.
4. Replace only `YOUR_FORMSPREE_ID` with the real form ID.
5. Run `npm run validate-content` and `npm run build`.
6. Deploy, submit one test message, and confirm it arrives.

The Formspree form ID is public configuration, not a password. Never add Gmail passwords, Gmail app passwords, SMTP credentials, OAuth secrets, private API keys, or access tokens to this frontend project.

## Social Links

Edit `content/social-links.json`. Set `enabled` to `true` only for a real link. External links are rendered with `target="_blank"`, `rel="noopener noreferrer"`, and descriptive labels. The email item reads the address from `content/profile.json`, so the email is not duplicated.

## Test And Build

```bash
npm run validate-content
npm test
npm run build
npm run preview
```

The build regenerates content, stops on validation errors, adds static SEO metadata, and creates `dist/`. Preview normally runs at `http://127.0.0.1:4173/` and automatically chooses a nearby port if needed.

This project has no separate linter or TypeScript checker because it is dependency-free vanilla JavaScript. The automated Node tests cover content sorting, visibility, URLs, dates, validation, empty collections, and media fallbacks.

## Deploy

### Vercel

The repository is configured with `npm run build` and output directory `dist` in `vercel.json`.

```bash
npx vercel
npx vercel --prod
```

Run the production command only when the local build is correct and you intend to update the public site.

### Netlify

Connect the repository, use `npm run build` as the build command, and `dist` as the publish directory. You can also upload `sum-sovath-portfolio-deploy.zip` in Netlify's manual deployment area.

### GitHub Pages

Build the site, then publish the contents of `dist/` with a Pages workflow or a deployment branch. Do not publish the source folder as the Pages root because upload URLs are prepared in the production output.

## Create ZIP Files

Python 3 is required only for this packaging command:

```bash
npm run package
```

This builds and creates:

- `sum-sovath-portfolio-source.zip`: editable source, content, scripts, templates, and public assets
- `sum-sovath-portfolio-deploy.zip`: only the files from `dist/`, with `index.html` at the ZIP root

The script excludes `.git`, `.vercel`, `.env*`, `node_modules`, caches, backups, temporary files, existing ZIPs, and `dist/` from the source archive. It scans for common private-key and token patterns, tests ZIP integrity, and verifies the deployment layout.

## Publishing Checklist

- Replace the Formspree placeholder ID.
- Keep only verified certificates and achievements published.
- Add real GitHub or demo URLs to projects when available.
- Confirm all dates, education details, and project statuses remain accurate.
- Replace the resume PDF whenever it changes.
- Run validation, tests, and the production build.
- Test one real Formspree submission after deployment.
- Never commit or package passwords, tokens, private environment files, or account credentials.
