import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import {
  CONTENT_FILES,
  copyPreparedMedia,
  generateBrowserData,
  isValidExternalUrl,
  isValidMonth,
  loadContent,
  prepareMediaCopy,
  slugify,
  validateContent,
  writeContentFileSafely
} from "./lib/content.mjs";

const type = process.argv[2];
const supportedTypes = ["project", "experience", "certificate"];

if (process.argv.includes("--help") || !supportedTypes.includes(type)) {
  console.log("Usage: node scripts/add-content.mjs <project|experience|certificate>");
  console.log("Use the npm scripts: npm run add-project, npm run add-experience, npm run add-certificate");
  process.exit(type && !supportedTypes.includes(type) ? 1 : 0);
}

const terminal = createInterface({ input, output });

const ask = async (question, options = {}) => {
  const { required = false, defaultValue = "" } = options;
  while (true) {
    const suffix = defaultValue !== "" ? ` [${defaultValue}]` : "";
    const value = (await terminal.question(`${question}${suffix}: `)).trim() || String(defaultValue);
    if (!required || value) return value;
    console.log("Please enter a value.");
  }
};

const askBoolean = async (question, defaultValue = true) => {
  const defaultText = defaultValue ? "Y/n" : "y/N";
  while (true) {
    const value = (await terminal.question(`${question} (${defaultText}): `)).trim().toLowerCase();
    if (!value) return defaultValue;
    if (["y", "yes"].includes(value)) return true;
    if (["n", "no"].includes(value)) return false;
    console.log("Enter y for yes or n for no.");
  }
};

const askUrl = async (question) => {
  while (true) {
    const value = await ask(question);
    if (!value || isValidExternalUrl(value)) return value;
    console.log("Enter a complete http:// or https:// URL, or leave it empty.");
  }
};

const askMonth = async (question, options = {}) => {
  const { required = false } = options;
  while (true) {
    const value = await ask(question, { required });
    if (isValidMonth(value, !required)) return value;
    console.log("Use YYYY-MM, for example 2025-01.");
  }
};

