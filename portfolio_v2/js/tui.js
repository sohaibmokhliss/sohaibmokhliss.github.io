import { LanguageManager } from "./language.js";

const SECTION_CONFIG = [
  { key: "home", icon: "01" },
  { key: "experience", icon: "02" },
  { key: "projects", icon: "03" },
  { key: "skills", icon: "04" },
  { key: "certifications", icon: "05" },
];

const HOME_LABELS = {
  en: ["Profile", "Background", "Current Focus", "Contact"],
  fr: ["Profil", "Parcours", "Focus actuel", "Contact"],
};

const state = {
  data: new Map(),
  currentSection: localStorage.getItem("portfolio-section") || "home",
  itemIndexes: {},
  theme: resolveInitialTheme(),
  attached: false,
  introMotionPlayed: false,
};

const elements = {};

function getThemeControlCopy() {
  if (state.theme === "dark") {
    return { icon: "☀️", label: "Switch to light mode" };
  }
  return { icon: "🌙", label: "Switch to dark mode" };
}

function getLanguageToggleCopy() {
  if (LanguageManager.currentLang === "fr") {
    return { label: "FR", title: "Switch language to English" };
  }
  return { label: "EN", title: "Basculer la langue en francais" };
}

function resolveInitialTheme() {
  const savedTheme = localStorage.getItem("portfolio-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return document.body.classList.contains("lightmode") ? "light" : "dark";
}

function cacheElements() {
  elements.layout = document.getElementById("layout");
  elements.sidebar = document.getElementById("sidebar");
  elements.mobileSections = document.getElementById("mobile-sections");
  elements.mainContent = document.getElementById("main-content");
  elements.themeToggle = document.getElementById("theme-toggle");
  elements.modal = document.getElementById("image-modal");
  elements.modalImage = document.getElementById("modal-image");
  elements.modalClose = document.querySelector(".image-modal-close");
  elements.modalPrev = document.querySelector(".image-modal-prev");
  elements.modalNext = document.querySelector(".image-modal-next");
  elements.modalCounter = document.querySelector(".image-modal-counter");
  elements.windowTitle = document.querySelector(".window-title");
  elements.mobileNavToggle = document.getElementById("mobile-nav-toggle");
  elements.mobileBackdrop = document.getElementById("mobile-sidebar-backdrop");
}

function getTranslations() {
  return LanguageManager.translations[LanguageManager.currentLang] || LanguageManager.translations.en;
}

function toPlainText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\{\{([^}]+)\}\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function decorateText(text) {
  return String(text || "").replace(/\{\{([^}]+)\}\}/g, '<span class="text-accent">$1</span>');
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLinks(item, sectionKey) {
  const links = [];
  if (item.githubUrl) {
    links.push({ href: item.githubUrl, label: "GitHub" });
  }
  if (item.demoUrl) {
    links.push({ href: item.demoUrl, label: "Live Demo" });
  }
  if (item.reportUrl) {
    links.push({ href: item.reportUrl, label: "Report" });
  }
  if (sectionKey === "certifications" && item.certificateUrl) {
    links.push({ href: item.certificateUrl, label: "Certificate" });
  }
  return links;
}

function getSectionData(sectionKey) {
  return state.data.get(sectionKey)?.data || [];
}

function clampIndex(sectionKey, index) {
  const length = getSectionData(sectionKey).length;
  if (!length) {
    return 0;
  }
  return Math.max(0, Math.min(index, length - 1));
}

function getCurrentItemIndex(sectionKey = state.currentSection) {
  return clampIndex(sectionKey, state.itemIndexes[sectionKey] || 0);
}

function setCurrentItemIndex(index, options = {}) {
  const nextIndex = clampIndex(state.currentSection, index);
  state.itemIndexes[state.currentSection] = nextIndex;
  render();
  if (options.scrollIntoView) {
    focusActiveCard();
  }
}

function scrollContentToTop() {
  const scroller = document.scrollingElement || document.documentElement;
  scroller.scrollTo({ top: 0, behavior: "smooth" });
}

function setCurrentSection(sectionKey, options = {}) {
  if (!SECTION_CONFIG.some((section) => section.key === sectionKey)) {
    return;
  }

  state.currentSection = sectionKey;
  localStorage.setItem("portfolio-section", sectionKey);
  state.itemIndexes[sectionKey] = clampIndex(sectionKey, state.itemIndexes[sectionKey] || 0);
  render();

  if (options.scrollToTop) {
    scrollContentToTop();
  } else if (options.scrollIntoView) {
    focusActiveCard();
  }
}

function getSectionItems(sectionKey) {
  const items = getSectionData(sectionKey);
  const lang = LanguageManager.currentLang;

  if (sectionKey === "home") {
    const labels = HOME_LABELS[lang] || HOME_LABELS.en;
    return items.map((item, index) => ({
      title: labels[index] || `Block ${index + 1}`,
      subtitle: toPlainText(item.content?.[0] || ""),
    }));
  }

  if (sectionKey === "experience") {
    return items.map((item) => ({
      title: item.company || item.name || "Experience",
      subtitle: toPlainText(item.name || item.title || ""),
    }));
  }

  if (sectionKey === "projects") {
    return items.map((item) => ({
      title: item.name || "Project",
      subtitle: Array.isArray(item.technologies) ? item.technologies.slice(0, 3).join(" • ") : "",
    }));
  }

  if (sectionKey === "skills") {
    return items.map((item) => ({
      title: item.name || "Skill",
      subtitle: toPlainText(item.content?.[0] || ""),
    }));
  }

  return items.map((item) => ({
    title: item.name || item.title || "Certification",
    subtitle: toPlainText(item.issuer || item.date || ""),
  }));
}

function renderSidebar() {
  if (!elements.sidebar) {
    return;
  }

  const t = getTranslations();
  const themeControl = getThemeControlCopy();
  const languageControl = getLanguageToggleCopy();
  const sectionNav = SECTION_CONFIG.map((section) => {
    const isActiveSection = section.key === state.currentSection;
    return `
      <button class="sidebar-section-button${isActiveSection ? " active" : ""}" type="button" data-section-button="${section.key}" style="--section-index:${SECTION_CONFIG.indexOf(section)}">
        <span class="sidebar-section-copy">
          <span class="sidebar-section-title">${escapeHtml(t[section.key] || section.key)}</span>
        </span>
      </button>
    `;
  }).join("");

  elements.sidebar.innerHTML = `
    <div class="portfolio-sidebar-shell">
      <div class="sidebar-brand">
        <p class="sidebar-brand-kicker">Portfolio</p>
        <h1 class="sidebar-brand-title">Sohaib Mokhliss</h1>
        <p class="sidebar-brand-copy">Development, DevOps, and security-aware engineering.</p>
      </div>
      <div class="sidebar-controls">
        <div class="sidebar-control-group">
          <button class="sidebar-chip sidebar-toggle-chip" type="button" data-sidebar-lang-toggle title="${languageControl.title}" aria-label="${languageControl.title}">
            <span class="sidebar-chip-copy">${languageControl.label}</span>
          </button>
          <button class="sidebar-chip sidebar-toggle-chip sidebar-theme-chip${state.theme === "light" ? " light" : " dark"}" type="button" data-sidebar-theme-toggle aria-pressed="${state.theme === "light"}" title="${themeControl.label}" aria-label="${themeControl.label}">
            <span class="sidebar-chip-icon">${themeControl.icon}</span>
          </button>
          <button class="sidebar-chip sidebar-mode-chip" type="button" data-sidebar-mode-toggle aria-label="${elements.layout?.classList.contains("terminal-mode") ? "Switch to GUI mode" : "Switch to terminal mode"}">
            <span class="sidebar-chip-icon">${elements.layout?.classList.contains("terminal-mode") ? "🖥️" : "⌨️"}</span>
            <span class="sidebar-chip-copy">${elements.layout?.classList.contains("terminal-mode") ? "GUI" : "Terminal"}</span>
          </button>
        </div>
      </div>
      <nav class="sidebar-section-nav" aria-label="Sections">
        ${sectionNav}
      </nav>
    </div>
  `;
}

function renderMobileSections() {
  if (!elements.mobileSections) {
    return;
  }

  const t = getTranslations();
  const themeControl = getThemeControlCopy();
  const languageControl = getLanguageToggleCopy();

  elements.mobileSections.innerHTML = `
    <div class="mobile-topbar">
      <div class="mobile-brand">
        <p class="mobile-brand-kicker">Portfolio</p>
        <p class="mobile-brand-title">Sohaib Mokhliss</p>
      </div>
      <div class="mobile-control-row">
        <button class="sidebar-chip mobile-chip sidebar-toggle-chip" type="button" data-sidebar-lang-toggle title="${languageControl.title}" aria-label="${languageControl.title}">
          <span class="sidebar-chip-copy">${languageControl.label}</span>
        </button>
        <button class="sidebar-chip mobile-chip sidebar-toggle-chip sidebar-theme-chip${state.theme === "light" ? " light" : " dark"}" type="button" data-sidebar-theme-toggle aria-pressed="${state.theme === "light"}" title="${themeControl.label}" aria-label="${themeControl.label}">
          <span class="sidebar-chip-icon">${themeControl.icon}</span>
        </button>
        <button class="sidebar-chip mobile-chip sidebar-mode-chip" type="button" data-sidebar-mode-toggle>
          <span class="sidebar-chip-icon">${elements.layout?.classList.contains("terminal-mode") ? "🖥️" : "⌨️"}</span>
          <span class="sidebar-chip-copy">${elements.layout?.classList.contains("terminal-mode") ? "GUI" : "Terminal"}</span>
        </button>
      </div>
    </div>
    <div class="mobile-section-row" aria-label="Portfolio sections">
      ${SECTION_CONFIG.map((section) => `
        <button class="mobile-section-pill${section.key === state.currentSection ? " active" : ""}" type="button" data-section-button="${section.key}">
          <span>${escapeHtml(t[section.key] || section.key)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderProjectImages(project, activeIndex) {
  if (!Array.isArray(project.images) || project.images.length === 0) {
    return "";
  }

  return `
    <section class="project-preview-panel" aria-label="${escapeHtml(project.name)} preview">
      <div class="project-preview-header">
        <p class="project-preview-kicker">Preview</p>
        <p class="project-preview-meta">${project.images.length} screenshot${project.images.length === 1 ? "" : "s"}</p>
      </div>
      <div class="project-image-grid">
        ${project.images.map((image, imageIndex) => `
          <button
            class="project-image-button"
            type="button"
            data-image-src="/images/${escapeHtml(image)}"
            data-image-alt="${escapeHtml(`${project.name} screenshot ${imageIndex + 1}`)}"
            aria-label="Open ${escapeHtml(project.name)} screenshot ${imageIndex + 1}"
          >
            <img src="/images/${escapeHtml(image)}" alt="${escapeHtml(`${project.name} screenshot ${imageIndex + 1}`)}" loading="lazy">
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderLinks(links) {
  if (!links.length) {
    return "";
  }

  return `
    <div class="card-links">
      ${links.map((link) => `
        <a class="card-link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
      `).join("")}
    </div>
  `;
}

function renderHomeCards(data, activeIndex) {
  const labels = HOME_LABELS[LanguageManager.currentLang] || HOME_LABELS.en;
  return data.map((block, index) => `
    <article class="portfolio-card${index === activeIndex ? " active" : ""}" data-card-index="${index}" style="--card-index:${index}">
      <div class="portfolio-card-header">
        <p class="portfolio-card-kicker">${escapeHtml(labels[index] || `Block ${index + 1}`)}</p>
      </div>
      <div class="portfolio-prose">
        ${(block.content || []).map((line) => `<p>${decorateText(line)}</p>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderExperienceCards(data, activeIndex) {
  return data.map((item, index) => `
    <article class="portfolio-card${index === activeIndex ? " active" : ""}" data-card-index="${index}" style="--card-index:${index}">
      <div class="portfolio-card-header">
        <div>
          <p class="portfolio-card-kicker">${escapeHtml(item.company || "Experience")}</p>
          <h3 class="portfolio-card-title">${escapeHtml(item.name || item.title || "Role")}</h3>
        </div>
        <p class="portfolio-card-meta">${escapeHtml(item.date || "")}</p>
      </div>
      <div class="portfolio-prose">
        ${(item.content || []).map((line) => `<p>${decorateText(line)}</p>`).join("")}
      </div>
      ${Array.isArray(item.technologies) && item.technologies.length ? `
        <div class="tag-row">
          ${item.technologies.map((tech) => `<span class="tag">${escapeHtml(tech)}</span>`).join("")}
        </div>
      ` : ""}
    </article>
  `).join("");
}

function renderProjectCards(data, activeIndex) {
  return data.map((item, index) => `
    <article class="portfolio-card${index === activeIndex ? " active" : ""}" data-card-index="${index}" style="--card-index:${index}">
      <div class="portfolio-card-header">
        <div>
          <p class="portfolio-card-kicker">Project</p>
          <h3 class="portfolio-card-title">${escapeHtml(item.name || "Project")}</h3>
          ${renderLinks(buildLinks(item, "projects"))}
        </div>
        <p class="portfolio-card-meta">${escapeHtml(item.year || "")}</p>
      </div>
      ${renderProjectImages(item, index)}
      <div class="portfolio-prose">
        ${(item.content || []).map((line) => `<p>${decorateText(line)}</p>`).join("")}
      </div>
      ${Array.isArray(item.technologies) && item.technologies.length ? `
        <div class="tag-row">
          ${item.technologies.map((tech) => `<span class="tag">${escapeHtml(tech)}</span>`).join("")}
        </div>
      ` : ""}
    </article>
  `).join("");
}

function renderSkillCards(data, activeIndex) {
  return data.map((item, index) => `
    <article class="portfolio-card${index === activeIndex ? " active" : ""}" data-card-index="${index}" style="--card-index:${index}">
      <div class="portfolio-card-header">
        <div>
          <p class="portfolio-card-kicker">Skill Area</p>
          <h3 class="portfolio-card-title">${escapeHtml(item.name || "Skill")}</h3>
        </div>
      </div>
      <div class="portfolio-prose">
        ${(item.content || []).map((line) => `<p>${decorateText(line)}</p>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderCertificationCards(data, activeIndex) {
  return data.map((item, index) => `
    <article class="portfolio-card${index === activeIndex ? " active" : ""}" data-card-index="${index}" style="--card-index:${index}">
      <div class="portfolio-card-header">
        <div>
          <p class="portfolio-card-kicker">${escapeHtml(item.issuer || "Certification")}</p>
          <h3 class="portfolio-card-title">${escapeHtml(item.name || item.title || "Certification")}</h3>
        </div>
        <p class="portfolio-card-meta">${escapeHtml(item.date || "")}</p>
      </div>
      <div class="portfolio-prose">
        ${(item.content || []).map((line) => `<p>${decorateText(line)}</p>`).join("")}
      </div>
      ${renderLinks(buildLinks(item, "certifications"))}
    </article>
  `).join("");
}

function renderCards() {
  const data = getSectionData(state.currentSection);
  const activeIndex = getCurrentItemIndex();

  if (state.currentSection === "home") {
    return renderHomeCards(data, activeIndex);
  }
  if (state.currentSection === "experience") {
    return renderExperienceCards(data, activeIndex);
  }
  if (state.currentSection === "projects") {
    return renderProjectCards(data, activeIndex);
  }
  if (state.currentSection === "skills") {
    return renderSkillCards(data, activeIndex);
  }
  return renderCertificationCards(data, activeIndex);
}

function renderMainContent() {
  if (!elements.mainContent) {
    return;
  }

  const t = getTranslations();
  const itemCount = getSectionData(state.currentSection).length;

  elements.mainContent.innerHTML = `
    <section class="content-shell" data-section="${state.currentSection}">
      <div class="content-shell-header">
        <div>
          <p class="content-shell-kicker">Portfolio</p>
          <h2 class="content-shell-title">${escapeHtml(t[state.currentSection] || state.currentSection)}</h2>
        </div>
        <p class="content-shell-meta">${itemCount} item${itemCount === 1 ? "" : "s"}</p>
      </div>
      <div class="content-card-grid">
        ${renderCards()}
      </div>
    </section>
  `;
}

function renderTaskbar() {
  return;
}

function render() {
  const shouldPlayIntroMotion = !state.introMotionPlayed;
  document.body.classList.toggle("portfolio-intro-motion", shouldPlayIntroMotion);
  renderSidebar();
  renderMobileSections();
  renderMainContent();
  renderTaskbar();

  if (elements.windowTitle) {
    elements.windowTitle.textContent = getTranslations().windowTitle;
  }

  document.body.setAttribute("data-current-section", state.currentSection);

  if (shouldPlayIntroMotion) {
    state.introMotionPlayed = true;
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.body.classList.remove("portfolio-intro-motion");
      }, 850);
    });
  }
}

function focusActiveCard() {
  const activeCard = document.querySelector(`.portfolio-card[data-card-index="${getCurrentItemIndex()}"]`);
  if (activeCard) {
    requestAnimationFrame(() => {
      activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}

function applyTheme(theme) {
  state.theme = theme === "light" ? "light" : "dark";
  localStorage.setItem("portfolio-theme", state.theme);
  document.documentElement.setAttribute("data-theme", state.theme);
  document.body.classList.toggle("lightmode", state.theme === "light");
  document.body.classList.toggle("darkmode", state.theme === "dark");

  const themeColor = state.theme === "light" ? "#f3efe4" : "#0d1117";
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", themeColor);
  }
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
  render();
}

function updateModalImage() {
  if (!elements.modalImage || !state.modalGallery) {
    return;
  }

  const { images, index, projectName } = state.modalGallery;
  const image = images[index];
  elements.modalImage.src = `/images/${image}`;
  elements.modalImage.alt = `${projectName} screenshot ${index + 1}`;
  if (elements.modalCounter) {
    elements.modalCounter.textContent = `${index + 1} / ${images.length}`;
  }
  if (elements.modalPrev) {
    elements.modalPrev.disabled = index <= 0;
  }
  if (elements.modalNext) {
    elements.modalNext.disabled = index >= images.length - 1;
  }
}

function openImageModal(projectName, images, index) {
  if (!elements.modal || !elements.modalImage || !Array.isArray(images) || !images.length) {
    return;
  }

  state.modalGallery = { projectName, images, index: Math.max(0, Math.min(index, images.length - 1)) };
  updateModalImage();
  elements.modal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeImageModal() {
  if (!elements.modal || !elements.modalImage) {
    return;
  }

  elements.modal.classList.remove("open");
  elements.modalImage.removeAttribute("src");
  state.modalGallery = null;
  document.body.classList.remove("modal-open");
}

function stepModalImage(direction) {
  if (!state.modalGallery) return;
  const nextIndex = state.modalGallery.index + direction;
  if (nextIndex < 0 || nextIndex >= state.modalGallery.images.length) return;
  state.modalGallery.index = nextIndex;
  updateModalImage();
}

async function loadAllSections() {
  const results = await Promise.all(SECTION_CONFIG.map(async (section) => {
    try {
      const payload = await LanguageManager.fetchSectionData(section.key, { forceRefresh: true });
      return [section.key, payload];
    } catch (error) {
      console.error(`[PortfolioUI] Failed to load ${section.key}:`, error);
      return [section.key, { data: [] }];
    }
  }));

  state.data = new Map(results);

  if (!SECTION_CONFIG.some((section) => section.key === state.currentSection)) {
    state.currentSection = "home";
  }

  SECTION_CONFIG.forEach((section) => {
    state.itemIndexes[section.key] = clampIndex(section.key, state.itemIndexes[section.key] || 0);
  });
}

function handleDocumentClick(event) {
  const sectionButton = event.target.closest("[data-section-button]");
  if (sectionButton) {
    setCurrentSection(sectionButton.getAttribute("data-section-button"), { scrollToTop: true });
    return;
  }

  const sidebarLangButton = event.target.closest("[data-sidebar-lang]");
  if (sidebarLangButton) {
    LanguageManager.setLanguage(sidebarLangButton.getAttribute("data-sidebar-lang"));
    return;
  }

  const sidebarLangToggle = event.target.closest("[data-sidebar-lang-toggle]");
  if (sidebarLangToggle) {
    LanguageManager.setLanguage(LanguageManager.currentLang === "en" ? "fr" : "en");
    return;
  }

  const sidebarThemeButton = event.target.closest("[data-sidebar-theme-toggle]");
  if (sidebarThemeButton) {
    toggleTheme();
    return;
  }

  const sidebarModeButton = event.target.closest("[data-sidebar-mode-toggle]");
  if (sidebarModeButton) {
    document.getElementById("mode-toggle-nav")?.click();
    return;
  }

  const imageButton = event.target.closest("[data-image-src]");
  if (imageButton) {
    const projectCard = imageButton.closest(".portfolio-card");
    const projectName = projectCard?.querySelector(".portfolio-card-title")?.textContent || "Portfolio image";
    const projectImages = projectCard ? Array.from(projectCard.querySelectorAll("[data-image-src]")).map((button) => button.getAttribute("data-image-src").replace(/^\/images\//, "")) : [];
    const index = projectImages.findIndex((img) => `/images/${img}` === imageButton.getAttribute("data-image-src"));
    openImageModal(projectName, projectImages, index < 0 ? 0 : index);
  }
}

function handleKeydown(event) {
  if (document.activeElement?.id === "terminal-input") {
    return;
  }

  if (elements.layout?.classList.contains("terminal-mode")) {
    if (event.key === "Escape") {
      closeImageModal();
    }
    return;
  }

  const sectionIndex = SECTION_CONFIG.findIndex((section) => section.key === state.currentSection);

  if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextSection = SECTION_CONFIG[(sectionIndex + 1) % SECTION_CONFIG.length];
    setCurrentSection(nextSection.key, { scrollToTop: true });
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const nextSection = SECTION_CONFIG[(sectionIndex - 1 + SECTION_CONFIG.length) % SECTION_CONFIG.length];
    setCurrentSection(nextSection.key, { scrollToTop: true });
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setCurrentItemIndex(getCurrentItemIndex() + 1, { scrollIntoView: true });
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    setCurrentItemIndex(getCurrentItemIndex() - 1, { scrollIntoView: true });
    return;
  }

  if (event.key === "Escape") {
    closeImageModal();
    return;
  }

  if (state.modalGallery) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepModalImage(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepModalImage(-1);
      return;
    }
  }
}

function attachEventListeners() {
  if (state.attached) {
    return;
  }

  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("languageChanged", async () => {
    await loadAllSections();
    render();
  });
  window.addEventListener("portfolioModeChanged", () => {
    render();
  });

  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", toggleTheme);
  }

  if (elements.modalClose) {
    elements.modalClose.addEventListener("click", closeImageModal);
  }
  if (elements.modalPrev) {
    elements.modalPrev.addEventListener("click", () => stepModalImage(-1));
  }
  if (elements.modalNext) {
    elements.modalNext.addEventListener("click", () => stepModalImage(1));
  }

  if (elements.modal) {
    elements.modal.addEventListener("click", (event) => {
      if (event.target === elements.modal) {
        closeImageModal();
      }
    });
  }

  if (elements.mobileNavToggle) {
    elements.mobileNavToggle.hidden = true;
  }

  if (elements.mobileBackdrop) {
    elements.mobileBackdrop.hidden = true;
  }

  const tutorial = document.getElementById("navigation-tutorial");
  if (tutorial) {
    tutorial.hidden = true;
  }

  state.attached = true;
}

async function init() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  cacheElements();
  applyTheme(state.theme);
  attachEventListeners();
  await loadAllSections();
  render();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => console.error("[PortfolioUI] Initialization failed:", error));
  });
} else {
  init().catch((error) => console.error("[PortfolioUI] Initialization failed:", error));
}
