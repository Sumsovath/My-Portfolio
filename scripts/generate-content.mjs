import { generateBrowserData } from "./lib/content.mjs";

try {
  const result = await generateBrowserData();
  console.log(`Generated browser data: ${result.outputFile}`);
  result.validation.warnings.forEach((issue) => {
    console.warn(`Warning: ${issue.file} ${issue.location}: ${issue.message}`);
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
