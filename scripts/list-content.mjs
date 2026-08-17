import { loadContent } from "./lib/content.mjs";

const summarize = (label, items, visibilityKey = "published") => {
  const list = Array.isArray(items) ? items : [];
  const visible = list.filter((item) => item?.[visibilityKey] !== false).length;
  console.log(`${label.padEnd(18)} ${String(visible).padStart(2)} visible / ${String(list.length).padStart(2)} total`);
};

try {
  const content = await loadContent();
  console.log(`Portfolio owner: ${content.profile.name}`);
  console.log(`Content folder: content/\n`);
  summarize("Navigation", content.navigation, "enabled");
  summarize("Experience", content.experience);
  summarize("Skills", content.skills);
  summarize("Projects", content.projects);
  summarize("Education", content.education.education);
  summarize("Training", content.education.training);
  summarize("Certificates", content.certificates);
  summarize("Social links", content.socials, "enabled");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
