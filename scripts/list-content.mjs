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
  summarize("Story items", content.story);
  summarize("Skills", content.skills);
  summarize("Experience", content.experience);
  summarize("Projects", content.projects);
  summarize("Education", content.education.education);
  summarize("Training", content.education.training);
  summarize("Certificates", content.certificates);
  summarize("Blog topics", content.blog);
  summarize("Social links", content.socials, "enabled");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
