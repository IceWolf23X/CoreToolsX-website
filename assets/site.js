const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const root = document.documentElement;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeKey = "coretoolsx-theme";

const getStoredTheme = () => {
  try {
    return localStorage.getItem(themeKey);
  } catch (_) {
    return null;
  }
};

const setStoredTheme = (theme) => {
  try {
    localStorage.setItem(themeKey, theme);
  } catch (_) {
    // Storage can fail in private contexts; the current page still updates.
  }
};

const normalizeTheme = (theme) => (theme === "light" ? "light" : "dark");

const applyTheme = (theme) => {
  const nextTheme = normalizeTheme(theme);

  if (nextTheme === "light") {
    root.dataset.theme = "light";
  } else {
    root.removeAttribute("data-theme");
  }

  if (themeMeta) {
    themeMeta.setAttribute("content", nextTheme === "light" ? "#eef8ff" : "#050812");
  }

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.setAttribute("aria-pressed", String(nextTheme === "light"));
    button.setAttribute(
      "aria-label",
      nextTheme === "light" ? "Switch to dark theme" : "Switch to light theme"
    );
    button.title = nextTheme === "light" ? "Switch to dark theme" : "Switch to light theme";

    const label = button.querySelector(".theme-toggle-text");
    if (label) {
      label.textContent = nextTheme === "light" ? "Dark" : "Light";
    }
  });
};

applyTheme(root.dataset.theme === "light" ? "light" : getStoredTheme());

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

if (navLinks && !navLinks.querySelector(".theme-toggle")) {
  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.type = "button";
  themeToggle.innerHTML =
    '<span class="theme-toggle-icon" aria-hidden="true"></span><span class="theme-toggle-text"></span>';

  themeToggle.addEventListener("click", () => {
    const currentTheme = root.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    setStoredTheme(nextTheme);
    applyTheme(nextTheme);
  });

  navLinks.appendChild(themeToggle);
  applyTheme(root.dataset.theme === "light" ? "light" : getStoredTheme());
}

const moreToggle = document.querySelector(".more-toggle");
const secondaryFeatures = document.querySelector("#secondary-features");

if (moreToggle && secondaryFeatures) {
  moreToggle.addEventListener("click", () => {
    const willOpen = secondaryFeatures.hasAttribute("hidden");
    secondaryFeatures.toggleAttribute("hidden", !willOpen);
    secondaryFeatures.classList.toggle("is-open", willOpen);
    moreToggle.setAttribute("aria-expanded", String(willOpen));
    moreToggle.textContent = willOpen ? "Hide extra features" : "See more features";
  });
}

document.querySelectorAll("[data-animated-details] details").forEach((details) => {
  const summary = details.querySelector("summary");
  if (!summary) {
    return;
  }

  let animation = null;

  const setHeight = (height) => {
    details.style.height = `${height}px`;
  };

  const finish = (open) => {
    details.open = open;
    details.classList.remove("is-animating");
    details.style.height = "";
    details.style.overflow = "";
    animation = null;
  };

  summary.addEventListener("click", (event) => {
    event.preventDefault();

    if (animation) {
      animation.cancel();
    }

    const startHeight = details.offsetHeight;
    details.classList.add("is-animating");
    details.style.overflow = "hidden";

    if (details.open) {
      const endHeight = summary.offsetHeight;
      animation = details.animate(
        { height: [`${startHeight}px`, `${endHeight}px`] },
        { duration: 240, easing: "cubic-bezier(.2, .8, .2, 1)" }
      );
      setHeight(endHeight);
      animation.onfinish = () => finish(false);
      animation.oncancel = () => finish(false);
      return;
    }

    details.open = true;
    const endHeight = details.scrollHeight;
    setHeight(startHeight);
    animation = details.animate(
      { height: [`${startHeight}px`, `${endHeight}px`] },
      { duration: 260, easing: "cubic-bezier(.2, .8, .2, 1)" }
    );
    setHeight(endHeight);
    animation.onfinish = () => finish(true);
    animation.oncancel = () => finish(true);
  });
});

const resourcePages = {
  "features.html": "./features.html",
  "installation.html": "./installation.html",
  "configuration.html": "./configuration.html",
  "faq.html": "./faq.html",
};

const resourceLinks = [
  {
    label: "Product",
    title: "Product Overview",
    copy: "Tool progression, skins, metadata, and scope.",
    href: "./features.html",
  },
  {
    label: "Setup",
    title: "Installation Guide",
    copy: "Paper requirements, generated files, and validation.",
    href: "./installation.html",
  },
  {
    label: "Config",
    title: "Configuration Reference",
    copy: "YAML files, reload rules, permissions, and troubleshooting.",
    href: "./configuration.html",
  },
  {
    label: "FAQ",
    title: "Complete FAQ",
    copy: "Common server-owner questions and short answers.",
    href: "./faq.html",
  },
  {
    label: "Ops",
    title: "Troubleshooting",
    copy: "Recipe, permission, lore, skin durability, and reload checks.",
    href: "./configuration.html#troubleshooting-quick-reference",
  },
  {
    label: "Release",
    title: "Production Validation",
    copy: "Checklist before giving progression and skins to players.",
    href: "./configuration.html#production-validation-checklist",
  },
];

const currentPage = window.location.pathname.split("/").pop() || "index.html";
const docLayout = document.querySelector(".doc-layout");
const docArticle = docLayout?.querySelector(".markdown-body");

if (docLayout && docArticle && resourcePages[currentPage]) {
  if (!docLayout.querySelector(".resource-sidebar")) {
    const resourceSidebar = document.createElement("aside");
    resourceSidebar.className = "resource-sidebar";
    resourceSidebar.setAttribute("aria-label", "Related resources");
    resourceSidebar.innerHTML = `<strong>Resources</strong>${resourceLinks
      .map((item) => {
        const isCurrent = resourcePages[currentPage] === item.href ? " is-current" : "";
        return `
          <a class="side-resource-card${isCurrent}" href="${item.href}">
            <span>${item.label}</span>
            <h3>${item.title}</h3>
            <p>${item.copy}</p>
          </a>
        `;
      })
      .join("")}`;
    docArticle.insertAdjacentElement("afterend", resourceSidebar);
  }
}
