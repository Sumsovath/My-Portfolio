(function () {
  const root = document.documentElement;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(pointer: fine)");
  const smallScreenQuery = window.matchMedia("(max-width: 760px)");
  const cardSelector = [
    ".info-item",
    ".stat-card",
    ".skill-card",
    ".experience-card",
    ".project-card",
    ".roadmap-card",
    ".education-card",
    ".training-card",
    ".certificate-card",
    ".achievement-card",
    ".signal-card",
    ".blog-card",
    ".language-card",
    ".contact-card",
    ".contact-form"
  ].join(",");
  const tiltSelector = [
    ".skill-card",
    ".experience-card",
    ".project-card",
    ".roadmap-card",
    ".education-card",
    ".certificate-card",
    ".contact-form"
  ].join(",");

  let typedInstance = null;

  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const motionAllowed = () => !reduceMotionQuery.matches && root.dataset.motion !== "paused";

  const initTypedRoles = () => {
    const target = document.getElementById("typedRole");
    const roles = window.portfolioData?.heroRoles || [];
    if (!target || roles.length === 0) return;

    const syncTypedRoles = () => {
      if (typedInstance) {
        typedInstance.destroy();
        typedInstance = null;
      }

      target.textContent = roles[0];
      if (!motionAllowed() || !window.Typed) return;

      typedInstance = new window.Typed("#typedRole", {
        strings: roles,
        typeSpeed: 46,
        backSpeed: 27,
        backDelay: 1350,
        startDelay: 240,
        loop: true,
        smartBackspace: true
      });
    };

    syncTypedRoles();
    document.addEventListener("portfolio:motionchange", syncTypedRoles);
  };

  const clearGsapMotion = () => {
    if (!window.gsap) return;

    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }

    const animatedElements = qsa(
      ".brand, .nav-link, .header-actions > *, .hero-copy > *, .hero-visual, .orbit-node, .section-heading, " +
        cardSelector +
        ", .timeline-item"
    );
    window.gsap.killTweensOf(animatedElements);
    window.gsap.set(animatedElements, { clearProps: "opacity,visibility,transform,clipPath" });
  };

  const initGsapMotion = () => {
    if (!window.gsap || !window.ScrollTrigger || !motionAllowed()) return false;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    const headerTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    headerTimeline
      .from(".brand", { y: -20, autoAlpha: 0, duration: 0.58 })
      .from(".nav-link", { y: -14, autoAlpha: 0, duration: 0.46, stagger: 0.035 }, "<0.05")
      .from(".header-actions > *", { y: -14, autoAlpha: 0, duration: 0.46, stagger: 0.05 }, "<0.02");

    const heroTimeline = gsap.timeline({ defaults: { ease: "power4.out" } });
    heroTimeline
      .from(".hero-copy .eyebrow", { x: -28, autoAlpha: 0, duration: 0.64 })
      .from(
        ".hero h1",
        { y: 54, autoAlpha: 0, clipPath: "inset(100% 0 0 0)", duration: 0.92 },
        "-=0.32"
      )
      .from(".typed-line", { y: 22, autoAlpha: 0, duration: 0.62 }, "-=0.5")
      .from(".hero-intro", { y: 24, autoAlpha: 0, duration: 0.68 }, "-=0.44")
      .from(
        ".hero-actions .button",
        {
          y: 26,
          autoAlpha: 0,
          duration: 0.56,
          stagger: 0.08,
          onComplete: () => gsap.set(".hero-actions .button", { clearProps: "transform,opacity,visibility" })
        },
        "-=0.38"
      )
      .from(
        ".hero-badge",
        {
          y: 18,
          scale: 0.92,
          autoAlpha: 0,
          duration: 0.48,
          stagger: 0.055,
          onComplete: () => gsap.set(".hero-badge", { clearProps: "transform,opacity,visibility" })
        },
        "-=0.34"
      )
      .from(
        ".hero-visual",
        {
          x: 54,
          rotateY: -8,
          autoAlpha: 0,
          duration: 1.02,
          onComplete: () => gsap.set(".hero-visual", { clearProps: "transform,opacity,visibility" })
        },
        "-=1.02"
      )
      .from(".orbit-node", { scale: 0, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, "-=0.58");

    qsa(".section-heading").forEach((heading) => {
      gsap.fromTo(
        heading,
        { y: 44, autoAlpha: 0, clipPath: "inset(0 0 26% 0)" },
        {
          y: 0,
          autoAlpha: 1,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.86,
          ease: "power3.out",
          scrollTrigger: { trigger: heading, start: "top 86%", once: true }
        }
      );
    });

    const gridSelectors = [
      ".info-grid",
      ".stat-grid",
      ".skills-grid",
      ".experience-grid",
      ".projects-grid",
      ".roadmap-grid",
      ".language-grid",
      ".education-grid",
      ".training-grid",
      ".certificate-grid",
      ".achievement-grid",
      ".signal-grid",
      ".blog-grid",
      ".contact-cards"
    ];

    gridSelectors.forEach((selector) => {
      qsa(selector).forEach((grid) => {
        const items = Array.from(grid.children).filter((item) => !item.hidden);
        if (items.length === 0) return;

        ScrollTrigger.create({
          trigger: grid,
          start: "top 87%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              items,
              { y: 52, rotateX: 5, scale: 0.965, autoAlpha: 0 },
              {
                y: 0,
                rotateX: 0,
                scale: 1,
                autoAlpha: 1,
                duration: 0.72,
                stagger: 0.075,
                ease: "power3.out",
                onComplete: () => gsap.set(items, { clearProps: "transform,opacity,visibility" })
              }
            );
          }
        });
      });
    });

    qsa(".timeline-item").forEach((item, index) => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            item,
            { x: index % 2 === 0 ? -44 : 44, y: index % 2 === 0 ? 0 : 34, autoAlpha: 0 },
            {
              x: 0,
              y: index % 2 === 0 ? 0 : 34,
              autoAlpha: 1,
              duration: 0.72,
              ease: "power3.out",
              onComplete: () => gsap.set(item, { clearProps: "transform,opacity,visibility" })
            }
          );
        }
      });
    });

    gsap.fromTo(
      ".contact-form",
      { x: 46, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.86,
        ease: "power3.out",
        scrollTrigger: { trigger: ".contact-section", start: "top 76%", once: true },
        onComplete: () => gsap.set(".contact-form", { clearProps: "transform,opacity,visibility" })
      }
    );

    ScrollTrigger.refresh();
    return true;
  };

  const initRevealMotion = () => {
    const syncMotion = () => {
      clearGsapMotion();
      if (!motionAllowed()) return;
      initGsapMotion();
    };

    syncMotion();
    document.addEventListener("portfolio:motionchange", syncMotion);
  };

  const initCounters = () => {
    const counters = qsa("[data-counter]");
    if (counters.length === 0) return;

    const animateCounter = (element) => {
      const rawValue = element.dataset.counter || "";
      const suffix = element.dataset.suffix || "";
      const numericValue = Number.parseFloat(rawValue);

      if (Number.isNaN(numericValue) || rawValue.includes("-") || !motionAllowed()) {
        element.textContent = `${rawValue}${suffix}`;
        return;
      }

      const decimals = rawValue.includes(".") ? 1 : 0;
      const duration = 1050;
      const start = performance.now();

      const tick = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        element.textContent = `${(numericValue * eased).toFixed(decimals)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((counter) => observer.observe(counter));
  };

  const initMagneticButtons = () => {
    if (!finePointerQuery.matches) return;

    const buttons = qsa(".magnetic");
    buttons.forEach((button) => {
      let frameId = 0;

      button.addEventListener("pointermove", (event) => {
        if (!motionAllowed()) return;
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(() => {
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          button.style.setProperty("--magnetic-x", `${x * 0.1}px`);
          button.style.setProperty("--magnetic-y", `${y * 0.1}px`);
        });
      });

      button.addEventListener("pointerleave", () => {
        button.style.setProperty("--magnetic-x", "0px");
        button.style.setProperty("--magnetic-y", "0px");
      });
    });

    document.addEventListener("portfolio:motionchange", () => {
      if (motionAllowed()) return;
      buttons.forEach((button) => {
        button.style.setProperty("--magnetic-x", "0px");
        button.style.setProperty("--magnetic-y", "0px");
      });
    });
  };

  const initGlassInteraction = () => {
    if (!finePointerQuery.matches) return;

    const cards = qsa(cardSelector);
    cards.forEach((card, index) => {
      card.style.setProperty("--card-index", String(index % 6));
      let frameId = 0;

      card.addEventListener("pointermove", (event) => {
        if (!motionAllowed()) return;
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const normalizedX = (event.clientX - rect.left) / rect.width;
          const normalizedY = (event.clientY - rect.top) / rect.height;
          const canTilt = card.matches(tiltSelector);
          const tiltX = canTilt ? (normalizedX - 0.5) * 7 : 0;
          const tiltY = canTilt ? (0.5 - normalizedY) * 7 : 0;

          card.style.setProperty("--spot-x", `${normalizedX * 100}%`);
          card.style.setProperty("--spot-y", `${normalizedY * 100}%`);
          card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
          card.classList.add("is-pointer-active");
        });
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--spot-x", "50%");
        card.style.setProperty("--spot-y", "50%");
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.classList.remove("is-pointer-active");
      });
    });

    document.addEventListener("portfolio:motionchange", () => {
      if (motionAllowed()) return;
      cards.forEach((card) => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.classList.remove("is-pointer-active");
      });
    });
  };

  const initHeroParallax = () => {
    const hero = document.querySelector(".hero");
    const visual = document.querySelector(".hero-visual");
    if (!hero || !visual || !finePointerQuery.matches) return;

    let frameId = 0;
    const reset = () => {
      visual.style.setProperty("--hero-rx", "0deg");
      visual.style.setProperty("--hero-ry", "0deg");
      visual.style.setProperty("--hero-tx", "0px");
      visual.style.setProperty("--hero-ty", "0px");
    };

    hero.addEventListener("pointermove", (event) => {
      if (!motionAllowed()) return;
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        visual.style.setProperty("--hero-rx", `${(-y * 3.8).toFixed(2)}deg`);
        visual.style.setProperty("--hero-ry", `${(x * 5.2).toFixed(2)}deg`);
        visual.style.setProperty("--hero-tx", `${(x * 12).toFixed(2)}px`);
        visual.style.setProperty("--hero-ty", `${(y * 8).toFixed(2)}px`);
      });
    });

    hero.addEventListener("pointerleave", reset);
    document.addEventListener("portfolio:motionchange", () => {
      if (!motionAllowed()) reset();
    });
  };

  const initParticles = () => {
    const canvas = document.getElementById("particleCanvas");
    const hero = canvas?.closest(".hero");
    if (!canvas || !hero || !window.THREE || reduceMotionQuery.matches) return;

    const THREE = window.THREE;
    const isSmallScreen = smallScreenQuery.matches;
    const particleCount = isSmallScreen ? 110 : 320;
    const lineCount = isSmallScreen ? 32 : 86;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.z = 76;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);

    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [new THREE.Color(0x15c4d8), new THREE.Color(0x63e6a5), new THREE.Color(0xf6c85f), new THREE.Color(0xff7f73)];

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * 182;
      positions[offset + 1] = (Math.random() - 0.5) * 96;
      positions[offset + 2] = (Math.random() - 0.5) * 58;
      basePositions[offset] = positions[offset];
      basePositions[offset + 1] = positions[offset + 1];
      basePositions[offset + 2] = positions[offset + 2];
      palette[index % palette.length].toArray(colors, offset);
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: isSmallScreen ? 0.85 : 1.08,
      transparent: true,
      opacity: 0.72,
      vertexColors: true,
      depthWrite: false
    });

    const points = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(points);

    const linePositions = new Float32Array(lineCount * 6);
    for (let index = 0; index < lineCount; index += 1) {
      const offset = index * 6;
      const x = (Math.random() - 0.5) * 176;
      const y = (Math.random() - 0.5) * 92;
      const z = (Math.random() - 0.5) * 45;
      linePositions[offset] = x;
      linePositions[offset + 1] = y;
      linePositions[offset + 2] = z;
      linePositions[offset + 3] = x + (Math.random() - 0.5) * 16;
      linePositions[offset + 4] = y + (Math.random() - 0.5) * 12;
      linePositions[offset + 5] = z + (Math.random() - 0.5) * 8;
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x15c4d8,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };
    let frameId = 0;

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 420);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onPointerMove = (event) => {
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const animate = (time) => {
      frameId = window.requestAnimationFrame(animate);
      if (!motionAllowed() || document.hidden) return;

      const seconds = time * 0.001;
      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;

      for (let index = 0; index < particleCount; index += 1) {
        const offset = index * 3;
        positions[offset + 1] = basePositions[offset + 1] + Math.sin(seconds * (0.34 + (index % 7) * 0.02) + index) * 1.1;
        positions[offset] = basePositions[offset] + Math.cos(seconds * 0.22 + index * 0.34) * 0.45;
      }

      pointGeometry.getAttribute("position").needsUpdate = true;
      points.rotation.y = seconds * 0.018 + pointer.x * 0.055;
      points.rotation.x = pointer.y * 0.035;
      lines.rotation.y = -seconds * 0.012 + pointer.x * 0.035;
      lines.rotation.x = pointer.y * 0.02;
      pointMaterial.opacity = 0.64 + Math.sin(seconds * 0.7) * 0.08;
      lineMaterial.opacity = 0.09 + Math.sin(seconds * 0.5) * 0.025;
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    frameId = window.requestAnimationFrame(animate);

    window.addEventListener(
      "beforeunload",
      () => {
        window.cancelAnimationFrame(frameId);
        pointGeometry.dispose();
        pointMaterial.dispose();
        lineGeometry.dispose();
        lineMaterial.dispose();
        renderer.dispose();
      },
      { once: true }
    );
  };

  const animateFilteredCards = (cards) => {
    const visibleCards = Array.from(cards || []).filter((card) => !card.hidden);
    if (!window.gsap || !motionAllowed() || visibleCards.length === 0) return;

    window.gsap.fromTo(
      visibleCards,
      { y: 24, scale: 0.965, autoAlpha: 0 },
      {
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.48,
        stagger: 0.05,
        ease: "power3.out",
        onComplete: () => window.gsap.set(visibleCards, { clearProps: "transform,opacity,visibility" })
      }
    );
  };

  const init = () => {
    initTypedRoles();
    initRevealMotion();
    initCounters();
    initMagneticButtons();
    initGlassInteraction();
    initHeroParallax();
    initParticles();
  };

  window.PortfolioAnimations = { init, animateFilteredCards, motionAllowed };
})();
