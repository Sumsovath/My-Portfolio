(function () {
  const data = window.portfolioData || {};

  const byId = (id) => document.getElementById(id);
  const list = (value) => (Array.isArray(value) ? value : []);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const slug = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const icon = (className) => `<i class="${escapeHtml(className)}" aria-hidden="true"></i>`;

  const setHtml = (id, html) => {
    const element = byId(id);
    if (element) element.innerHTML = html;
  };

  const statusClass = (status) => `status-${slug(status)}`;

  const emptyState = (message, iconClass = "fa-solid fa-folder-open") => `
    <div class="content-empty" data-reveal>
      ${icon(iconClass)}
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  const mediaFallback = (label, iconClass) => `
    <div class="media-fallback" role="img" aria-label="${escapeHtml(label)}">
      ${icon(iconClass)}
      <span>Image coming soon</span>
    </div>
  `;

  const renderNavLinks = (targetId, className) => {
    setHtml(
      targetId,
      list(data.navigation)
        .map(
          (item) => `
            <li>
              <a class="${className}" href="#${escapeHtml(item.target)}" data-nav-link="${escapeHtml(item.target)}">
                ${escapeHtml(item.label)}
              </a>
            </li>
          `
        )
        .join("")
    );
  };

  const renderPersonalContent = () => {
    const intro = byId("heroIntro");
    const profilePhoto = byId("profilePhoto");
    const profileFallback = byId("profileFallback");
    const locationCard = byId("locationCard");
    const locationText = byId("profileLocation");
    const typedRole = byId("typedRole");

    document.title = data.seo?.title || `${data.personal.name} | Portfolio`;
    const metaValues = {
      metaDescription: data.seo?.description,
      openGraphTitle: data.seo?.title,
      openGraphDescription: data.seo?.description,
      twitterTitle: data.seo?.title,
      twitterDescription: data.seo?.description,
      metaKeywords: [
        data.personal.name,
        data.personal.title,
        data.personal.location,
        ...list(data.heroBadges).map((badge) => badge.label)
      ]
        .filter(Boolean)
        .join(", ")
    };

    Object.entries(metaValues).forEach(([id, value]) => {
      const element = byId(id);
      if (element && value) element.setAttribute("content", value);
    });

    document.querySelectorAll("[data-profile-name]").forEach((element) => {
      element.textContent = data.personal.name;
    });
    document.querySelectorAll("[data-profile-display-name]").forEach((element) => {
      element.textContent = data.personal.displayName;
    });
    document.querySelectorAll("[data-profile-title]").forEach((element) => {
      element.textContent = data.personal.title;
    });
    document.querySelectorAll(".brand-mark, .loader-mark").forEach((element) => {
      element.textContent = data.personal.name.trim().charAt(0).toUpperCase() || "P";
    });

    if (intro) intro.textContent = data.personal.intro;
    if (typedRole) typedRole.textContent = list(data.heroRoles)[0] || data.personal.title;
    if (locationText) locationText.textContent = data.personal.location || "Location not added";
    if (profileFallback) {
      profileFallback.setAttribute("aria-label", `Profile image for ${data.personal.name} not added`);
    }
    if (locationCard) {
      locationCard.setAttribute(
        "aria-label",
        data.personal.location ? `Location: ${data.personal.location}` : "Location not added"
      );
    }

    const showProfileFallback = () => {
      if (profilePhoto) profilePhoto.hidden = true;
      if (profileFallback) profileFallback.hidden = false;
    };

    if (profilePhoto && data.personal.profilePhotoAvailable && data.personal.profilePhoto) {
      profilePhoto.src = data.personal.profilePhoto;
      profilePhoto.alt = `Professional portrait of ${data.personal.name}`;
      profilePhoto.hidden = false;
      if (profileFallback) profileFallback.hidden = true;
      profilePhoto.addEventListener("error", showProfileFallback, { once: true });
    } else {
      showProfileFallback();
    }

    document.querySelectorAll(".resume-link").forEach((link) => {
      if (data.personal.resumeAvailable && data.personal.resume) {
        link.hidden = false;
        link.setAttribute("href", data.personal.resume);
      } else {
        link.hidden = true;
        link.removeAttribute("href");
      }
    });

    const structuredData = byId("personStructuredData");
    if (structuredData) {
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: data.personal.name,
        jobTitle: data.personal.title,
        address: {
          "@type": "PostalAddress",
          addressLocality: data.personal.location
        },
        email: `mailto:${data.personal.email}`,
        url: window.location.origin
      });
    }

    setHtml(
      "heroBadges",
      list(data.heroBadges)
        .map(
          (badge) => `
            <span class="hero-badge">
              ${icon(badge.icon)}
              ${escapeHtml(badge.label)}
            </span>
          `
        )
        .join("")
    );
  };

  const renderAbout = () => {
    setHtml(
      "aboutCopy",
      list(data.about).length
        ? list(data.about).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
        : emptyState("About information has not been added yet.", "fa-solid fa-user")
    );

    setHtml(
      "infoGrid",
      list(data.infoItems)
        .map(
          (item) => `
            <div class="info-item" data-reveal>
              <span class="info-icon">${icon(item.icon)}</span>
              <div>
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </div>
            </div>
          `
        )
        .join("")
    );

    const snapshot = data.professionalSnapshot || {};
    const completedProjectCount = Number(snapshot.completedProjectCount) || 0;
    const stats = list(data.stats).map((stat) => {
      const isProjectCount = stat.valueSource === "completedProjects";
      const value = isProjectCount ? String(completedProjectCount) : String(stat.value ?? "");
      const suffix = isProjectCount && completedProjectCount > 0 ? "+" : String(stat.suffix ?? "");
      const isAnimatable = /^\d+(?:\.\d+)?$/.test(value);

      return `
        <article class="stat-card" data-reveal>
          <span class="stat-icon">${icon(stat.icon)}</span>
          <strong class="stat-value${isAnimatable ? " counter" : ""}"${
            isAnimatable
              ? ` data-counter="${escapeHtml(value)}" data-suffix="${escapeHtml(suffix)}"`
              : ""
          }>${escapeHtml(value)}${escapeHtml(suffix)}</strong>
          <span class="stat-title">${escapeHtml(stat.label)}</span>
          <p class="stat-description">${escapeHtml(stat.note)}</p>
        </article>
      `;
    });

    setHtml(
      "statGrid",
      `
        <div class="professional-snapshot-heading">
          <h3 id="professionalSnapshotTitle">${escapeHtml(snapshot.title || "Professional Snapshot")}</h3>
          <p>${escapeHtml(
            snapshot.subtitle || "Key facts about my academic background, technical learning, and practical experience."
          )}</p>
        </div>
        <div class="stat-grid">${stats.join("")}</div>
      `
    );
  };

  const renderExperience = () => {
    if (!list(data.experience).length) {
      setHtml(
        "experienceTimeline",
        emptyState(data.emptyStates?.experience || "Experience details will be added here soon.", "fa-solid fa-briefcase")
      );
      return;
    }
    setHtml(
      "experienceTimeline",
      list(data.experience)
        .map(
          (item) => `
            <article class="experience-card" data-content-id="${escapeHtml(item.id)}" data-reveal>
              <div class="experience-top">
                <span class="card-icon">${icon(item.icon)}</span>
                <span class="status-chip">${escapeHtml(item.type)}</span>
              </div>
              <h3>${escapeHtml(item.role)}</h3>
              <p class="experience-org">${escapeHtml(item.organization)}</p>
              <p class="experience-meta">${[item.location, item.period].filter(Boolean).map(escapeHtml).join(" | ")}</p>
              ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
              ${
                list(item.responsibilities).length
                  ? `<ul>${list(item.responsibilities)
                      .map((text) => `<li>${escapeHtml(text)}</li>`)
                      .join("")}</ul>`
                  : ""
              }
              ${
                list(item.technologies).length
                  ? `<div class="tag-row">${list(item.technologies)
                      .map((tech) => `<span>${escapeHtml(tech)}</span>`)
                      .join("")}</div>`
                  : ""
              }
            </article>
          `
        )
        .join("")
    );
  };

  const renderSkills = () => {
    if (!list(data.skills).length) {
      setHtml("skillsGrid", emptyState("Skills will be added here soon.", "fa-solid fa-code"));
      return;
    }
    setHtml(
      "skillsGrid",
      list(data.skills)
        .map(
          (group) => `
            <article class="skill-card" data-reveal>
              <div class="card-heading">
                <span class="card-icon">${icon(group.icon)}</span>
                <h3>${escapeHtml(group.category)}</h3>
              </div>
              <div class="skill-list">
                ${list(group.items)
                  .map(
                    (skill) => `
                      <div class="skill-pill">
                        <span>${escapeHtml(skill.name)}</span>
                        <small class="${statusClass(skill.status)}">${escapeHtml(skill.status)}</small>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `
        )
        .join("")
    );
  };

  const actionButton = (url, label, iconClass) => {
    if (!url) return "";
    return `
      <a class="button button-ghost button-compact" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(
        `${label} (opens in a new tab)`
      )}">
        ${icon(iconClass)}
        ${escapeHtml(label)}
      </a>
    `;
  };

  const renderProjectFilters = () => {
    setHtml(
      "projectFilters",
      list(data.projectFilters)
        .map(
          (filter, index) => `
            <button class="filter-button ${index === 0 ? "is-active" : ""}" type="button" data-filter="${escapeHtml(filter)}" aria-pressed="${index === 0 ? "true" : "false"}">
              ${escapeHtml(filter)}
            </button>
          `
        )
        .join("")
    );
  };

  const renderProjects = () => {
    if (!list(data.projects).length) {
      setHtml(
        "projectsGrid",
        emptyState(data.emptyStates?.projects || "No published projects are available yet.", "fa-solid fa-diagram-project")
      );
      return;
    }
    setHtml(
      "projectsGrid",
      list(data.projects)
        .map(
          (project) => `
            <article class="project-card ${project.featured ? "is-featured" : ""}" data-project-card data-content-id="${escapeHtml(
              project.id
            )}" data-categories="${escapeHtml(list(project.category).join("|"))}" data-reveal>
              <div class="project-image">
                ${
                  project.cardCoverStyle === "robotics"
                    ? `<div class="project-card-cover project-card-cover-robotics" aria-hidden="true">
                        <div class="project-card-cover-panel">
                          <span class="project-card-cover-line"></span>
                          <strong>${escapeHtml(project.coverTitle || project.title)}</strong>
                          <span class="project-card-cover-subtitle">${escapeHtml(project.coverSubtitle || project.description)}</span>
                          <div class="project-card-cover-tags">
                            ${list(project.coverTags?.length ? project.coverTags : project.technologies)
                              .slice(0, 3)
                              .map((tech) => `<span>${escapeHtml(tech)}</span>`)
                              .join("")}
                          </div>
                        </div>
                      </div>`
                    : project.imageAvailable && project.image
                      ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(
                          project.title
                        )} project visual" loading="lazy" />`
                      : mediaFallback(`${project.title} image not added`, "fa-solid fa-image")
                }
                ${
                  project.coverTitle && project.cardCoverStyle !== "robotics"
                    ? `<div class="project-cover-copy" aria-hidden="true">
                        <span class="project-cover-line"></span>
                        <strong>${escapeHtml(project.coverTitle)}</strong>
                        ${project.coverSubtitle ? `<span class="project-cover-subtitle">${escapeHtml(project.coverSubtitle)}</span>` : ""}
                      </div>`
                    : ""
                }
                <span class="status-chip ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
                ${project.featured ? '<span class="featured-chip">Featured</span>' : ""}
              </div>
              <div class="project-body">
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.description)}</p>
                ${
                  list(project.technologies).length
                    ? `<div class="tag-row">${list(project.technologies)
                        .map((tech) => `<span>${escapeHtml(tech)}</span>`)
                        .join("")}</div>`
                    : ""
                }
                <div class="project-actions">
                  <button class="button button-primary button-compact" type="button" data-project-id="${escapeHtml(
                    project.id
                  )}">
                    ${icon("fa-solid fa-circle-info")}
                    Details
                  </button>
                  ${
                    project.showVideoButton && list(project.videos).length
                      ? `<button class="button button-primary button-compact" type="button" data-project-id="${escapeHtml(
                          project.id
                        )}" data-open-project-video aria-label="Watch ${escapeHtml(project.title)} video">
                          ${icon("fa-solid fa-circle-play")}
                          Video
                        </button>`
                      : ""
                  }
                  ${actionButton(project.github, "GitHub", "fa-brands fa-github")}
                  ${actionButton(project.demo, "Live Demo", "fa-solid fa-arrow-up-right-from-square")}
                </div>
              </div>
            </article>
          `
        )
        .join("")
    );
  };

  const renderEducation = () => {
    setHtml(
      "educationGrid",
      list(data.education).length
        ? list(data.education)
        .map(
          (item) => `
            <article class="education-card" data-content-id="${escapeHtml(item.id)}" data-reveal>
              <span class="status-chip">${escapeHtml(item.period)}</span>
              <h3>${escapeHtml(item.school)}</h3>
              <p>${escapeHtml(item.program)}</p>
              ${item.status ? `<strong>${escapeHtml(item.status)}</strong>` : ""}
              ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
              ${
                list(item.details).length
                  ? `<ul>${list(item.details)
                      .map((detail) => `<li>${escapeHtml(detail)}</li>`)
                      .join("")}</ul>`
                  : ""
              }
            </article>
          `
        )
        .join("")
        : emptyState(data.emptyStates?.education || "Education details will be added here soon.", "fa-solid fa-graduation-cap")
    );

    setHtml(
      "trainingGrid",
      list(data.training)
        .map(
          (item) => `
            <article class="training-card" data-reveal>
              <span>${escapeHtml(item.period)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.organization)}</p>
              <small>${escapeHtml(item.details)}</small>
            </article>
          `
        )
        .join("")
    );
  };

  const renderCertificates = () => {
    if (!list(data.certificates).length) {
      setHtml(
        "certificateGrid",
        emptyState(
          data.emptyStates?.certificates || "No verified certificates have been published yet.",
          "fa-solid fa-certificate"
        )
      );
      return;
    }
    setHtml(
      "certificateGrid",
      list(data.certificates)
        .map(
          (cert) => `
            <article class="certificate-card" data-content-id="${escapeHtml(cert.id)}" data-reveal>
              ${
                cert.imageAvailable && cert.image
                  ? `<img src="${escapeHtml(cert.image)}" alt="${escapeHtml(
                      cert.title
                    )} certificate" loading="lazy" />`
                  : mediaFallback(`${cert.title} certificate image not added`, "fa-solid fa-certificate")
              }
              <div>
                ${cert.status ? `<span class="status-chip">${escapeHtml(cert.status)}</span>` : ""}
                <h3>${escapeHtml(cert.title)}</h3>
                <p>${escapeHtml(cert.issuer)}</p>
                <small>${[cert.date, cert.category].filter(Boolean).map(escapeHtml).join(" | ")}</small>
                <div class="project-actions">
                  <button class="button button-primary button-compact" type="button" data-certificate-id="${escapeHtml(
                    cert.id
                  )}">
                    ${icon("fa-solid fa-eye")}
                    View
                  </button>
                  ${actionButton(cert.credentialUrl, "Credential", "fa-solid fa-arrow-up-right-from-square")}
                </div>
              </div>
            </article>
          `
        )
        .join("")
    );
  };

  const renderAchievements = () => {
    setHtml(
      "achievementGrid",
      list(data.achievements).length
        ? list(data.achievements)
            .map(
              (item) => `
            <article class="achievement-card" data-reveal>
              <span class="card-icon">${icon(item.icon)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </article>
          `
            )
            .join("")
        : emptyState("Achievements will be added here after they are verified.", "fa-solid fa-award")
    );

    setHtml(
      "signalGrid",
      list(data.signals).length
        ? list(data.signals)
            .map(
              (item) => `
            <article class="signal-card" data-reveal>
              <span class="card-icon">${icon(item.icon)}</span>
              <div>
                <span class="status-chip">${escapeHtml(item.status)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description)}</p>
              </div>
            </article>
          `
            )
            .join("")
        : emptyState("Verified coding activity will appear here.", "fa-solid fa-chart-line")
    );
  };

  const renderContact = () => {
    const contactCards = list(data.contactCards).filter(
      (item) => !(item.label === "Resume" && !item.url)
    );

    setHtml(
      "contactCards",
      contactCards
        .map((item) => {
          if (item.action === "copy-email") {
            return `
              <button class="contact-card" type="button" data-copy-email="${escapeHtml(data.personal.email)}">
                <span class="card-icon">${icon(item.icon)}</span>
                <span>
                  <small>${escapeHtml(item.label)}</small>
                  <strong>${escapeHtml(item.value)}</strong>
                </span>
              </button>
            `;
          }

          if (item.url) {
            return `
              <a class="contact-card" href="${escapeHtml(item.url)}" download aria-label="${escapeHtml(
                `${item.label}: ${item.value}`
              )}">
                <span class="card-icon">${icon(item.icon)}</span>
                <span>
                  <small>${escapeHtml(item.label)}</small>
                  <strong>${escapeHtml(item.value)}</strong>
                </span>
              </a>
            `;
          }

          return `
            <div class="contact-card">
              <span class="card-icon">${icon(item.icon)}</span>
              <span>
                <small>${escapeHtml(item.label)}</small>
                <strong>${escapeHtml(item.value)}</strong>
              </span>
            </div>
          `;
        })
        .join("")
    );
  };

  const renderFooter = () => {
    setHtml(
      "footerNav",
      list(data.navigation)
        .slice(0, 7)
        .map((item) => `<li><a href="#${escapeHtml(item.target)}">${escapeHtml(item.label)}</a></li>`)
        .join("")
    );

    setHtml(
      "footerSocials",
      list(data.socials)
        .map((social) => {
          if (social.url) {
            const externalAttributes = social.external
              ? ' target="_blank" rel="noopener noreferrer"'
              : "";

            return `
              <a class="social-link" href="${escapeHtml(social.url)}"${externalAttributes} aria-label="${escapeHtml(
                social.ariaLabel || social.label
              )}" title="${escapeHtml(social.title || social.label)}">
                ${icon(social.icon)}
              </a>
            `;
          }

          return `
            <span class="social-link is-disabled" aria-label="${escapeHtml(social.status)}" aria-disabled="true">
              ${icon(social.icon)}
            </span>
          `;
        })
        .join("")
    );

    const year = byId("currentYear");
    if (year) year.textContent = new Date().getFullYear();
  };

  const renderAll = () => {
    renderNavLinks("desktopNav", "nav-link");
    renderNavLinks("mobileNav", "mobile-nav-link");
    renderPersonalContent();
    renderAbout();
    renderExperience();
    renderSkills();
    renderProjectFilters();
    renderProjects();
    renderEducation();
    renderCertificates();
    renderAchievements();
    renderContact();
    renderFooter();
  };

  window.PortfolioComponents = {
    renderAll,
    escapeHtml,
    icon,
    statusClass,
    getProject: (id) => list(data.projects).find((item) => item.id === id),
    getCertificate: (id) => list(data.certificates).find((item) => item.id === id)
  };
})();
