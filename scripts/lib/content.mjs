import {
  access,
  copyFile,
  mkdir,
  readFile,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CONTENT_DIR = path.join(ROOT_DIR, "content");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const GENERATED_DATA_FILE = path.join(ROOT_DIR, "js", "portfolio-data.generated.js");

export const CONTENT_FILES = {
  profile: "profile.json",
  navigation: "navigation.json",
  about: "about.json",
  story: "story.json",
  skills: "skills.json",
  experience: "experience.json",
  projects: "projects.json",
  learning: "learning.json",
  education: "education.json",
  certificates: "certificates.json",
  achievements: "achievements.json",
  blog: "blog.json",
  socials: "social-links.json",
  settings: "settings.json"
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const SOCIAL_ICONS = {
  github: "fa-brands fa-github",
  linkedin: "fa-brands fa-linkedin",
  telegram: "fa-brands fa-telegram",
  email: "fa-solid fa-envelope",
  link: "fa-solid fa-link"
};

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const asArray = (value) => (Array.isArray(value) ? value : []);
const asString = (value, fallback = "") => (typeof value === "string" ? value.trim() : fallback);
const asBoolean = (value, fallback = false) => (typeof value === "boolean" ? value : fallback);
const asOrder = (value, fallback = Number.MAX_SAFE_INTEGER) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

/**
 * @typedef {object} ValidationIssue
 * @property {string} file
 * @property {string} location
 * @property {string} message
 * @property {"error"|"warning"} level
 */

export const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";

export const sortPublished = (items, options = {}) => {
  const { visibilityKey = "published", orderKey = "order" } = options;

  return asArray(items)
    .filter((item) => isObject(item) && item[visibilityKey] !== false)
    .sort((left, right) => {
      const orderDifference = asOrder(left[orderKey]) - asOrder(right[orderKey]);
      if (orderDifference !== 0) return orderDifference;
      return asString(left.id).localeCompare(asString(right.id));
    });
};

export const countCompletedProjects = (projects) =>
  asArray(projects).filter((project) => {
    const status = asString(project?.status).toLowerCase();
    const excluded = /draft|planned|future|coming soon|in progress|currently developing|verify/.test(status);

    return !excluded && /completed|published/.test(status);
  }).length;

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asString(value));

export const isValidExternalUrl = (value, options = {}) => {
  const { allowMailto = false } = options;
  const text = asString(value);
  if (!text) return false;

  try {
    const url = new URL(text);
    if (url.protocol === "mailto:") {
      return allowMailto && isValidEmail(url.pathname);
    }
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch (error) {
    return false;
  }
};

export const isPlaceholderValue = (value) =>
  /YOUR_|REPLACE_|EXAMPLE|PLACEHOLDER/i.test(asString(value));

export const isValidMonth = (value, allowEmpty = true) => {
  const text = asString(value);
  if (!text) return allowEmpty;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) return false;
  return true;
};

export const isValidYear = (value, allowEmpty = true) => {
  const text = asString(value);
  if (!text) return allowEmpty;
  return /^(19|20)\d{2}$/.test(text);
};

export const formatMonth = (value) => {
  const text = asString(value);
  if (!isValidMonth(text, false)) return text;
  const [year, month] = text.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
};

export const formatDateRange = (startDate, endDate, current) => {
  const start = formatMonth(startDate);
  const end = current ? "Present" : formatMonth(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "Date not added";
};

export const formatEducationRange = (startYear, endYear, current) => {
  const start = asString(startYear);
  const end = current ? "Present" : asString(endYear);
  if (start && end) return `${start} - ${end}`;
  if (current) return start ? `${start} - Present` : "Current";
  return start || end || "Dates not added";
};

const publicPathToFile = (urlPath) => {
  const normalized = asString(urlPath).replace(/\\/g, "/");
  if (!normalized) return null;
  if (normalized.startsWith("/uploads/")) {
    return path.join(PUBLIC_DIR, normalized.slice(1));
  }
  if (normalized.startsWith("/assets/")) {
    return path.join(ROOT_DIR, normalized.slice(1));
  }
  if (normalized.startsWith("assets/")) {
    return path.join(ROOT_DIR, normalized);
  }
  return null;
};

export const mediaPathExists = async (urlPath) => {
  const filePath = publicPathToFile(urlPath);
  if (!filePath) return false;
  try {
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

export const parseJsonText = (text, fileName = "JSON file") => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${fileName} contains malformed JSON: ${error.message}`);
  }
};

export const readJsonFile = async (fileName) => {
  const filePath = path.join(CONTENT_DIR, fileName);
  try {
    return parseJsonText(await readFile(filePath, "utf8"), fileName);
  } catch (error) {
    if (/contains malformed JSON/.test(error.message)) throw error;
    throw new Error(`Could not read ${fileName}: ${error.message}`);
  }
};

export const loadContent = async () => {
  const entries = await Promise.all(
    Object.entries(CONTENT_FILES).map(async ([key, fileName]) => [key, await readJsonFile(fileName)])
  );
  return Object.fromEntries(entries);
};

const addIssue = (issues, file, location, message, level = "error") => {
  issues.push({ file, location, message, level });
};

const validateCollectionShape = (issues, file, items, requiredFields, options = {}) => {
  const { orderGroup = () => "all" } = options;
  if (!Array.isArray(items)) {
    addIssue(issues, file, "root", "Expected a JSON array.");
    return;
  }

  const ids = new Map();
  const orders = new Map();

  items.forEach((item, index) => {
    const location = `[${index}]`;
    if (!isObject(item)) {
      addIssue(issues, file, location, "Each entry must be a JSON object.");
      return;
    }

    requiredFields.forEach((field) => {
      if (!asString(item[field])) {
        addIssue(issues, file, `${location}.${field}`, `Add a non-empty "${field}" value.`);
      }
    });

    const id = asString(item.id);
    if (id) {
      if (ids.has(id)) {
        addIssue(issues, file, `${location}.id`, `Duplicate id "${id}" also used at ${ids.get(id)}.`);
      } else {
        ids.set(id, location);
      }
    }

    if (!Number.isInteger(item.order) || item.order < 1) {
      addIssue(issues, file, `${location}.order`, "Order must be a positive whole number.");
    } else {
      const group = orderGroup(item);
      const key = `${group}:${item.order}`;
      if (orders.has(key)) {
        addIssue(
          issues,
          file,
          `${location}.order`,
          `Duplicate order ${item.order} in ${group}; it is also used at ${orders.get(key)}.`
        );
      } else {
        orders.set(key, location);
      }
    }

    if (typeof item.published !== "boolean" && typeof item.enabled !== "boolean") {
      addIssue(
        issues,
        file,
        location,
        "Add a boolean published or enabled field so the entry can be shown or hidden."
      );
    }
  });
};

const validateMediaPath = async (issues, file, location, value, options = {}) => {
  const { required = false } = options;
  const mediaPath = asString(value);
  if (!mediaPath) {
    if (required) addIssue(issues, file, location, "Add a public image or file path.");
    return;
  }

  if (!publicPathToFile(mediaPath)) {
    addIssue(
      issues,
      file,
      location,
      "Use a path beginning with /uploads/ or /assets/."
    );
    return;
  }

  if (!(await mediaPathExists(mediaPath))) {
    addIssue(
      issues,
      file,
      location,
      `The file "${mediaPath}" does not exist. Add it or leave the optional path empty.`
    );
  }
};

export const validateContent = async (content, options = {}) => {
  const { checkFiles = true } = options;
  const issues = [];
  const profile = content.profile;

  if (!isObject(profile)) {
    addIssue(issues, CONTENT_FILES.profile, "root", "Expected a JSON object.");
  } else {
    ["name", "professionalTitle", "shortIntroduction", "location", "email"].forEach((field) => {
      if (!asString(profile[field])) {
        addIssue(issues, CONTENT_FILES.profile, field, `Add a non-empty "${field}" value.`);
      }
    });
    if (!isValidEmail(profile.email)) {
      addIssue(issues, CONTENT_FILES.profile, "email", "Enter a valid email address.");
    }
    if (checkFiles) {
      await validateMediaPath(issues, CONTENT_FILES.profile, "profileImage", profile.profileImage, {
        required: true
      });
      await validateMediaPath(issues, CONTENT_FILES.profile, "resumeFile", profile.resumeFile, {
        required: true
      });
      if (profile.profileThumbnail) {
        await validateMediaPath(
          issues,
          CONTENT_FILES.profile,
          "profileThumbnail",
          profile.profileThumbnail
        );
      }
    }
  }

  validateCollectionShape(issues, CONTENT_FILES.navigation, content.navigation, ["id", "label", "target"]);
  validateCollectionShape(
    issues,
    CONTENT_FILES.story,
    content.story,
    ["id", "text"]
  );
  validateCollectionShape(
    issues,
    CONTENT_FILES.skills,
    content.skills,
    ["id", "name", "category", "status"],
    { orderGroup: (item) => `category "${asString(item.category, "unknown")}"` }
  );
  validateCollectionShape(
    issues,
    CONTENT_FILES.experience,
    content.experience,
    ["id", "position", "company", "startDate"]
  );
  validateCollectionShape(
    issues,
    CONTENT_FILES.projects,
    content.projects,
    ["id", "title", "shortDescription"]
  );
  validateCollectionShape(
    issues,
    CONTENT_FILES.certificates,
    content.certificates,
    ["id", "title", "issuer", "issueDate"]
  );
  validateCollectionShape(issues, CONTENT_FILES.blog, content.blog, ["id", "title"]);
  validateCollectionShape(issues, CONTENT_FILES.socials, content.socials, ["id", "name"]);

  asArray(content.skills).forEach((item, index) => {
    if (!Number.isInteger(item.categoryOrder) || item.categoryOrder < 1) {
      addIssue(
        issues,
        CONTENT_FILES.skills,
        `[${index}].categoryOrder`,
        "Category order must be a positive whole number."
      );
    }
  });

  asArray(content.experience).forEach((item, index) => {
    if (!isValidMonth(item.startDate, false)) {
      addIssue(
        issues,
        CONTENT_FILES.experience,
        `[${index}].startDate`,
        "Use YYYY-MM, for example 2025-01."
      );
    }
    if (!isValidMonth(item.endDate, true)) {
      addIssue(
        issues,
        CONTENT_FILES.experience,
        `[${index}].endDate`,
        "Use YYYY-MM or leave it empty."
      );
    }
    if (!item.currentlyWorking && !asString(item.endDate)) {
      addIssue(
        issues,
        CONTENT_FILES.experience,
        `[${index}].endDate`,
        "Add an end date or set currentlyWorking to true."
      );
    }
    if (!Array.isArray(item.responsibilities) || !Array.isArray(item.technologies)) {
      addIssue(
        issues,
        CONTENT_FILES.experience,
        `[${index}]`,
        "Responsibilities and technologies must both be JSON arrays."
      );
    }
  });

  for (const [index, item] of asArray(content.projects).entries()) {
    if (!Array.isArray(item.technologies) || !Array.isArray(item.categories)) {
      addIssue(
        issues,
        CONTENT_FILES.projects,
        `[${index}]`,
        "Technologies and categories must both be JSON arrays."
      );
    }
    for (const [field, value] of [
      ["liveUrl", item.liveUrl],
      ["githubUrl", item.githubUrl]
    ]) {
      if (asString(value) && !isValidExternalUrl(value)) {
        addIssue(
          issues,
          CONTENT_FILES.projects,
          `[${index}].${field}`,
          "Use a complete http:// or https:// URL, or leave it empty."
        );
      }
    }
    if (checkFiles && asString(item.image)) {
      await validateMediaPath(issues, CONTENT_FILES.projects, `[${index}].image`, item.image);
    }
  }

  const education = isObject(content.education) ? content.education : {};
  validateCollectionShape(
    issues,
    `${CONTENT_FILES.education}#education`,
    education.education,
    ["id", "institution", "qualification"]
  );
  validateCollectionShape(
    issues,
    `${CONTENT_FILES.education}#training`,
    education.training,
    ["id", "title", "organization"]
  );
  asArray(education.education).forEach((item, index) => {
    if (!isValidYear(item.startYear, true) || !isValidYear(item.endYear, true)) {
      addIssue(
        issues,
        CONTENT_FILES.education,
        `education[${index}]`,
        "Use four-digit years, such as 2025, or leave an unknown year empty."
      );
    }
  });

  for (const [index, item] of asArray(content.certificates).entries()) {
    if (!isValidMonth(item.issueDate, false)) {
      addIssue(
        issues,
        CONTENT_FILES.certificates,
        `[${index}].issueDate`,
        "Use YYYY-MM, for example 2026-01."
      );
    }
    if (asString(item.credentialUrl) && !isValidExternalUrl(item.credentialUrl)) {
      addIssue(
        issues,
        CONTENT_FILES.certificates,
        `[${index}].credentialUrl`,
        "Use a complete http:// or https:// URL, or leave it empty."
      );
    }
    if (checkFiles && asString(item.image)) {
      await validateMediaPath(issues, CONTENT_FILES.certificates, `[${index}].image`, item.image);
    }
  }

  asArray(content.socials).forEach((item, index) => {
    if (!item.enabled) return;
    if (item.profileField === "email") return;
    if (!isValidExternalUrl(item.url, { allowMailto: true }) || isPlaceholderValue(item.url)) {
      addIssue(
        issues,
        CONTENT_FILES.socials,
        `[${index}].url`,
        "Enable only a real http(s) or mailto URL. Disable placeholder links."
      );
    }
  });

  const settings = content.settings;
  if (!isObject(settings)) {
    addIssue(issues, CONTENT_FILES.settings, "root", "Expected a JSON object.");
  } else {
    const endpoint = asString(settings.formspreeEndpoint);
    if (!isValidExternalUrl(endpoint)) {
      addIssue(
        issues,
        CONTENT_FILES.settings,
        "formspreeEndpoint",
        "Use a complete Formspree URL."
      );
    } else if (isPlaceholderValue(endpoint)) {
      addIssue(
        issues,
        CONTENT_FILES.settings,
        "formspreeEndpoint",
        "Replace YOUR_FORMSPREE_ID before expecting real message delivery.",
        "warning"
      );
    }
  }

  if (!asArray(content.certificates).length) {
    addIssue(
      issues,
      CONTENT_FILES.certificates,
      "root",
      "No certificates are published; the website will show its friendly empty state.",
      "warning"
    );
  }

  return {
    errors: issues.filter((issue) => issue.level === "error"),
    warnings: issues.filter((issue) => issue.level === "warning"),
    issues
  };
};

const mapMedia = async (value) => {
  const mediaPath = asString(value);
  if (!mediaPath || !(await mediaPathExists(mediaPath))) {
    return { path: "", available: false };
  }
  return { path: mediaPath, available: true };
};

export const buildPortfolioData = async (content) => {
  const profile = isObject(content.profile) ? content.profile : {};
  const settings = isObject(content.settings) ? content.settings : {};
  const about = isObject(content.about) ? content.about : {};
  const learning = isObject(content.learning) ? content.learning : {};
  const educationContent = isObject(content.education) ? content.education : {};
  const achievementsContent = isObject(content.achievements) ? content.achievements : {};
  const profileImage = await mapMedia(profile.profileImage);
  const profileThumbnail = await mapMedia(profile.profileThumbnail);
  const resume = await mapMedia(profile.resumeFile);

  const navigation = asArray(content.navigation)
    .filter((item) => isObject(item) && item.enabled !== false)
    .sort((left, right) => asOrder(left.order) - asOrder(right.order))
    .map((item) => ({ label: asString(item.label), target: asString(item.target) }))
    .filter((item) => item.label && item.target);

  const skillGroups = new Map();
  asArray(content.skills)
    .filter((item) => isObject(item) && item.published !== false && asString(item.name))
    .sort((left, right) => {
      const categoryDifference = asOrder(left.categoryOrder) - asOrder(right.categoryOrder);
      if (categoryDifference !== 0) return categoryDifference;
      return asOrder(left.order) - asOrder(right.order);
    })
    .forEach((item) => {
      const category = asString(item.category, "Other Skills");
      if (!skillGroups.has(category)) {
        skillGroups.set(category, {
          category,
          icon: asString(item.categoryIcon, "fa-solid fa-code"),
          items: []
        });
      }
      skillGroups.get(category).items.push({
        id: asString(item.id),
        name: asString(item.name),
        status: asString(item.status, "Status not added"),
        icon: asString(item.icon)
      });
    });

  const projects = await Promise.all(
    sortPublished(content.projects).map(async (item) => {
      const image = await mapMedia(item.image);
      const videos = await Promise.all(
        asArray(item.videos).map(async (video) => {
          const source = isObject(video) ? asString(video.src) : asString(video);
          const media = await mapMedia(source);
          return {
            src: media.path,
            available: media.available,
            label: isObject(video) ? asString(video.label) : "Demonstration video"
          };
        })
      );
      return {
        id: asString(item.id),
        title: asString(item.title, "Untitled project"),
        status: asString(item.status, "Status not added"),
        category: asArray(item.categories).map((value) => asString(value)).filter(Boolean),
        image: image.path,
        imageAvailable: image.available,
        cardCoverStyle: asString(item.cardCoverStyle),
        coverTitle: asString(item.coverTitle),
        coverSubtitle: asString(item.coverSubtitle),
        coverTags: asArray(item.coverTags).map((value) => asString(value)).filter(Boolean),
        description: asString(item.shortDescription),
        fullDescription: asString(item.fullDescription) || asString(item.shortDescription),
        technologies: asArray(item.technologies).map((value) => asString(value)).filter(Boolean),
        outcomes: asArray(item.learningOutcomes).map((value) => asString(value)).filter(Boolean),
        features: asArray(item.features).map((value) => asString(value)).filter(Boolean),
        overview: asString(item.overview),
        howItWorks: asString(item.howItWorks),
        componentsUsed: asArray(item.componentsUsed).map((value) => asString(value)).filter(Boolean),
        studentLearning: asArray(item.studentLearning).map((value) => asString(value)).filter(Boolean),
        videos: videos.filter((video) => video.available),
        showVideoButton: asBoolean(item.showVideoButton),
        github: isValidExternalUrl(item.githubUrl) ? asString(item.githubUrl) : "",
        demo: isValidExternalUrl(item.liveUrl) ? asString(item.liveUrl) : "",
        featured: asBoolean(item.featured),
        order: asOrder(item.order)
      };
    })
  );

  const certificates = await Promise.all(
    sortPublished(content.certificates).map(async (item) => {
      const image = await mapMedia(item.image);
      return {
        id: asString(item.id),
        title: asString(item.title, "Untitled certificate"),
        issuer: asString(item.issuer),
        date: formatMonth(item.issueDate),
        category: asString(item.category),
        image: image.path,
        imageAvailable: image.available,
        credentialUrl: isValidExternalUrl(item.credentialUrl) ? asString(item.credentialUrl) : "",
        status: asString(item.status)
      };
    })
  );

  const socials = asArray(content.socials)
    .filter((item) => isObject(item) && item.enabled === true)
    .sort((left, right) => asOrder(left.order) - asOrder(right.order))
    .map((item) => {
      const name = asString(item.name, "Social link");
      const profileEmail = item.profileField === "email" ? asString(profile.email) : "";
      const url = profileEmail ? `mailto:${profileEmail}` : asString(item.url);
      const external = /^https?:/i.test(url);
      const valid = isValidExternalUrl(url, { allowMailto: true }) && !isPlaceholderValue(url);
      return {
        id: asString(item.id),
        label: name,
        title: asString(item.title) || name,
        icon: SOCIAL_ICONS[asString(item.icon).toLowerCase()] || SOCIAL_ICONS.link,
        url: valid ? url : "",
        external,
        ariaLabel:
          asString(item.ariaLabel) ||
          (profileEmail ? `Email ${asString(profile.name)}` : `Open ${name} in a new tab`)
      };
    })
    .filter((item) => item.url);

  const projectFilters = [
    "All",
    ...asArray(settings.projectFilters).map((value) => asString(value)).filter((value) => value && value !== "All")
  ];
  projects.forEach((project) => {
    project.category.forEach((category) => {
      if (category && !projectFilters.includes(category)) projectFilters.push(category);
    });
  });

  const seoDescription = `Portfolio of ${asString(profile.name)}, ${asString(
    profile.professionalTitle
  )} from ${asString(profile.location)}.`;

  return {
    personal: {
      name: asString(profile.name, "Portfolio owner"),
      displayName: asString(profile.displayName) || asString(profile.name).toUpperCase(),
      location: asString(profile.location),
      email: asString(profile.email),
      phone: asString(profile.phone),
      title: asString(profile.professionalTitle),
      tagline: asString(profile.tagline),
      mission: asString(profile.mission),
      intro: asString(profile.shortIntroduction),
      profilePhoto: profileImage.path,
      profilePhotoAvailable: profileImage.available,
      profileThumb: profileThumbnail.path,
      resume: resume.path,
      resumeAvailable: resume.available,
      availableForWork: asBoolean(profile.availableForWork)
    },
    seo: {
      title: `${asString(profile.name)} | ${asString(profile.professionalTitle)}`,
      description: seoDescription
    },
    navigation,
    heroRoles: asArray(profile.heroRoles).map((value) => asString(value)).filter(Boolean),
    heroBadges: asArray(profile.heroBadges).filter(isObject),
    about: asArray(about.paragraphs).map((value) => asString(value)).filter(Boolean),
    infoItems: sortPublished(about.information).map((item) => ({
      label: asString(item.label),
      value: item.valueFromProfile ? asString(profile[item.valueFromProfile]) : asString(item.value),
      icon: asString(item.icon, "fa-solid fa-circle-info")
    })),
    professionalSnapshot: {
      title: asString(about.statisticsTitle, "Professional Snapshot"),
      subtitle: asString(
        about.statisticsSubtitle,
        "Key facts about my academic background, technical learning, and practical experience."
      ),
      completedProjectCount: countCompletedProjects(projects)
    },
    stats: sortPublished(about.statistics).map((item) => ({
      label: asString(item.label),
      value: item.value ?? "",
      valueSource: asString(item.valueSource),
      suffix: asString(item.suffix),
      note: asString(item.note),
      icon: asString(item.icon, "fa-solid fa-chart-line")
    })),
    story: sortPublished(content.story).map((item) => asString(item.text)).filter(Boolean),
    skills: Array.from(skillGroups.values()),
    experience: sortPublished(content.experience).map((item) => ({
      id: asString(item.id),
      role: asString(item.position, "Position not added"),
      organization: asString(item.company, "Organization not added"),
      location: asString(item.location),
      period: formatDateRange(item.startDate, item.endDate, item.currentlyWorking),
      icon: asString(item.icon, "fa-solid fa-briefcase"),
      type: asString(item.type, "Experience"),
      description: asString(item.description),
      responsibilities: asArray(item.responsibilities).map((value) => asString(value)).filter(Boolean),
      technologies: asArray(item.technologies).map((value) => asString(value)).filter(Boolean)
    })),
    projectFilters: [...new Set(projectFilters)],
    projects,
    learningRoadmap: sortPublished(learning.roadmap).map((item) => ({
      stage: asString(item.stage),
      icon: asString(item.icon, "fa-solid fa-route"),
      items: asArray(item.items).filter(isObject)
    })),
    languages: sortPublished(learning.languages).map((item) => ({
      name: asString(item.name),
      status: asString(item.status),
      description: asString(item.description)
    })),
    education: sortPublished(educationContent.education).map((item) => ({
      id: asString(item.id),
      school: asString(item.institution),
      program: asString(item.qualification),
      period: asString(item.displayPeriod) || formatEducationRange(item.startYear, item.endYear, item.currentlyStudying),
      status: asString(item.status),
      description: asString(item.description),
      details: asArray(item.details).map((value) => asString(value)).filter(Boolean)
    })),
    training: sortPublished(educationContent.training).map((item) => ({
      id: asString(item.id),
      title: asString(item.title),
      organization: asString(item.organization),
      period: asString(item.period),
      details: asString(item.description)
    })),
    certificates,
    achievements: sortPublished(achievementsContent.achievements),
    signals: sortPublished(achievementsContent.activityPlaceholders),
    blog: sortPublished(content.blog),
    contactForm: {
      endpoint: asString(settings.formspreeEndpoint)
    },
    socials,
    contactCards: [
      {
        label: "Email",
        value: asString(profile.email),
        icon: "fa-solid fa-envelope",
        action: "copy-email"
      },
      {
        label: "Location",
        value: asString(profile.location),
        icon: "fa-solid fa-location-dot"
      },
      {
        label: "Availability",
        value: asString(settings.contactAvailability),
        icon: "fa-solid fa-briefcase"
      },
      {
        label: "Resume",
        value: resume.available ? "Download PDF" : "Resume not added",
        icon: "fa-solid fa-file-arrow-down",
        url: resume.path
      }
    ].filter((item) => item.value),
    emptyStates: isObject(settings.emptyStates) ? settings.emptyStates : {},
    testimonials: []
  };
};

export const writeGeneratedData = async (portfolioData, outputFile = GENERATED_DATA_FILE) => {
  const banner = "/* Generated from content/*.json by npm run sync-content. Do not edit this file directly. */";
  const output = `${banner}\nwindow.portfolioData = ${JSON.stringify(portfolioData, null, 2)};\n`;
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, output, "utf8");
  return outputFile;
};

export const generateBrowserData = async () => {
  const content = await loadContent();
  const validation = await validateContent(content);
  if (validation.errors.length) {
    const details = validation.errors
      .map((issue) => `${issue.file} ${issue.location}: ${issue.message}`)
      .join("\n");
    throw new Error(`Content validation failed:\n${details}`);
  }
  const portfolioData = await buildPortfolioData(content);
  const outputFile = await writeGeneratedData(portfolioData);
  return { content, portfolioData, validation, outputFile };
};

export const writeContentFileSafely = async (fileName, value) => {
  const target = path.join(CONTENT_DIR, fileName);
  const backupDir = path.join(CONTENT_DIR, "backups");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(backupDir, `${fileName}.${stamp}.bak`);
  const temporary = `${target}.${process.pid}.tmp`;
  const original = await readFile(target);

  await mkdir(backupDir, { recursive: true });
  await writeFile(backup, original);

  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await copyFile(temporary, target);
  } catch (error) {
    await copyFile(backup, target);
    throw new Error(`Writing ${fileName} failed, so the original file was restored: ${error.message}`);
  } finally {
    await unlink(temporary).catch(() => {});
  }

  return { target, backup };
};

export const prepareMediaCopy = async (sourcePath, mediaType, slug) => {
  const source = path.resolve(asString(sourcePath));
  const extension = path.extname(source).toLowerCase();
  const allowed = mediaType === "resume" ? [".pdf"] : [".jpg", ".jpeg", ".png", ".webp"];
  if (!allowed.includes(extension)) {
    throw new Error(`Use one of these file types: ${allowed.join(", ")}.`);
  }
  await access(source);

  const directory = path.join(PUBLIC_DIR, "uploads", mediaType);
  const fileName = `${slugify(slug)}${extension}`;
  const destination = path.join(directory, fileName);
  let destinationExists = true;
  try {
    await access(destination);
  } catch (error) {
    destinationExists = false;
  }

  return {
    source,
    directory,
    destination,
    destinationExists,
    publicPath: `/uploads/${mediaType}/${fileName}`
  };
};

export const copyPreparedMedia = async (prepared) => {
  await mkdir(prepared.directory, { recursive: true });
  await copyFile(prepared.source, prepared.destination);
  return prepared.publicPath;
};
