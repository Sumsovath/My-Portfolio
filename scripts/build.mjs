import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateBrowserData, ROOT_DIR } from "./lib/content.mjs";

const outputDir = path.resolve(ROOT_DIR, "dist");
if (outputDir === ROOT_DIR || !outputDir.startsWith(`${ROOT_DIR}${path.sep}`)) {
  throw new Error("Refusing to clean an unsafe build directory.");
}

const copyDirectory = async (source, destination, filter = () => true) => {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (!filter(sourcePath, entry)) continue;
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath, filter);
    } else if (entry.isFile()) {
      await cp(sourcePath, destinationPath);
    }
  }
};

const countFiles = async (directory) => {
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = await countFiles(entryPath);
      files += child.files;
      bytes += child.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(entryPath)).size;
    }
  }
  return { files, bytes };
};

const escapeHtmlAttribute = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const createProductionHtml = async (portfolioData) => {
  const source = await readFile(path.join(ROOT_DIR, "index.html"), "utf8");
  const title = portfolioData.seo.title;
  const description = portfolioData.seo.description;
  const keywords = [
    portfolioData.personal.name,
    portfolioData.personal.title,
    portfolioData.personal.location,
    ...portfolioData.heroBadges.map((badge) => badge.label)
  ]
    .filter(Boolean)
    .join(", ");
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: portfolioData.personal.name,
    jobTitle: portfolioData.personal.title,
    address: {
      "@type": "PostalAddress",
      addressLocality: portfolioData.personal.location
    },
    email: `mailto:${portfolioData.personal.email}`,
    url: "https://sum-sovath-portfolio.vercel.app/"
  }).replace(/</g, "\\u003c");

  let html = source.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttribute(title)}</title>`);
  const metaValues = {
    metaDescription: description,
    metaKeywords: keywords,
    openGraphTitle: title,
    openGraphDescription: description,
    twitterTitle: title,
    twitterDescription: description
  };

  Object.entries(metaValues).forEach(([id, value]) => {
    const pattern = new RegExp(`(id="${id}"[\\s\\S]*?content=")[^"]*(")`);
    html = html.replace(pattern, `$1${escapeHtmlAttribute(value)}$2`);
  });

  return html.replace(
    /<script id="personStructuredData" type="application\/ld\+json"><\/script>/,
    `<script id="personStructuredData" type="application/ld+json">${structuredData}</script>`
  );
};

const generated = await generateBrowserData();
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await writeFile(
  path.join(outputDir, "index.html"),
  await createProductionHtml(generated.portfolioData),
  "utf8"
);
await copyDirectory(path.join(ROOT_DIR, "css"), path.join(outputDir, "css"));
await copyDirectory(path.join(ROOT_DIR, "assets"), path.join(outputDir, "assets"));
await copyDirectory(path.join(ROOT_DIR, "js"), path.join(outputDir, "js"), (sourcePath) => {
  return path.basename(sourcePath) !== "portfolio-data.js";
});
await copyDirectory(path.join(ROOT_DIR, "public"), outputDir);

const totals = await countFiles(outputDir);
console.log(`Built ${totals.files} files (${totals.bytes} bytes) in ${outputDir}`);
generated.validation.warnings.forEach((issue) => {
  console.warn(`Warning: ${issue.file} ${issue.location}: ${issue.message}`);
});
