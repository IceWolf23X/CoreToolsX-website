"use strict";

// Closes the responsive navigation and optionally returns focus to its trigger.
function closeNavigation(toggle, panel, restoreFocus = false) {
  panel.dataset.open = "false";
  toggle.setAttribute("aria-expanded", "false");
  if (restoreFocus) {
    toggle.focus();
  }
}

// Adds the mobile navigation behavior required by the FrameBaseCSS nav contract.
function initializeNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel) {
    return;
  }

  closeNavigation(toggle, panel);

  toggle.addEventListener("click", () => {
    const willOpen = panel.dataset.open !== "true";
    panel.dataset.open = String(willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNavigation(toggle, panel));
  });

  document.addEventListener("click", (event) => {
    if (panel.dataset.open === "true" && !panel.contains(event.target) && !toggle.contains(event.target)) {
      closeNavigation(toggle, panel);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.dataset.open === "true") {
      closeNavigation(toggle, panel, true);
    }
  });
}

// Lets Highlight.js process the declared YAML and properties blocks.
function initializeSyntaxHighlighting() {
  if (globalThis.hljs) {
    globalThis.hljs.highlightAll();
  }
}

// Initializes the small amount of behavior that semantic HTML and CSS cannot provide.
function initializeSite() {
  initializeNavigation();
  initializeSyntaxHighlighting();
}

document.addEventListener("DOMContentLoaded", initializeSite);
