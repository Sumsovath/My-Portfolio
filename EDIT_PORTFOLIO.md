# Edit Your Portfolio

This guide is for beginners. Normal content changes happen inside `content/`. Do not edit `js/portfolio-data.generated.js`; it is recreated by the commands.

After any manual JSON edit, use:

```bash
npm run validate-content
npm run sync-content
```

JSON uses double quotes, commas between items, and lowercase `true` or `false`. A missing comma is the most common mistake.

## 1. Change Your Name

Open `content/profile.json` and edit `name` and, if needed, `displayName`:

```json
"name": "Sum Sovath",
"displayName": "SUM SOVATH"
```

The name updates in the hero, navigation brand, footer, page metadata, and accessible text. Run `npm run validate-content` and `npm run sync-content`.

Common mistake: changing only text in `index.html`. The generated profile data will replace it in the browser.

## 2. Change Your Professional Title

Open `content/profile.json` and edit:

```json
"professionalTitle": "Java Backend Developer and Spring Boot Learner"
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistake: adding a title that claims experience you do not have. Keep the wording accurate.

## 3. Change Your Introduction And Biography

For the short hero introduction, open `content/profile.json` and edit:

```json
"shortIntroduction": "Write a short introduction here."
```

For the About section, open `content/about.json` and edit the strings in `paragraphs`:

```json
"paragraphs": [
  "First biography paragraph.",
  "Second biography paragraph."
]
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistake: removing the comma between paragraphs. The final paragraph must not have a trailing comma.

## 4. Change Your Profile Photo

1. Put a JPG, PNG, or WebP image in `public/uploads/profile/`.
2. Open `content/profile.json`.
3. Change `profileImage` and optionally `profileThumbnail`:

```json
"profileImage": "/uploads/profile/new-profile.jpg",
"profileThumbnail": "/uploads/profile/new-profile-thumb.jpg"
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistakes: using a Windows path such as `C:\\Photos\\me.jpg` in JSON, forgetting `/uploads/profile/`, or using a filename with different capitalization. The browser needs the public `/uploads/...` path.

## 5. Update Your Resume

1. Put the PDF in `public/uploads/resume/`.
2. Open `content/profile.json`.
3. Edit `resumeFile`:

```json
"resumeFile": "/uploads/resume/sum-sovath-resume.pdf"
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistake: adding a Word document. The download is designed for a PDF, and the upload helper accepts PDF files for resumes.

## 6. Change Your Email

Open `content/profile.json` and edit:

```json
"email": "sumsovath99@gmail.com"
```

This updates visible contact information, copy-email behavior, structured data, and the footer email link. Run `npm run validate-content` and `npm run sync-content`.

Common mistake: adding `mailto:` in this field. Enter only the email address; the website creates `mailto:` where appropriate.

## 7. Change Social Links

Open `content/social-links.json`. Edit the `url`, `enabled`, and `ariaLabel` fields:

```json
{
  "id": "github",
  "name": "GitHub",
  "url": "https://github.com/Sumsovath",
  "icon": "github",
  "enabled": true,
  "order": 1,
  "ariaLabel": "Open Sum Sovath on GitHub in a new tab"
}
```

For the email item, keep `"profileField": "email"`; it reads the address from `profile.json`. Run `npm run validate-content` and `npm run sync-content`.

Common mistakes: enabling a placeholder URL, omitting `https://`, duplicating an `id` or `order`, or adding a private access token to a URL.

## 8. Add A Skill

Open `content/skills.json` and add an object before the final `]`:

```json
{
  "id": "unit-testing",
  "name": "Unit Testing",
  "category": "Backend Development",
  "categoryOrder": 2,
  "status": "Currently learning",
  "icon": "",
  "categoryIcon": "fa-solid fa-server",
  "published": true,
  "order": 11
}
```

Use an unused `id`. The `order` must be unique inside the same category. Run `npm run validate-content` and `npm run sync-content`.

Common mistakes: using a percentage instead of an honest status, repeating an order inside a category, or forgetting the comma before the new object.

## 9. Add Work Experience

The easiest method is:

```bash
npm run add-experience
```

The command asks for the job title, company, location, `YYYY-MM` dates, current-role status, description, responsibilities, technologies, and publication status. It updates `content/experience.json` and creates a backup.

Manual example:

```json
{
  "id": "company-junior-developer",
  "position": "Junior Developer",
  "company": "COMPANY NAME",
  "location": "LOCATION",
  "startDate": "2026-01",
  "endDate": "",
  "currentlyWorking": true,
  "description": "SHORT DESCRIPTION",
  "responsibilities": ["RESPONSIBILITY 1"],
  "technologies": ["Java"],
  "type": "Experience",
  "icon": "fa-solid fa-briefcase",
  "published": false,
  "order": 6
}
```

After a manual edit, run `npm run validate-content` and `npm run sync-content`.

Common mistakes: inventing an employer, using `January 2026` instead of `2026-01`, leaving `endDate` empty when `currentlyWorking` is false, or publishing unverified information.

## 10. Add Education

Open `content/education.json` and add an object to the `education` array:

