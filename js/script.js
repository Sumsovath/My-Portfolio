(function () {
  const data = window.portfolioData || {};
  const components = window.PortfolioComponents;
  const animations = window.PortfolioAnimations;

  const byId = (id) => document.getElementById(id);
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const list = (value) => (Array.isArray(value) ? value : []);

  let lastFocusedElement = null;

  const showToast = (message) => {
    const toast = byId("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  };

  const initMotionPreference = () => {
    const button = byId("motionToggle");
    const root = document.documentElement;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyMotion = (paused) => {
      const shouldPause = reduceMotionQuery.matches || paused;
      root.dataset.motion = shouldPause ? "paused" : "running";

      if (button) {
        button.innerHTML = shouldPause
          ? '<i class="fa-solid fa-play" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
        button.setAttribute("aria-pressed", String(shouldPause));
        button.setAttribute("aria-label", shouldPause ? "Play animations" : "Pause animations");
        button.title = reduceMotionQuery.matches
          ? "Animations follow your reduced-motion setting"
          : shouldPause
            ? "Play animations"
            : "Pause animations";
        button.disabled = reduceMotionQuery.matches;
      }

      document.dispatchEvent(
        new CustomEvent("portfolio:motionchange", { detail: { paused: shouldPause } })
      );
    };

    // Start each visit with motion enabled; an old paused preference should not disable the portfolio.
    window.localStorage.removeItem("sum-sovath-motion");
    applyMotion(false);

    button?.addEventListener("click", () => {
      applyMotion(root.dataset.motion !== "paused");
    });

    reduceMotionQuery.addEventListener?.("change", () => {
      applyMotion(false);
    });
  };

  const initLoader = () => {
    const loader = byId("loader");
    if (!loader) return;

    const hide = () => {
      loader.classList.add("is-hidden");
      window.setTimeout(() => loader.remove(), 420);
    };

    window.setTimeout(hide, 650);
    window.addEventListener("load", hide, { once: true });
  };

  const initTheme = () => {
    const button = byId("themeToggle");
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem("sum-sovath-theme");
    const initialTheme = storedTheme || "dark";

    const applyTheme = (theme) => {
      root.setAttribute("data-theme", theme);
      if (button) {
        button.innerHTML =
          theme === "dark"
            ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      }
    };

    applyTheme(initialTheme);

    button?.addEventListener("click", () => {
      const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      window.localStorage.setItem("sum-sovath-theme", nextTheme);
    });
  };

  const initMobileMenu = () => {
    const toggle = byId("menuToggle");
    const menu = byId("mobileMenu");
    if (!toggle || !menu) return;

    const closeMenu = () => {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    };

    const openMenu = () => {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      toggle.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      qs("a", menu)?.focus();
    };

    toggle.addEventListener("click", () => {
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    qsa("a", menu).forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
  };

  const initScrollState = () => {
    const header = byId("siteHeader");
    const progress = byId("scrollProgress");
    const backToTop = byId("backToTop");
    const contactSection = byId("contact");

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = height > 0 ? (scrollTop / height) * 100 : 0;
      const contactRect = contactSection?.getBoundingClientRect();
      const contactIsVisible = Boolean(
        contactRect && contactRect.top < window.innerHeight && contactRect.bottom > 0
      );

      header?.classList.toggle("is-scrolled", scrollTop > 18);
      backToTop?.classList.toggle("is-visible", scrollTop > 650 && !contactIsVisible);
      if (progress) progress.style.width = `${percentage}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });

    backToTop?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const initActiveNavigation = () => {
    const sections = list(data.navigation)
      .map((item) => byId(item.target))
      .filter(Boolean);

    const setActive = (id) => {
      qsa("[data-nav-link]").forEach((link) => {
        link.classList.toggle("is-active", link.dataset.navLink === id);
      });
    };

    if (!("IntersectionObserver" in window)) {
      setActive("home");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      {
        rootMargin: "-42% 0px -50% 0px",
        threshold: 0.01
      }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const initProjectFilters = () => {
    const buttons = qsa("[data-filter]");
    const cards = qsa("[data-project-card]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        buttons.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        cards.forEach((card) => {
          const categories = (card.dataset.categories || "").split("|");
          const visible = filter === "All" || categories.includes(filter);
          card.hidden = !visible;
        });

        animations.animateFilteredCards(cards);
      });
    });
  };

  const closeModal = () => {
    const modal = byId("modal");
    if (!modal) return;

    modal.hidden = true;
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
    if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
    lastFocusedElement = null;
  };

  const openModal = (html) => {
    const modal = byId("modal");
    const content = byId("modalContent");
    if (!modal || !content) return;

    lastFocusedElement = document.activeElement;
    content.innerHTML = html;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
    content.scrollTop = 0;
    qs("[data-close-modal]", modal)?.focus();
  };

  const trapModalFocus = (event) => {
    const modal = byId("modal");
    if (event.key !== "Tab" || !modal || modal.hidden) return;

    const focusable = qsa(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((element) => element.getClientRects().length > 0);

    if (focusable.length === 0) {
      event.preventDefault();
      qs(".modal-panel", modal)?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const initModals = () => {
    qsa("[data-project-id]").forEach((projectButton) => {
      projectButton.addEventListener("click", () => {
        const project = components.getProject(projectButton.dataset.projectId);
        if (!project) return;

        openModal(`
          <article class="modal-detail">
            ${
              project.imageAvailable && project.image
                ? `<img src="${components.escapeHtml(project.image)}" alt="${components.escapeHtml(
                    project.title
                  )} project visual" />`
                : `<div class="media-fallback" role="img" aria-label="${components.escapeHtml(
                    `${project.title} image not added`
                  )}"><i class="fa-solid fa-image" aria-hidden="true"></i><span>Image coming soon</span></div>`
            }
            <span class="status-chip ${components.statusClass(project.status)}">${components.escapeHtml(project.status)}</span>
            <h2 id="modalTitle">${components.escapeHtml(project.title)}</h2>
            <p id="modalDescription">${components.escapeHtml(project.fullDescription || project.description)}</p>
            ${
              project.overview
                ? `<section class="modal-section"><h3>Project Overview</h3><p>${components.escapeHtml(project.overview)}</p></section>`
                : ""
            }
            ${
              project.howItWorks
                ? `<section class="modal-section"><h3>How It Works</h3><p>${components.escapeHtml(project.howItWorks)}</p></section>`
                : ""
            }
            ${
              list(project.technologies).length
                ? `<div class="tag-row">${list(project.technologies)
                    .map((tech) => `<span>${components.escapeHtml(tech)}</span>`)
                    .join("")}</div>`
                : ""
            }
            ${
              list(project.componentsUsed).length
                ? `<section class="modal-section"><h3>Components Used</h3><ul>${list(project.componentsUsed)
                    .map((component) => `<li>${components.escapeHtml(component)}</li>`)
                    .join("")}</ul></section>`
                : ""
            }
            ${
              list(project.features).length
                ? `<h3>Features</h3><ul>${list(project.features)
                    .map((feature) => `<li>${components.escapeHtml(feature)}</li>`)
                    .join("")}</ul>`
                : ""
            }
            ${
              list(project.studentLearning).length
                ? `<section class="modal-section"><h3>What Students Learned</h3><ul>${list(project.studentLearning)
                    .map((lesson) => `<li>${components.escapeHtml(lesson)}</li>`)
                    .join("")}</ul></section>`
                : ""
            }
            ${
              list(project.outcomes).length
                ? `<h3>Learning outcomes</h3><ul>${list(project.outcomes)
                    .map((outcome) => `<li>${components.escapeHtml(outcome)}</li>`)
                    .join("")}</ul>`
                : ""
            }
            ${
              list(project.videos).length
                ? `<section class="modal-section" id="projectVideo"><h3>Demonstration Video</h3><div class="project-video-gallery">${list(
                    project.videos
                  )
                    .map(
                      (video) => `<figure><video controls preload="metadata"><source src="${components.escapeHtml(
                        video.src
                      )}" />Your browser does not support HTML5 video.</video>${
                        video.label ? `<figcaption>${components.escapeHtml(video.label)}</figcaption>` : ""
                      }</figure>`
                    )
                    .join("")}</div></section>`
                : ""
            }
            ${
              project.github || project.demo
                ? `<div class="modal-actions">
                    ${
                      project.github
                        ? `<a class="button button-ghost" href="${components.escapeHtml(
                            project.github
                          )}" target="_blank" rel="noopener noreferrer" aria-label="Open ${components.escapeHtml(
                            project.title
                          )} on GitHub in a new tab"><i class="fa-brands fa-github" aria-hidden="true"></i>GitHub</a>`
                        : ""
                    }
                    ${
                      project.demo
                        ? `<a class="button button-primary" href="${components.escapeHtml(
                            project.demo
                          )}" target="_blank" rel="noopener noreferrer" aria-label="Open ${components.escapeHtml(
                            project.title
                          )} demo in a new tab"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>Live Demo</a>`
                        : ""
                    }
                  </div>`
                : ""
            }
          </article>
        `);

        if (projectButton.hasAttribute("data-open-project-video")) {
          requestAnimationFrame(() => {
            const videoSection = byId("projectVideo");
            const modalContent = byId("modalContent");
            if (!videoSection || !modalContent) return;

            modalContent.scrollTop = Math.max(0, videoSection.offsetTop - 16);
            qs("video", videoSection)?.focus({ preventScroll: true });
          });
        }
      });
    });

    qsa("[data-certificate-id]").forEach((certificateButton) => {
      certificateButton.addEventListener("click", () => {
        const certificate = components.getCertificate(certificateButton.dataset.certificateId);
        if (!certificate) return;

        openModal(`
          <article class="modal-detail">
            ${
              certificate.imageAvailable && certificate.image
                ? `<img src="${components.escapeHtml(certificate.image)}" alt="${components.escapeHtml(
                    certificate.title
                  )} certificate preview" />`
                : `<div class="media-fallback" role="img" aria-label="${components.escapeHtml(
                    `${certificate.title} image not added`
                  )}"><i class="fa-solid fa-certificate" aria-hidden="true"></i><span>Image coming soon</span></div>`
            }
            ${
              certificate.status
                ? `<span class="status-chip">${components.escapeHtml(certificate.status)}</span>`
                : ""
            }
            <h2 id="modalTitle">${components.escapeHtml(certificate.title)}</h2>
            <p id="modalDescription">${components.escapeHtml(certificate.issuer)}</p>
            <p>${[certificate.date, certificate.category]
              .filter(Boolean)
              .map(components.escapeHtml)
              .join(" | ")}</p>
          </article>
        `);
      });
    });

    qsa("[data-close-modal]").forEach((closeButton) => {
      closeButton.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      const modal = byId("modal");
      if (event.key === "Escape" && modal && !modal.hidden) closeModal();
      trapModalFocus(event);
    });
  };

  const copyToClipboard = async (value) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const initCopyActions = () => {
    document.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-copy-email]");
      if (!trigger) return;

      try {
        await copyToClipboard(trigger.dataset.copyEmail);
        showToast("Email copied to clipboard.");
      } catch (error) {
        showToast("Could not copy automatically. Email: " + trigger.dataset.copyEmail);
      }
    });
  };

  const initContactForm = () => {
    const form = byId("contactForm");
    if (!form) return;

    const submitButton = byId("contactSubmit");
    const submitLabel = byId("contactSubmitLabel");
    const formStatus = byId("formStatus");
    const endpoint = data.contactForm?.endpoint || form.getAttribute("action") || "";

    const fields = {
      name: byId("name"),
      email: byId("email"),
      subject: byId("subject"),
      message: byId("message")
    };

    const errors = {
      name: byId("nameError"),
      email: byId("emailError"),
      subject: byId("subjectError"),
      message: byId("messageError")
    };
    const fieldLimits = {
      name: 100,
      email: 254,
      subject: 150,
      message: 3000
    };

    let isSubmitting = false;

    if (endpoint) form.setAttribute("action", endpoint);

    const setStatus = (message, state = "") => {
      if (!formStatus) return;

      formStatus.textContent = message;
      formStatus.classList.remove("is-sending", "is-success", "is-error");
      if (state) formStatus.classList.add(`is-${state}`);
    };

    const setSubmitting = (submitting) => {
      isSubmitting = submitting;
      form.setAttribute("aria-busy", String(submitting));

      if (submitButton) {
        submitButton.disabled = submitting;
        submitButton.setAttribute("aria-disabled", String(submitting));
      }

      if (submitLabel) submitLabel.textContent = submitting ? "Sending..." : "Send Message";
    };

    const isConfiguredFormspreeEndpoint = () => {
      try {
        const url = new URL(endpoint);
        const hasFormId = /^\/f\/[a-z0-9_-]+\/?$/i.test(url.pathname);
        const hasPlaceholder = /YOUR_FORMSPREE_ID/i.test(url.pathname);
        return url.origin === "https://formspree.io" && hasFormId && !hasPlaceholder;
      } catch (error) {
        return false;
      }
    };

    const setError = (field, message) => {
      const input = fields[field];
      const error = errors[field];
      if (!input || !error) return;

      input.setAttribute("aria-invalid", message ? "true" : "false");
      error.textContent = message;
    };

    const validate = () => {
      let valid = true;

      const nameValue = fields.name.value.trim();
      if (!nameValue) {
        setError("name", "Please enter your name.");
        valid = false;
      } else if (nameValue.length > fieldLimits.name) {
        setError("name", `Please keep your name under ${fieldLimits.name} characters.`);
        valid = false;
      } else {
        setError("name", "");
      }

      const emailValue = fields.email.value.trim();
      if (!emailValue) {
        setError("email", "Please enter your email.");
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        setError("email", "Please enter a valid email address.");
        valid = false;
      } else if (emailValue.length > fieldLimits.email) {
        setError("email", "Please enter a shorter email address.");
        valid = false;
      } else {
        setError("email", "");
      }

      const subjectValue = fields.subject.value.trim();
      if (!subjectValue) {
        setError("subject", "Please enter a subject.");
        valid = false;
      } else if (subjectValue.length > fieldLimits.subject) {
        setError("subject", `Please keep the subject under ${fieldLimits.subject} characters.`);
        valid = false;
      } else {
        setError("subject", "");
      }

      const messageValue = fields.message.value.trim();
      if (!messageValue) {
        setError("message", "Please enter a message.");
        valid = false;
      } else if (messageValue.length > fieldLimits.message) {
        setError("message", `Please keep the message under ${fieldLimits.message} characters.`);
        valid = false;
      } else {
        setError("message", "");
      }

      return valid;
    };

    Object.entries(fields).forEach(([field, input]) => {
      input?.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") setError(field, "");
        if (!isSubmitting && formStatus?.textContent) setStatus("");
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      if (!validate()) {
        const message = "Please complete the highlighted fields.";
        setStatus(message, "error");
        showToast(message);
        Object.values(fields).find((field) => field?.getAttribute("aria-invalid") === "true")?.focus();
        return;
      }

      if (!isConfiguredFormspreeEndpoint()) {
        const message = "Message service is not configured yet. Please use the email link below.";
        setStatus(message, "error");
        showToast(message);
        return;
      }

      setSubmitting(true);
      setStatus("Sending...", "sending");

      try {
        const formData = new FormData(form);
        Object.entries(fields).forEach(([field, input]) => {
          formData.set(field, input.value.trim());
        });

        const response = await window.fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json"
          }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const responseMessage = Array.isArray(payload.errors)
            ? payload.errors.map((error) => error.message).filter(Boolean).join(" ")
            : "";
          throw new Error(responseMessage || "The message service could not accept your submission.");
        }

        const message = "Your message was sent successfully.";
        form.reset();
        Object.keys(fields).forEach((field) => setError(field, ""));
        setStatus(message, "success");
        showToast(message);
      } catch (error) {
        const message =
          error instanceof TypeError
            ? "A network error stopped the message. Please check your connection and try again."
            : error.message || "Your message could not be sent. Please try again.";
        setStatus(message, "error");
        showToast(message);
      } finally {
        setSubmitting(false);
      }
    });
  };

  const initCustomCursor = () => {
    const cursor = byId("customCursor");
    const aura = byId("cursorAura");
    const canUseMouseCursor = window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;
    if (!cursor || !aura || !canUseMouseCursor || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.classList.add("has-custom-cursor");

    let pointerX = -200;
    let pointerY = -200;
    let auraX = -200;
    let auraY = -200;
    let frameId = 0;

    window.addEventListener(
      "mousemove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      },
      { passive: true }
    );

    const followPointer = () => {
      frameId = window.requestAnimationFrame(followPointer);
      if (!animations.motionAllowed()) return;
      auraX += (pointerX - auraX) * 0.11;
      auraY += (pointerY - auraY) * 0.11;
      aura.style.transform = `translate(${auraX}px, ${auraY}px)`;
    };

    frameId = window.requestAnimationFrame(followPointer);

    qsa("a, button, input, textarea, .project-card, .skill-card").forEach((element) => {
      element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
      element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    });

    qsa(".professional-snapshot .stat-card").forEach((card) => {
      card.addEventListener("mouseenter", () => document.body.classList.add("is-over-professional-snapshot"));
      card.addEventListener("mouseleave", () => document.body.classList.remove("is-over-professional-snapshot"));
    });

    window.addEventListener(
      "beforeunload",
      () => window.cancelAnimationFrame(frameId),
      { once: true }
    );
  };

  const init = () => {
    components.renderAll();
    initMotionPreference();
    initLoader();
    initTheme();
    initMobileMenu();
    initScrollState();
    initActiveNavigation();
    initProjectFilters();
    initModals();
    initCopyActions();
    initContactForm();
    initCustomCursor();
    animations.init();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
