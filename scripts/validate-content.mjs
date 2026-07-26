import { loadContent, validateContent } from "./lib/content.mjs";

try {
  const content = await loadContent();
  const result = await validateContent(content);

  result.issues.forEach((issue) => {
    const label = issue.level === "error" ? "ERROR" : "WARNING";
    console.log(`${label} ${issue.file} ${issue.location}: ${issue.message}`);
  });

  if (result.errors.length) {
    console.error(`\nContent validation failed with ${result.errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    console.log(`\nContent validation passed with ${result.warnings.length} warning(s).`);
  }
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
