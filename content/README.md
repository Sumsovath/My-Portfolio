# Portfolio Content

Edit the JSON files in this folder to update the website. Run these commands after editing:

```bash
npm run validate-content
npm run sync-content
```

The website reads the generated file `js/portfolio-data.generated.js`. Do not edit that generated file directly.

- `profile.json`: name, title, introduction, email, images, resume, and hero details
- `about.json`: biography, information cards, and verified statistics
- `skills.json`: individual skills and learning status
- `experience.json`: jobs, teaching, training, and volunteer roles
- `education.json`: education and additional training
- `projects.json`: projects, links, screenshots, categories, and publishing controls
- `certificates.json`: verified certificates
- `social-links.json`: footer social links
- `settings.json`: Formspree, project filters, availability, and empty-state messages
- `templates/`: examples only; template records never appear on the website

JSON rules:

1. Keep double quotes around keys and text.
2. Put a comma between entries, but not after the final entry.
3. Use `true` or `false` without quotes.
4. Give every entry a unique `id` and `order`.
5. Set `published` or `enabled` to `false` to hide an entry.