const askList = async (question) => {
  const value = await ask(`${question} (separate items with commas)`);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const uniqueId = (base, items) => {
  const used = new Set(items.map((item) => item.id));
  const initial = slugify(base);
  if (!used.has(initial)) return initial;
  let suffix = 2;
  while (used.has(`${initial}-${suffix}`)) suffix += 1;
  return `${initial}-${suffix}`;
};

const nextOrder = (items) =>
  items.reduce((maximum, item) => Math.max(maximum, Number(item.order) || 0), 0) + 1;

const handleMedia = async (sourcePath, mediaType, slug) => {
  if (!sourcePath) return "";
  if (sourcePath.startsWith("/uploads/") || sourcePath.startsWith("/assets/")) return sourcePath;

  const prepared = await prepareMediaCopy(sourcePath, mediaType, slug);
  if (path.resolve(prepared.source) === path.resolve(prepared.destination)) {
    return prepared.publicPath;
  }

  if (prepared.destinationExists) {
    const overwrite = await askBoolean(
      `The file ${path.basename(prepared.destination)} already exists. Overwrite it?`,
      false
    );
    if (!overwrite) {
      const reuse = await askBoolean("Use the existing uploaded file instead?", true);
      return reuse ? prepared.publicPath : "";
    }
  }

  await copyPreparedMedia(prepared);
  console.log(`Copied media to ${prepared.publicPath}`);
  return prepared.publicPath;
};

const buildProject = async (items) => {
  const title = await ask("Project title", { required: true });
  const id = uniqueId(title, items);
  const shortDescription = await ask("Short description", { required: true });
  const fullDescription = await ask("Full description", { defaultValue: shortDescription });
  const technologies = await askList("Technologies");
  const categories = await askList("Categories");
  const liveUrl = await askUrl("Live URL");
  const githubUrl = await askUrl("GitHub URL");
  const sourceImage = await ask("Local image path or existing /uploads/ path");
  const featured = await askBoolean("Featured project?", false);
  const published = await askBoolean("Publish this project now?", true);
  const status = await ask("Project status", { defaultValue: "Learning project" });
  const learningOutcomes = await askList("Learning outcomes");
  const image = await handleMedia(sourceImage, "projects", id);

  return {
    id,
    title,
    shortDescription,
    fullDescription,
    image,
    technologies,
    categories,
    status,
    learningOutcomes,
    liveUrl,
    githubUrl,
    featured,
    published,
    order: nextOrder(items)
  };
};

const buildExperience = async (items) => {
  const position = await ask("Job title", { required: true });
  const company = await ask("Company or organization", { required: true });
  const id = uniqueId(`${company}-${position}`, items);
  const location = await ask("Location");
  const startDate = await askMonth("Start date", { required: true });
  const currentlyWorking = await askBoolean("Is this a current role?", false);
  const endDate = currentlyWorking ? "" : await askMonth("End date", { required: true });
  const description = await ask("Short description");
  const responsibilities = await askList("Responsibilities or achievements");
  const technologies = await askList("Technologies");
  const typeLabel = await ask("Type label", { defaultValue: "Experience" });
  const published = await askBoolean("Publish this experience now?", true);

  return {
    id,
    position,
    company,
    location,
    startDate,
    endDate,
    currentlyWorking,
    description,
    responsibilities,
    technologies,
    type: typeLabel,
    icon: "fa-solid fa-briefcase",
    published,
    order: nextOrder(items)
  };
};

const buildCertificate = async (items) => {
  const title = await ask("Certificate title", { required: true });
  const issuer = await ask("Issuer", { required: true });
  const id = uniqueId(`${issuer}-${title}`, items);
  const issueDate = await askMonth("Issue date", { required: true });
  const credentialUrl = await askUrl("Credential URL");
  const sourceImage = await ask("Local certificate image path or existing /uploads/ path");
  const category = await ask("Category");
  const status = await ask("Status", { defaultValue: "Verified credential" });
  const published = await askBoolean("Publish this certificate now?", true);
  const image = await handleMedia(sourceImage, "certificates", id);

  return {
    id,
    title,
    issuer,
    issueDate,
    credentialUrl,
    image,
    category,
    status,
    published,
    order: nextOrder(items)
  };
};

try {
  const content = await loadContent();
  const configuration = {
    project: {
      file: CONTENT_FILES.projects,
      items: content.projects,
      build: buildProject,
      apply: (draft, items) => {
        draft.projects = items;
      }
    },
    experience: {
      file: CONTENT_FILES.experience,
      items: content.experience,
      build: buildExperience,
      apply: (draft, items) => {
        draft.experience = items;
      }
    },
    certificate: {
      file: CONTENT_FILES.certificates,
      items: content.certificates,
      build: buildCertificate,
      apply: (draft, items) => {
        draft.certificates = items;
      }
    }
  }[type];

  console.log(`\nAdd ${type}\n`);
  const entry = await configuration.build(configuration.items);
  const updatedItems = [...configuration.items, entry];
  const draft = structuredClone(content);
  configuration.apply(draft, updatedItems);
  const validation = await validateContent(draft);

  if (validation.errors.length) {
    console.error("The new entry was not saved because validation found:");
    validation.errors.forEach((issue) => {
      console.error(`- ${issue.file} ${issue.location}: ${issue.message}`);
    });
    process.exitCode = 1;
  } else {
    const written = await writeContentFileSafely(configuration.file, updatedItems);
    await generateBrowserData();
    console.log(`\nAdded ${type} "${entry.id}" successfully.`);
    console.log(`Updated: ${written.target}`);
    console.log(`Backup: ${written.backup}`);
  }
} catch (error) {
  console.error(`Could not add ${type}: ${error.message}`);
  process.exitCode = 1;
} finally {
  terminal.close();
}