```json
{
  "id": "institution-program",
  "institution": "INSTITUTION NAME",
  "qualification": "QUALIFICATION",
  "field": "FIELD OF STUDY",
  "startYear": "2024",
  "endYear": "",
  "currentlyStudying": true,
  "status": "CURRENT STATUS",
  "description": "",
  "details": ["DETAIL 1"],
  "published": false,
  "order": 4
}
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistakes: adding the record outside the `education` array, using two-digit years, or stating a completed degree before it is completed.

## 11. Add A Certificate

The easiest method is:

```bash
npm run add-certificate
```

The command can copy a local image into `public/uploads/certificates/`, validates the `YYYY-MM` date and URL, updates `content/certificates.json`, and makes a backup.

Manual example:

```json
{
  "id": "issuer-certificate-title",
  "title": "CERTIFICATE TITLE",
  "issuer": "ISSUER",
  "issueDate": "2026-01",
  "credentialUrl": "",
  "image": "/uploads/certificates/certificate-title.jpg",
  "category": "Backend",
  "status": "Verified credential",
  "published": false,
  "order": 1
}
```

After a manual edit, run `npm run validate-content` and `npm run sync-content`.

Common mistakes: publishing a placeholder, using a missing image path, writing a date as `01/2026`, or adding a credential URL without `https://`.

## 12. Add A Project Manually

Open `content/projects.json` and add an object before the final `]`:

```json
{
  "id": "my-new-api",
  "title": "My New API",
  "shortDescription": "A short project summary.",
  "fullDescription": "A longer explanation of the project and what I learned.",
  "image": "/uploads/projects/my-new-api.jpg",
  "technologies": ["Java", "Spring Boot"],
  "categories": ["Java", "Spring Boot"],
  "status": "Learning project",
  "learningOutcomes": ["Learning outcome 1"],
  "liveUrl": "",
  "githubUrl": "",
  "featured": false,
  "published": false,
  "order": 11
}
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistakes: using `category` instead of `categories`, repeating an ID or order, adding an invalid URL, or claiming a future project is complete.

## 13. Add A Project With The Command

Run:

```bash
npm run add-project
```

Answer each question and press Enter. Separate technologies, categories, and learning outcomes with commas. You can paste a full local image path such as `C:\Users\YourName\Pictures\api.jpg`; the command copies it and stores the correct public path.

When finished, run `npm run validate-content` and start `npm run dev` to review the card.

Common mistakes: typing multiple list values without commas, entering a partial URL, or publishing before checking the generated text and image.

## 14. Add A Project Screenshot

1. Put a JPG, PNG, or WebP file in `public/uploads/projects/`.
2. Open `content/projects.json`.
3. Edit that project's `image` field:

```json
"image": "/uploads/projects/my-new-api.jpg"
```

Run `npm run validate-content` and `npm run sync-content`.

Common mistakes: referencing `public/uploads/...` in the URL, using backslashes, or renaming the image without updating JSON. Leave `image` empty to show the clean fallback instead of a broken icon.

## 15. Hide An Unfinished Project

Open `content/projects.json` and set:

```json
"published": false
```

The object remains in JSON but is removed from the website. Run `npm run validate-content` and `npm run sync-content`.

Common mistake: deleting the whole project when you only want to hide it temporarily.

## 16. Reorder Projects Or Experience

Open `content/projects.json` or `content/experience.json` and edit each `order` value:

```json
"order": 1
```

Smaller numbers appear first. Every visible or hidden entry in that file must have a unique positive whole-number order. Run `npm run validate-content` and `npm run sync-content`.

Common mistake: giving two entries the same order. Validation will show both locations.

## 17. Run The Website Locally

From the project folder, run:

```bash
npm install
npm run dev
```

Open the printed local URL. The source files are served by the local Node server, including `/uploads/` paths.

Common mistake: opening `index.html` directly and expecting all production-style paths to behave the same way.

## 18. Validate Content

Run:

```bash
npm run validate-content
```

Read each error as `file`, `location`, and `message`. Open that file and fix the indicated field. To see current counts, use `npm run list-content`.

Common mistake: ignoring warnings. The current Formspree placeholder warning means real delivery is not configured; the empty certificate warning is intentional until a real credential is added.

## 19. Build The Website

Run:

```bash
npm test
npm run build
npm run preview
```

The production website is created in `dist/`. Open the preview URL printed by the last command.

Common mistake: manually editing files inside `dist/`. The next build deletes and recreates that folder.

## 20. Deploy Changes

For the linked Vercel project, first validate and build, then run:

```bash
npm run validate-content
npm test
npm run build
npx vercel --prod
```

Vercel uses `npm run build` and deploys `dist/`. Netlify should use the same build command and publish directory. See `README.md` for GitHub Pages notes.

Common mistakes: deploying before reviewing the preview, forgetting to replace the Formspree ID, or uploading the source ZIP where a host expects only production files.

## 21. Regenerate ZIP Files

Install Python 3, then run:

```bash
npm run package
```

This rebuilds the site and creates `sum-sovath-portfolio-source.zip` and `sum-sovath-portfolio-deploy.zip` in the project root.

Common mistake: manually placing private `.env` files, passwords, tokens, or credentials into the project. The ZIP script blocks common secret files and patterns, but you must still keep all account secrets outside frontend code.

## Configure Formspree

Open `content/settings.json` and replace:

```json
"formspreeEndpoint": "https://formspree.io/f/YOUR_FORMSPREE_ID"
```

with your real public endpoint:

```json
"formspreeEndpoint": "https://formspree.io/f/abcdwxyz"
```

Run `npm run validate-content`, `npm run build`, and deploy. Then send one test message from the deployed website and confirm receipt at `sumsovath99@gmail.com`.

Common mistakes: pasting a Formspree dashboard URL instead of the `/f/...` endpoint, adding Gmail credentials, or assuming delivery works before the Formspree email is verified.

## Safe Editing Checklist

1. Make one content change at a time.
2. Keep IDs lowercase with hyphens.
3. Keep orders unique.
4. Use `YYYY-MM` for experience and certificate dates.
5. Use four-digit years for education.
6. Use complete `https://` links.
7. Use `/uploads/...` for public media paths.
8. Set `published` or `enabled` to `false` until information is verified.
9. Run validation after every edit.
10. Never store passwords, private keys, OAuth secrets, or access tokens in this project.
