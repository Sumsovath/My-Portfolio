import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPortfolioData,
  countCompletedProjects,
  formatDateRange,
  isValidExternalUrl,
  loadContent,
  parseJsonText,
  sortPublished,
  validateContent
} from "../scripts/lib/content.mjs";

test("malformed JSON produces a beginner-readable error", () => {
  assert.throws(
    () => parseJsonText('[{"id":"broken",}]', "projects.json"),
    /projects\.json contains malformed JSON/
  );
});

test("sortPublished hides unpublished entries and respects order", () => {
  const result = sortPublished([
    { id: "third", published: true, order: 3 },
    { id: "hidden", published: false, order: 1 },
    { id: "first", published: true, order: 1 }
  ]);
  assert.deepEqual(
    result.map((item) => item.id),
    ["first", "third"]
  );
});

test("external URL validation rejects unsafe protocols and credentials", () => {
  assert.equal(isValidExternalUrl("https://github.com/Sumsovath"), true);
  assert.equal(isValidExternalUrl("javascript:alert(1)"), false);
  assert.equal(isValidExternalUrl("https://user:password@example.com"), false);
  assert.equal(isValidExternalUrl("mailto:sumsovath99@gmail.com", { allowMailto: true }), true);
});

test("experience date ranges show Present for current roles", () => {
  assert.equal(formatDateRange("2025-07", "", true), "July 2025 - Present");
  assert.equal(formatDateRange("2024-01", "2024-08", false), "January 2024 - August 2024");
});

test("the checked-in content passes required validation", async () => {
  const content = await loadContent();
  const result = await validateContent(content);
  assert.deepEqual(result.errors, []);
});

test("generated data handles hidden entries and a missing optional image", async () => {
  const content = structuredClone(await loadContent());
  content.projects[0].image = "";
  content.projects[1].published = false;
  const data = await buildPortfolioData(content);

  assert.equal(data.projects.length, content.projects.length - 1);
  const studentInfoApi = data.projects.find((project) => project.id === "student-information-rest-api");
  assert.equal(studentInfoApi.image, "");
  assert.equal(studentInfoApi.imageAvailable, false);
});

test("completed-project count excludes learning, planned, and developing work", async () => {
  const content = await loadContent();
  const data = await buildPortfolioData(content);

  assert.equal(countCompletedProjects(data.projects), 4);
  assert.equal(data.professionalSnapshot.completedProjectCount, 4);
});

test("education supports a verified display period and an optional status", async () => {
  const content = await loadContent();
  const data = await buildPortfolioData(content);
  const royalUniversity = data.education.find((item) => item.id === "royal-university-of-phnom-penh");

  assert.equal(royalUniversity.period, "2021–2025");
  assert.equal(royalUniversity.status, "");
  assert.deepEqual(royalUniversity.details, ["GPA: 3.5 / 4.0"]);
});

test("organized project media is available for the related project modals", async () => {
  const content = await loadContent();
  const data = await buildPortfolioData(content);
  const conveyor = data.projects.find((item) => item.id === "automated-conveyor-pickup-system");
  const bluetooth = data.projects.find((item) => item.id === "bluetooth-robot-car");
  const touchless = data.projects.find((item) => item.id === "touchless-hand-washing-system");
  const ultrasonic = data.projects.find((item) => item.id === "ultrasonic-distance-detection-system");

  assert.deepEqual(conveyor.videos.map((video) => video.src), [
    "/uploads/projects/automated-conveyor-pickup-system/demo.mp4"
  ]);
  assert.equal(conveyor.image, "/uploads/projects/automated-conveyor-pickup-system/cover.jpg");
  assert.equal(conveyor.imageAvailable, true);
  assert.equal(conveyor.cardCoverStyle, "robotics");
  assert.deepEqual(conveyor.coverTags, ["Arduino", "Sensors", "Learning"]);
  assert.equal(conveyor.showVideoButton, true);
  assert.equal(conveyor.coverTitle, "Automated Conveyor Pickup");
  assert.deepEqual(
    data.projects.slice(0, 3).map((project) => project.id),
    ["bluetooth-robot-car", "touchless-hand-washing-system", "automated-conveyor-pickup-system"]
  );
  assert.equal(data.projects.filter((project) => project.featured).length, 4);
  assert.equal(bluetooth.image, "/uploads/projects/bluetooth-robot-car/cover.jpg");
  assert.equal(bluetooth.videos.length, 2);
  assert.equal(bluetooth.showVideoButton, true);
  assert.equal(touchless.image, "/uploads/projects/touchless-hand-washing-system/cover.jpg");
  assert.equal(touchless.videos.length, 2);
  assert.equal(touchless.showVideoButton, true);
  assert.equal(ultrasonic.title, "Ultrasonic Robot Car Control System");
  assert.equal(ultrasonic.showVideoButton, true);
  assert.deepEqual(ultrasonic.videos.map((video) => video.src), [
    "/uploads/projects/ultrasonic-robot-car/Distance-Based Speed Control.MOV",
    "/uploads/projects/ultrasonic-robot-car/Obstacle Avoidance.MOV"
  ]);
});

test("generated sections remain safe when editable collections are empty", async () => {
  const content = structuredClone(await loadContent());
  content.projects = [];
  content.experience = [];
  content.skills = [];
  content.certificates = [];
  content.education = { education: [], training: [] };
  const data = await buildPortfolioData(content);

  assert.deepEqual(data.projects, []);
  assert.deepEqual(data.experience, []);
  assert.deepEqual(data.skills, []);
  assert.deepEqual(data.certificates, []);
  assert.deepEqual(data.education, []);
});

test("validation reports duplicate IDs, orders, missing fields, dates, URLs, and media", async () => {
  const content = structuredClone(await loadContent());
  content.projects[1].id = content.projects[0].id;
  content.projects[1].order = content.projects[0].order;
  content.projects[1].title = "";
  content.projects[1].githubUrl = "github.com/missing-protocol";
  content.projects[1].image = "/uploads/projects/does-not-exist.jpg";
  content.experience[0].startDate = "July 2025";
  const result = await validateContent(content);
  const messages = result.errors.map((issue) => issue.message).join("\n");

  assert.match(messages, /Duplicate id/);
  assert.match(messages, /Duplicate order/);
  assert.match(messages, /non-empty "title"/);
  assert.match(messages, /complete http:\/\/ or https:\/\/ URL/);
  assert.match(messages, /does not exist/);
  assert.match(messages, /Use YYYY-MM/);
});
