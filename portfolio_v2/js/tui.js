// Import LanguageManager for translation support
import { LanguageManager } from './language.js';

const MAIN_CONTAINER = document.getElementById("main-container");
const LAYOUT = document.getElementById("layout");
const SIDEBAR = document.getElementById("sidebar");
const CONTENT = document.getElementById("content");
const SIDEBAR_TOGGLE = document.getElementById("sidebar-toggle");
const SIDEBAR_SCROLLBAR = document.getElementById("sidebar-scrollbar");
const SIDEBAR_SCROLLBAR_THUMB = document.getElementById("sidebar-scrollbar-thumb");

const HOME_SECTION = document.getElementById("home");
const SKILLS_SECTION = document.getElementById("skills");
const EXPERIENCE_SECTION = document.getElementById("experience");
const PROJECTS_SECTION = document.getElementById("projects");
const CERTIFICATIONS_SECTION = document.getElementById("certifications");
const FOOTER_SECTION = document.getElementById("footer");
const MAIN_CONTENT_SECTION = document
  .getElementById("main-content")
  ?.getElementsByClassName("container-content")[0];

const COLORS = ["text-blue", "text-orange", "text-pink"];

const SIDEBAR_SCROLLBAR_STATE = {
  rafId: null,
  isDragging: false,
  dragPointerId: null,
  dragStartY: 0,
  dragStartOffset: 0,
  resizeObserver: null,
};

const SIDEBAR_SCROLLBAR_MIN_THUMB = 48;

const IMAGE_MODAL_STATE = {
  closeHandlersBound: false,
};

const left_sections = [
  { name: "home", section: HOME_SECTION, items: [] },
  {
    name: "experience",
    section: EXPERIENCE_SECTION,
    items: [...EXPERIENCE_SECTION.firstElementChild.children[2].children],
  },
  {
    name: "projects",
    section: PROJECTS_SECTION,
    items: [...PROJECTS_SECTION.firstElementChild.children[2].children],
  },
  {
    name: "skills",
    section: SKILLS_SECTION,
    items: [...SKILLS_SECTION.firstElementChild.children[2].children],
  },
  {
    name: "certifications",
    section: CERTIFICATIONS_SECTION,
    items: [...CERTIFICATIONS_SECTION.firstElementChild.children[2].children],
  },
];

const currentPosition = {
  sectionIndex: 0,
  sectionItemIndex: 0,
};

const previousPosition = {
  sectionIndex: 0,
  sectionItemIndex: 0,
};

function clamp(min, value, max) {
  return Math.min(Math.max(min, value), max);
}

function scheduleSidebarScrollbarUpdate() {
  if (SIDEBAR_SCROLLBAR_STATE.rafId != null) {
    return;
  }

  SIDEBAR_SCROLLBAR_STATE.rafId = requestAnimationFrame(() => {
    SIDEBAR_SCROLLBAR_STATE.rafId = null;
    updateSidebarScrollbar();
  });
}

function updateSidebarScrollbar() {
  if (
    SIDEBAR == null ||
    SIDEBAR_SCROLLBAR == null ||
    SIDEBAR_SCROLLBAR_THUMB == null
  ) {
    return;
  }

  const scrollHeight = SIDEBAR.scrollHeight;
  const clientHeight = SIDEBAR.clientHeight;
  const trackHeight = SIDEBAR_SCROLLBAR.clientHeight;
  const maxScrollTop = Math.max(0, scrollHeight - clientHeight);

  if (trackHeight <= 0 || maxScrollTop <= 0) {
    SIDEBAR_SCROLLBAR.classList.remove("is-visible");
    SIDEBAR_SCROLLBAR.dataset.maxScrollTop = "0";
    SIDEBAR_SCROLLBAR.dataset.maxThumbOffset = "0";
    SIDEBAR_SCROLLBAR.dataset.thumbOffset = "0";
    SIDEBAR_SCROLLBAR.dataset.thumbHeight = "0";
    SIDEBAR_SCROLLBAR_THUMB.style.height = "0px";
    SIDEBAR_SCROLLBAR_THUMB.style.transform = "translateY(0)";
    return;
  }

  const thumbHeight = Math.max(
    Math.round((clientHeight / scrollHeight) * trackHeight),
    SIDEBAR_SCROLLBAR_MIN_THUMB,
  );

  const maxThumbOffset = Math.max(0, trackHeight - thumbHeight);
  const thumbOffset =
    maxThumbOffset === 0
      ? 0
      : (SIDEBAR.scrollTop / maxScrollTop) * maxThumbOffset;

  SIDEBAR_SCROLLBAR.classList.add("is-visible");
  SIDEBAR_SCROLLBAR_THUMB.style.height = `${thumbHeight}px`;
  SIDEBAR_SCROLLBAR_THUMB.style.transform = `translateY(${thumbOffset}px)`;

  SIDEBAR_SCROLLBAR.dataset.maxScrollTop = `${maxScrollTop}`;
  SIDEBAR_SCROLLBAR.dataset.maxThumbOffset = `${maxThumbOffset}`;
  SIDEBAR_SCROLLBAR.dataset.thumbOffset = `${thumbOffset}`;
  SIDEBAR_SCROLLBAR.dataset.thumbHeight = `${thumbHeight}`;
}

function setSidebarScrollTopFromThumbOffset(offset) {
  if (SIDEBAR == null || SIDEBAR_SCROLLBAR == null) {
    return;
  }

  const maxScrollTop = parseFloat(SIDEBAR_SCROLLBAR.dataset.maxScrollTop || "0");
  const maxThumbOffset = parseFloat(
    SIDEBAR_SCROLLBAR.dataset.maxThumbOffset || "0",
  );

  if (maxScrollTop <= 0) {
    return;
  }

  const adjustedOffset = clamp(0, offset, maxThumbOffset);
  const scrollTop =
    maxThumbOffset === 0
      ? 0
      : (adjustedOffset / maxThumbOffset) * maxScrollTop;

  SIDEBAR.scrollTop = scrollTop;
}

function handleSidebarThumbPointerDown(event) {
  if (
    SIDEBAR_SCROLLBAR_THUMB == null ||
    SIDEBAR_SCROLLBAR_STATE.isDragging
  ) {
    return;
  }

  SIDEBAR_SCROLLBAR_STATE.isDragging = true;
  SIDEBAR_SCROLLBAR_STATE.dragPointerId = event.pointerId;
  SIDEBAR_SCROLLBAR_STATE.dragStartY = event.clientY;
  SIDEBAR_SCROLLBAR_STATE.dragStartOffset = parseFloat(
    SIDEBAR_SCROLLBAR.dataset.thumbOffset || "0",
  );

  try {
    SIDEBAR_SCROLLBAR_THUMB.setPointerCapture(event.pointerId);
  } catch (error) {
    /* noop - pointer capture is not critical for scroll syncing */
  }

  event.preventDefault();
}

function handleSidebarThumbPointerMove(event) {
  if (
    SIDEBAR_SCROLLBAR_STATE.isDragging === false ||
    SIDEBAR_SCROLLBAR_STATE.dragPointerId !== event.pointerId
  ) {
    return;
  }

  const delta = event.clientY - SIDEBAR_SCROLLBAR_STATE.dragStartY;
  const targetOffset =
    SIDEBAR_SCROLLBAR_STATE.dragStartOffset + delta;

  setSidebarScrollTopFromThumbOffset(targetOffset);
}

function resetSidebarThumbDragState() {
  SIDEBAR_SCROLLBAR_STATE.isDragging = false;
  SIDEBAR_SCROLLBAR_STATE.dragPointerId = null;
  SIDEBAR_SCROLLBAR_STATE.dragStartY = 0;
  SIDEBAR_SCROLLBAR_STATE.dragStartOffset = 0;
}

function handleSidebarThumbPointerUp(event) {
  if (
    SIDEBAR_SCROLLBAR_STATE.isDragging === false ||
    SIDEBAR_SCROLLBAR_THUMB == null
  ) {
    return;
  }

  if (SIDEBAR_SCROLLBAR_STATE.dragPointerId === event.pointerId) {
    try {
      SIDEBAR_SCROLLBAR_THUMB.releasePointerCapture(event.pointerId);
    } catch (error) {
      /* noop - pointer capture is not critical for scroll syncing */
    }
  }

  resetSidebarThumbDragState();
}

function handleSidebarThumbPointerCancel(event) {
  if (SIDEBAR_SCROLLBAR_THUMB == null) {
    return;
  }

  if (SIDEBAR_SCROLLBAR_STATE.dragPointerId === event.pointerId) {
    try {
      SIDEBAR_SCROLLBAR_THUMB.releasePointerCapture(event.pointerId);
    } catch (error) {
      /* noop - pointer capture is not critical for scroll syncing */
    }
  }

  resetSidebarThumbDragState();
}

function handleSidebarTrackPointerDown(event) {
  if (
    SIDEBAR_SCROLLBAR == null ||
    SIDEBAR_SCROLLBAR_THUMB == null ||
    event.target === SIDEBAR_SCROLLBAR_THUMB
  ) {
    return;
  }

  const trackRect = SIDEBAR_SCROLLBAR.getBoundingClientRect();
  const thumbHeight = parseFloat(
    SIDEBAR_SCROLLBAR.dataset.thumbHeight || "0",
  );
  const maxThumbOffset = parseFloat(
    SIDEBAR_SCROLLBAR.dataset.maxThumbOffset || "0",
  );

  if (maxThumbOffset <= 0) {
    return;
  }

  const clickOffset = event.clientY - trackRect.top - thumbHeight / 2;
  const targetOffset = clamp(0, clickOffset, maxThumbOffset);

  setSidebarScrollTopFromThumbOffset(targetOffset);
}
function scrollContentTop() {
  if (!CONTENT) return;
  // Use smooth scrolling when switching sections
  CONTENT.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSidebar() {
  if (!LAYOUT) return;
  LAYOUT.classList.toggle('sidebar-open');
}

function updateTaskbarActive(sectionName) {
  // Remove active class from all taskbar items
  document.querySelectorAll('.os-taskbar-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add active class to current section
  const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

function initTaskbarListeners() {
  // Handle taskbar section clicks
  document.querySelectorAll('.os-taskbar-item[data-section]').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const sectionName = item.dataset.section;

      // Find section index by name
      const sectionIndex = left_sections.findIndex(s => s.name === sectionName);
      if (sectionIndex !== -1) {
        goToSection(sectionIndex, 0);
        await render(true);
        updateTaskbarActive(sectionName);
      }
    });
  });

  // Handle sidebar toggle
  if (SIDEBAR_TOGGLE) {
    SIDEBAR_TOGGLE.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
  }

  // Handle theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function isMobile() {
  return window.innerWidth <= 768;
}

// Theme management
const ThemeManager = {
  currentTheme: 'dark',

  init() {
    // Get saved theme from localStorage or default to 'dark'
    this.currentTheme = localStorage.getItem('portfolio-theme') || 'dark';
    this.applyTheme(this.currentTheme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'dark' ? 'darkmode' : 'lightmode';
    this.currentTheme = theme;
  },

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('portfolio-theme', theme);
    this.applyTheme(theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const metaNavColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
    const newColor = theme === 'dark' ? '#0d1117' : '#f8fafc';

    if (metaThemeColor) metaThemeColor.content = newColor;
    if (metaNavColor) metaNavColor.content = newColor;
  }
};

function toggleTheme() {
  ThemeManager.toggleTheme();
}




function getRandomTextColorClass() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function colorizeString(str) {
  return str
    .replaceAll("{{", () => `<span class="${getRandomTextColorClass()}">`)
    .replaceAll("}}", "</span>");
}

function colorizeCode() {
  const element = document.getElementsByTagName("code")[0];

  if (element == null) {
    return;
  }

  const text = element.innerText;
  const language = element.classList[0];

  const keywords = {
    js: javascriptKeywords,
    ts: typescriptKeywords,
    sql: sqlKeywords,
    mjs: nodeKeywords,
    html: htmlKeywords,
    css: cssKeywords,
    go: goKeywords,
    c: cKeywords,
    graphql: graphqlKeywords,
    tsx: reactKeywords,
    test: testKeywords,
    sh: bashKeywords,
    yml: yamlKeywords,
    ino: arduinoKeywords,
  }[language];

  if (keywords == null) {
    return;
  }

  let coloredText = text;

  keywords.forEach((subKeywords, i) => {
    if (subKeywords.length === 0) {
      return;
    }

    const regex = new RegExp(`\\b(${subKeywords.join("|")})\\b`, "g");
    coloredText = coloredText.replaceAll(
      regex,
      (match) => `<span class="${COLORS[i]}">${match}</span>`,
    );
  });

  element.innerHTML = coloredText;
}

async function getCodeSnippet(snippet) {
  const response = await fetch(`data/snippets/snippet.${snippet}`);
  const text = await response.text();

  return text;
}

function isVisibleInScrollView(element, container) {
  const elementTop = element.offsetTop;
  const elementBottom = elementTop + element.clientHeight;

  const containerTop = container.scrollTop;
  const containerBottom = containerTop + container.clientHeight;

  return elementTop >= containerTop && elementBottom <= containerBottom;
}

function onHamburgerMenuPress() {
  const hamburgerButtonElement =
    document.getElementsByName("hamburger-toggle")[0];
  const navContainerElement =
    document.getElementsByClassName("nav-container")[0];

  if (hamburgerButtonElement.checked) {
    SIDEBAR.classList.add("menu-open");
    navContainerElement.style.opacity = 1;
  } else {
    SIDEBAR.classList.remove("menu-open");
    navContainerElement.style.opacity = 0.9;
  }
}

function closeHamburgerMenu() {
  const hamburgerButtonElement =
    document.getElementsByName("hamburger-toggle")[0];
  hamburgerButtonElement.checked = false;
  SIDEBAR.classList.remove("menu-open");
}

function clearMainContent() {
  if (!MAIN_CONTENT_SECTION) return;
  MAIN_CONTENT_SECTION.innerHTML = "";
  MAIN_CONTENT_SECTION.scrollTo({ top: 0 });
}

function createProfilePictureElement() {
  const profilePicContainer = document.createElement("div");
  profilePicContainer.id = "terminal-profile-pic-container";

  const profilePicImg = document.createElement("img");
  profilePicImg.src = "images/profilePic.jpg";
  profilePicImg.alt = "Sohaib Mokhliss";
  profilePicImg.id = "terminal-profile-pic";

  profilePicContainer.appendChild(profilePicImg);
  return profilePicContainer;
}

function setupProfilePicModal() {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-image");
  const closeBtn = document.querySelector(".image-modal-close");

  if (!modal || !modalImg || !closeBtn) {
    return;
  }

  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (!IMAGE_MODAL_STATE.closeHandlersBound) {
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
      }
    });
    IMAGE_MODAL_STATE.closeHandlersBound = true;
  }

  const profilePic = document.getElementById("terminal-profile-pic");
  if (!profilePic || profilePic.dataset.modalBound === "true") {
    return;
  }

  profilePic.addEventListener("click", () => {
    modal.classList.add("active");
    modalImg.src = profilePic.currentSrc || profilePic.src;
    modalImg.alt = profilePic.alt || "Profile picture";
    document.body.style.overflow = "hidden";
  });

  profilePic.dataset.modalBound = "true";
}
let isDisplayingContent = false;

async function displayContent() {
  if (isDisplayingContent || !MAIN_CONTENT_SECTION) {
    return;
  }

  isDisplayingContent = true;
  try {
    clearMainContent();

    const sectionName = left_sections[currentPosition.sectionIndex].name;
    let payload;

    try {
      payload = await LanguageManager.fetchSectionData(sectionName);
    } catch (error) {
      console.error(`[TUI] Failed to load "${sectionName}" content:`, error);

      const errorOuter = document.createElement('div');
      errorOuter.classList.add('outer-paragraph-container');

      const errorInner = document.createElement('div');
      errorInner.classList.add('inner-paragraph-container');

      const headline = document.createElement('p');
      headline.classList.add('text-orange');
      headline.textContent = `Unable to load ${sectionName} content.`;
      errorInner.appendChild(headline);

      const hint = document.createElement('p');
      hint.textContent = 'Please try switching languages or reloading the page.';
      errorInner.appendChild(hint);

      errorOuter.appendChild(errorInner);
      MAIN_CONTENT_SECTION.appendChild(errorOuter);
      return;
    }

    const resolvedLang = payload?.__language || LanguageManager.currentLang;
    const contentEntries = Array.isArray(payload?.data) ? payload.data : [];

    const outerContainerElement = document.createElement("div");
    outerContainerElement.classList.add("outer-paragraph-container");

    if (sectionName === "home") {
      outerContainerElement.appendChild(createProfilePictureElement());
    }

    const innerContainerElement = document.createElement("div");
    innerContainerElement.classList.add("inner-paragraph-container");

    if (sectionName !== "home") {
      innerContainerElement.classList.add("mt-4");

      const sectionData = contentEntries[currentPosition.sectionItemIndex];

      if (!sectionData) {
        const missing = document.createElement('p');
        missing.classList.add('text-orange');
        missing.textContent = 'Content unavailable for this selection.';
        innerContainerElement.appendChild(missing);
        outerContainerElement.appendChild(innerContainerElement);
        MAIN_CONTENT_SECTION.appendChild(outerContainerElement);
        return;
      }

      const topElement = document.createElement("div");

      const titleElement = document.createElement("h1");
      titleElement.innerHTML =
        sectionData.title != null
          ? `<span class="${getRandomTextColorClass()}">${sectionData.title}</span>`
          : null;

      const dateElement = document.createElement("h2");
      dateElement.innerHTML =
        sectionData.date != null
          ? `<span class="${getRandomTextColorClass()}">${sectionData.date}</span>`
          : null;

      const yearElement = document.createElement("h2");
      yearElement.innerHTML =
        sectionData.year != null
          ? `[Built in <span class="${getRandomTextColorClass()}">${sectionData.year}</span>]`
          : null;

      const technologiesContainerElement = document.createElement("div");
      technologiesContainerElement.classList.add("technologies-row");
      technologiesContainerElement.innerHTML =
        sectionData.technologies?.map((t) => colorizeString(t)).join(" ") || null;

      const githubButtonElement = document.createElement("a");
      githubButtonElement.classList.add("project-button");
      githubButtonElement.href = sectionData?.githubUrl;
      githubButtonElement.target = "_blank";
      githubButtonElement.innerText = "Github";

      const demoButtonElement = document.createElement("a");
      demoButtonElement.classList.add("project-button");
      demoButtonElement.href = sectionData?.demoUrl;
      demoButtonElement.target = "_blank";
      demoButtonElement.innerText = "Demo";

      const buttonsContainerElement = document.createElement("div");
      buttonsContainerElement.classList.add("buttons-container");

      if (sectionData?.githubUrl != null) {
        buttonsContainerElement.appendChild(githubButtonElement);
      }

      if (sectionData?.demoUrl != null) {
        buttonsContainerElement.appendChild(demoButtonElement);
      }

      if (sectionName === "certifications" && sectionData?.certificateUrl) {
        const certificateButtonElement = document.createElement("a");
        certificateButtonElement.classList.add("project-button");
        certificateButtonElement.href = sectionData.certificateUrl;
        certificateButtonElement.target = "_blank";
        certificateButtonElement.rel = "noopener";
        certificateButtonElement.innerText = "View Certificate";
        buttonsContainerElement.appendChild(certificateButtonElement);
      }

      if (sectionName === "projects" && sectionData?.reportUrl) {
        const reportButtonElement = document.createElement("a");
        reportButtonElement.classList.add("project-button");
        reportButtonElement.href = sectionData.reportUrl;
        reportButtonElement.target = "_blank";
        reportButtonElement.rel = "noopener";
        reportButtonElement.innerText = "View Report";
        buttonsContainerElement.appendChild(reportButtonElement);
      }

      if (titleElement.innerHTML != null) {
        topElement.appendChild(titleElement);
      }

      if (dateElement.innerHTML != null) {
        topElement.appendChild(dateElement);
      }

      if (yearElement.innerHTML != null) {
        topElement.appendChild(yearElement);
      }

      if (technologiesContainerElement.innerHTML != null) {
        topElement.appendChild(technologiesContainerElement);
      }

      const shouldRenderButtons = buttonsContainerElement.children.length > 0;
      const shouldRenderCertificate =
        sectionName === "certifications" && sectionData?.certificateUrl;
      const shouldRenderReport =
        sectionName === "projects" && sectionData?.reportUrl;
      const shouldRenderViewer = shouldRenderCertificate || shouldRenderReport;

      if (shouldRenderButtons) {
        topElement.appendChild(buttonsContainerElement);
      }

      const imageElements =
        sectionData.images?.map((imagePath) => {
          const imageInnerContainerElement = document.createElement("div");
          imageInnerContainerElement.style.minHeight = "200px";
          imageInnerContainerElement.classList.add("image-inner-container");

          const imageElement = document.createElement("img");
          imageElement.loading = "lazy";
          imageElement.alt = "Project image";
          imageElement.decoding = "async";
          imageElement.src = `images/${imagePath}`;
          imageElement.classList.add("project-image");

          imageInnerContainerElement.appendChild(imageElement);

          return imageInnerContainerElement;
        }) ?? [];

      (sectionData.content || []).forEach((contentBlock, index) => {
        const element = document.createElement("div");
        element.innerHTML = colorizeString(contentBlock).replaceAll("\n", "<br>");
        innerContainerElement.appendChild(element);

        if (index < imageElements.length) {
          const imageContainerElement = document.createElement("div");
          imageContainerElement.classList.add("image-container");
          imageContainerElement.appendChild(imageElements[index]);

          innerContainerElement.appendChild(imageContainerElement);
        }
      });

      if (sectionData?.snippet != null) {
        const snippetContainerElement = document.createElement("div");
        snippetContainerElement.classList.add("snippet-container");

        const snippetElement = document.createElement("pre");
        const codeElement = document.createElement("code");
        codeElement.classList.add(sectionData.snippet);
        snippetElement.appendChild(codeElement);
        codeElement.innerText = await getCodeSnippet(sectionData.snippet);

        snippetContainerElement.appendChild(snippetElement);
        innerContainerElement.appendChild(snippetContainerElement);
      }

      if (shouldRenderViewer) {
        const viewerWrapper = document.createElement("div");
        viewerWrapper.style.marginTop = shouldRenderButtons ? "16px" : "24px";

        const viewer = document.createElement("iframe");
        viewer.src = shouldRenderCertificate
          ? sectionData.certificateUrl
          : sectionData.reportUrl;
        const defaultTitle = shouldRenderCertificate ? "Certificate" : "Report";
        const entityName =
          sectionData.title || sectionData.name || sectionData.company || "";
        viewer.title =
          (entityName ? `${entityName} ` : "") + `${defaultTitle} preview`;
        viewer.loading = "lazy";
        viewer.style.width = "100%";
        viewer.style.minHeight = "520px";
        viewer.style.border = "1px solid rgba(148, 163, 184, 0.2)";
        viewer.style.borderRadius = "12px";
        viewer.style.backgroundColor = "rgba(15, 23, 42, 0.55)";
        viewer.style.boxShadow = "0 12px 32px rgba(15, 23, 42, 0.35)";

        viewerWrapper.appendChild(viewer);
        innerContainerElement.appendChild(viewerWrapper);
      }

      if (resolvedLang !== LanguageManager.currentLang) {
        const fallbackNotice = document.createElement('p');
        fallbackNotice.classList.add('text-orange');
        fallbackNotice.style.marginTop = '16px';
        fallbackNotice.textContent = 'Localized content is not available yet. Showing English instead.';
        innerContainerElement.appendChild(fallbackNotice);
      }

      innerContainerElement.prepend(topElement);
      outerContainerElement.appendChild(innerContainerElement);

      MAIN_CONTENT_SECTION.appendChild(outerContainerElement);

      colorizeCode();
    } else {
      contentEntries.forEach((entry) => {
        const element = document.createElement("div");

        (entry.content || []).forEach((paragraphText) => {
          const paragraph = document.createElement("p");
          paragraph.innerHTML = colorizeString(paragraphText);
          element.appendChild(paragraph);
        });

        innerContainerElement.appendChild(element);
      });

      if (resolvedLang !== LanguageManager.currentLang) {
        const fallbackNotice = document.createElement('p');
        fallbackNotice.classList.add('text-orange');
        fallbackNotice.style.marginTop = '16px';
        fallbackNotice.textContent = 'Localized content is not available yet. Showing English instead.';
        innerContainerElement.appendChild(fallbackNotice);
      }

      outerContainerElement.appendChild(innerContainerElement);
      MAIN_CONTENT_SECTION.appendChild(outerContainerElement);
    }

    setupProfilePicModal();
  } finally {
    isDisplayingContent = false;
  }
}

function clearSelectionStyling(scrollToTop) {
  if (isMobile()) {
    const selectedElement = document.getElementsByClassName("selected-item")[0];
    const selectedFrameElement =
      document.getElementsByClassName("selected-frame")[0];

    if (selectedElement != null) {
      selectedElement.classList.remove("selected-item");
    }

    if (selectedFrameElement != null) {
      selectedFrameElement.classList.remove("selected-frame");
    }
  }

  const previousSection = left_sections[previousPosition.sectionIndex];

  const previousSectionItemElement =
    previousSection.items[previousPosition.sectionItemIndex];

  const previousSectionItemIndexElement =
    previousSection.section.getElementsByClassName("list-index")[0]
      ?.firstElementChild;

  const scrollableContainerElement =
    previousSection.section.getElementsByClassName("ui-list")[0];

  previousSection.section.classList.remove("selected-frame");
  previousSectionItemElement?.classList.remove("selected-item");

  if (previousSectionItemIndexElement != null) {
    previousSectionItemIndexElement.innerText = `1 of ${previousSection.items.length}`;
  }

  if (scrollableContainerElement != null && scrollToTop) {
    scrollableContainerElement.scrollTo({ top: 0 });
  }
}

async function render(scrollToTop = false, isInitialRender = false) {
  if (
    !isMobile() &&
    !isInitialRender &&
    currentPosition.sectionIndex === previousPosition.sectionIndex &&
    currentPosition.sectionItemIndex === previousPosition.sectionItemIndex
  ) {
    return;
  }

  const currentSection = left_sections[currentPosition.sectionIndex];

  const currentSectionItemElement =
    currentSection.items?.[currentPosition.sectionItemIndex];

  const currentSectionItemIndexElement =
    currentSection.section.getElementsByClassName("list-index")[0]
      ?.firstElementChild;

  const scrollableContainerElement =
    currentSection.section.getElementsByClassName("ui-list")[0];

  clearSelectionStyling(scrollToTop);

  currentSection.section.classList.add("selected-frame");
  currentSectionItemElement?.classList.add("selected-item");

  if (currentSectionItemIndexElement != null) {
    currentSectionItemIndexElement.innerText = `${currentPosition.sectionItemIndex + 1} of ${currentSection.items.length}`;
  }

  // FIXME: not optimal, sometimes, jumps a bit too far
  // but it doesn't impair the user experience too much
  if (scrollableContainerElement != null && currentSectionItemElement != null) {
    if (
      !isVisibleInScrollView(
        currentSectionItemElement,
        scrollableContainerElement,
      ) &&
      previousPosition.sectionItemIndex !== currentPosition.sectionItemIndex
    ) {
      const gap = parseInt(
        window.getComputedStyle(currentSectionItemElement).gap,
      );

      scrollableContainerElement.scrollBy({
        top:
          previousPosition.sectionItemIndex < currentPosition.sectionItemIndex
            ? currentSectionItemElement.clientHeight + gap
            : -currentSectionItemElement.clientHeight - gap,
        behavior: "instant",
      });
    }
  }

  if (!isInitialRender) {
    displayContent();
    // Scroll content pane to top when switching sections
    if (currentPosition.sectionIndex !== previousPosition.sectionIndex) {
      requestAnimationFrame(scrollContentTop);
      // Update taskbar active state
      updateTaskbarActive(left_sections[currentPosition.sectionIndex].name);
    }
  } else {
    // On initial render, also display content to respect language settings
    displayContent();
  }

  scheduleSidebarScrollbarUpdate();

  if (isMobile()) {
    closeHamburgerMenu();
  }
}

function savePreviousPosition() {
  previousPosition.sectionIndex = currentPosition.sectionIndex;
  previousPosition.sectionItemIndex = currentPosition.sectionItemIndex;
}

function goToSection(sectionNumber, itemNumber = 0) {
  savePreviousPosition();

  currentPosition.sectionIndex = clamp(
    0,
    sectionNumber,
    left_sections.length - 1,
  );
  currentPosition.sectionItemIndex = clamp(
    0,
    itemNumber,
    left_sections[currentPosition.sectionIndex].items.length - 1,
  );
}

function goToNextSection() {
  savePreviousPosition();

  currentPosition.sectionIndex = clamp(
    0,
    currentPosition.sectionIndex + 1,
    left_sections.length - 1,
  );
  currentPosition.sectionItemIndex = 0;
}

function goToPreviousSection() {
  savePreviousPosition();

  currentPosition.sectionIndex = clamp(
    0,
    currentPosition.sectionIndex - 1,
    left_sections.length - 1,
  );
  currentPosition.sectionItemIndex = 0;
}

function goToNextItem() {
  savePreviousPosition();

  currentPosition.sectionItemIndex = clamp(
    0,
    currentPosition.sectionItemIndex + 1,
    left_sections[currentPosition.sectionIndex].items.length - 1,
  );
}

function goToPreviousItem() {
  savePreviousPosition();

  currentPosition.sectionItemIndex = clamp(
    0,
    currentPosition.sectionItemIndex - 1,
    left_sections[currentPosition.sectionIndex].items.length - 1,
  );
}

function scrollMainContentDown() {
  MAIN_CONTENT_SECTION?.scrollBy({
    top: MAIN_CONTENT_SECTION.clientHeight / 2,
  });
}

function scrollMainContentUp() {
  MAIN_CONTENT_SECTION?.scrollBy({
    top: -(MAIN_CONTENT_SECTION.clientHeight / 2),
  });
}

function initSidebarScrollbar() {
  if (
    SIDEBAR == null ||
    SIDEBAR_SCROLLBAR == null ||
    SIDEBAR_SCROLLBAR_THUMB == null
  ) {
    return;
  }

  SIDEBAR.addEventListener("scroll", scheduleSidebarScrollbarUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleSidebarScrollbarUpdate, {
    passive: true,
  });

  if ("ResizeObserver" in window) {
    SIDEBAR_SCROLLBAR_STATE.resizeObserver = new ResizeObserver(() => {
      scheduleSidebarScrollbarUpdate();
    });
    SIDEBAR_SCROLLBAR_STATE.resizeObserver.observe(SIDEBAR);
  }

  SIDEBAR_SCROLLBAR_THUMB.addEventListener(
    "pointerdown",
    handleSidebarThumbPointerDown,
  );
  SIDEBAR_SCROLLBAR_THUMB.addEventListener(
    "pointermove",
    handleSidebarThumbPointerMove,
  );
  SIDEBAR_SCROLLBAR_THUMB.addEventListener(
    "pointerup",
    handleSidebarThumbPointerUp,
  );
  SIDEBAR_SCROLLBAR_THUMB.addEventListener(
    "pointercancel",
    handleSidebarThumbPointerCancel,
  );

  SIDEBAR_SCROLLBAR.addEventListener(
    "pointerdown",
    handleSidebarTrackPointerDown,
  );

  scheduleSidebarScrollbarUpdate();
}

function initKeyboardListeners() {
  // CTRL key is only captured on keydown/keyup
  addEventListener("keydown", async (event) => {
    let scrollToTop = false;
    const { key, code, ctrlKey } = event;

    if (key.includes("Arrow") || key.includes("Page")) {
      event.preventDefault();
    }

    if (key === "PageDown" || (ctrlKey && key === "d")) {
      scrollMainContentDown();
      return;
    } else if (key === "PageUp" || (ctrlKey && key === "u")) {
      scrollMainContentUp();
      return;
    } else if (key === "ArrowUp" || key === "k") {
      if (currentPosition.sectionIndex === 0) {
        return;
      }

      goToPreviousItem();
    } else if (key === "ArrowDown" || key === "j") {
      if (currentPosition.sectionIndex === 0) {
        return;
      }

      goToNextItem();
    } else if (key === "ArrowLeft" || key === "h") {
      goToPreviousSection();
      scrollToTop = true;
    } else if (key === "ArrowRight" || key === "l") {
      goToNextSection();
      scrollToTop = true;
    } else if (code.includes("Digit")) {
      const sectionNumber = parseInt(key) - 1;
      goToSection(sectionNumber);
      scrollToTop = true;
    } else {
      // Just here to avoid rendering on every keypress
      return;
    }

    await render(scrollToTop);
  });
}

function initMouseListeners() {
  left_sections.forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      item.addEventListener("click", async (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        event.stopPropagation();

        goToSection(sectionIndex, itemIndex);
        await render(sectionIndex !== previousPosition.sectionIndex);
      });
    });

    section.section.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevent default anchor behavior
      goToSection(sectionIndex);
      await render(sectionIndex !== previousPosition.sectionIndex);
    });
  });
}

function initTouchListeners() {
  if (!isMobile()) {
    return;
  }

  const hamburgerButtonElement =
    document.getElementsByName("hamburger-toggle")[0];

  hamburgerButtonElement.addEventListener("click", () => {
    onHamburgerMenuPress();
  });
}

let languageChangeHandlerAdded = false;

async function init() {
  // Initialize theme before anything else
  ThemeManager.init();

  initKeyboardListeners();
  initMouseListeners();
  initTouchListeners();
  initTaskbarListeners();
  initSidebarScrollbar();
  initImageModal();

  // Listen for language changes (only add once)
  if (!languageChangeHandlerAdded) {
    window.addEventListener('languageChanged', async (event) => {
      await displayContent();
    });
    languageChangeHandlerAdded = true;
  }

  await render(true, true);

  // Initialize taskbar to show home as active
  updateTaskbarActive('home');

  // Initialize navigation tutorial (shows on first visit only)
  initTutorial();
}

/** HIGHLIGHTING STUFF **/
const javascriptKeywords = [
  [
    "colorizeCode",
    "getCodeSnippet",
    "javascript",
    "typescript",
    "html",
    "css",
    "go",
    "c",
    "graphql",
    "sql",
    "react",
    "jest",
    "bash",
    "yaml",
    "arduino",
    "innerText",
    "classList",
    "0",
    "'code'",
    "document",
    "null",
    "innerHTML",
  ],
  ["function", "const", "return", "if", "new", "async", "await", "=", "=="],
  ["getElementsByTagName", "RegExp", "fetch", "replaceAll"],
];

const typescriptKeywords = [
  [...javascriptKeywords[0]],
  [...javascriptKeywords[1], "void", "string"],
  [...javascriptKeywords[2], "Promise"],
];

const nodeKeywords = [
  [
    ...javascriptKeywords[0],
    "express",
    "IS_ONLINE",
    "helmet",
    "IS_OFFLINE",
    "method",
    "graphqlHTTP",
    "schema",
    "rootValue",
    "validationRules",
    "graphiql",
    "next",
  ],
  [...javascriptKeywords[1], "NoSchemaIntrospectionCustomRule", "else"],
  [...javascriptKeywords[2], "use", "sendStatus", "json", "setHeader"],
];

const htmlKeywords = [
  ["head", "meta", "link", "script", "title"],
  ["charset", "name", "content", "rel", "type", "href", "src", "defer"],
];

const cssKeywords = [
  [
    "footer-item",
    "home-section-paragraph",
    "container",
    "footer",
    "left-section",
    "selected-frame",
    "container-content",
  ],
  [
    "display",
    "flex-direction",
    "justify-content",
    "position",
    "padding",
    "border-color",
    "margin-top",
    "font-size",
    "flex-direction",
    "gap",
    "border",
    "overflow-y",
    "overflow-x",
    "hover",
    "not",
  ],
];

const goKeywords = [
  ["0", "nil", "1"],
  ["type", "package", "struct", "any", "func", "return", "if", "int"],
];

const cKeywords = [
  [
    "deque_node",
    "data",
    "Node",
    "create_deque",
    "malloc",
    "printf",
    "exit",
    "EXIT_FAILURE",
    "NULL",
    "front",
    "back",
    "next",
    "prev",
    "destroy_deque",
    "deque_is_empty",
    "deque_pop_front",
    "free",
    "memcpy",
    "true",
    "false",
    "deque_push_back",
    "deque_push_front",
    "deque_pop_back",
    "deque_front",
  ],
  [
    "typedef",
    "struct",
    "void",
    "sizeof",
    "if",
    "return",
    "while",
    "bool",
    "else",
    "Deque",
    "static",
    "char",
    "const",
  ],
];

const graphqlKeywords = [
  [
    "FileInput",
    "FilesInput",
    "DirectoryInput",
    "ListBucketResult",
    "DeleteFileResult",
    "DeleteDirectoryResult",
    "Queries",
    "Mutations",
    "schema",
    "ListInput",
    "UploadInput",
    "SignedUrlResult",
    "SignedUrlResult",
    "TextFileContentResult",
    "RestoreFileResult",
  ],
  [
    "input",
    "type",
    "union",
    "fileName",
    "path",
    "root",
    "versionId",
    "bucketName",
    "fileNames",
    "versionIds",
    "listBucketContent",
    "getUploadUrl",
    "getDownloadUrl",
    "getTextFileContent",
    "listInput",
    "uploadInput",
    "fileInput",
    "fileInput",
    "filesInput",
    "directoryInput",
    "deleteOneFile",
    "deleteManyFiles",
    "deleteDirectory",
    "restoreFileVersion",
  ],
  [
    "String",
    "ObjectList",
    "Unauthenticated",
    "Unauthorized",
    "StorageNotFound",
    "ServerError",
    "FileNotFound",
    "FileName",
    "FileNameList",
    "Directory",
    "RestoreFileResult",
  ],
];

const sqlKeywords = [
  ["Who Let The Dogs Out Party", "Let the dogs out"],
  ["SELECT", "DISTINCT", "FROM", "WHERE", "JOIN", "AND", "ON"],
];

const reactKeywords = [
  [
    ...typescriptKeywords[0],
    "Gallery",
    "length",
    "imagesUrls",
    "false",
    "false",
    "useState",
    "1",
    "setShowFullSizeImage",
  ],
  [...typescriptKeywords[1], "export", "ExpandedImageModal"],
  ["setCurrentIndex"],
];

const testKeywords = [
  ["test", "expect", "checkEmailValidity"],
  ["let"],
  ["toBeTruthy", "toBeFalsy", "toBeUndefined", "toBe", "__typename", "not"],
];

const bashKeywords = [
  ["copy_env_files", "$src_dir", "mkdir", "cp"],
  ["for", "in", ";", "then", "if", "elif", "do", "fi", "done"],
];

const yamlKeywords = [
  [
    "name",
    "on",
    "push",
    "jobs",
    "runs-on",
    "steps",
    "uses",
    "with",
    "branches",
    "main",
    "deploy_lambda",
    "ubuntu-latest",
    "env",
    "run",
  ],
];

const arduinoKeywords = [
  [
    ...cKeywords[0],
    "setup",
    "loop",
    "stop",
    "go",
    "pinMode",
    "OUTPUT",
    "INPUT",
    "HIGH",
    "LOW",
    "58.2",
    "1000",
    "delay",
    "50",
    "1000000",
    "pulseIn",
    "digitalWrite",
    "delayMicroSeconds",
    "10",
  ],
  [...cKeywords[1], "long", "int", "switch", "case", "break"],
];

// Navigation Tutorial Functionality
class NavigationTutorial {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.tutorial = null;
    this.isActive = false;
    this.hasInteractedStep2 = false;
    this.hasInteractedStep3 = false;
    this.hasInteractedStep4 = false;
    this.boundKeyHandler = null;
    this.sectionPreviewEls = [];
    this.itemPreviewEls = [];
    this.sectionPreviewLabel = null;
    this.itemPreviewLabel = null;
    this.sectionPreviewIndex = 0;
    this.itemPreviewIndex = 0;
    this.keyFlashTimers = new Map();
    this.stepAdvanceTimeout = null;
  }

  init() {
    // Check if tutorial has been completed
    if (localStorage.getItem('portfolio-tutorial-completed')) {
      return;
    }

    this.tutorial = document.getElementById('navigation-tutorial');
    if (!this.tutorial) {
      console.warn('Tutorial element not found');
      return;
    }

    this.cachePreviewElements();

    this.attachEventListeners();
    this.show();
  }

  show() {
    if (!this.tutorial) return;

    this.tutorial.classList.add('active');
    this.isActive = true;
    this.goToStep(1);

    // Add keyboard listener for ESC and arrow keys
    this.boundKeyHandler = this.handleKeyPress.bind(this);
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  hide() {
    if (!this.tutorial) return;

    this.tutorial.classList.remove('active');
    this.isActive = false;

    // Remove keyboard listener
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    this.clearStepAdvanceTimeout();
    this.clearKeyFlashTimers();
  }

  complete() {
    localStorage.setItem('portfolio-tutorial-completed', 'true');
    this.hide();
  }

  skip() {
    this.complete();
  }

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;

    // Update current step
    this.currentStep = step;
    this.clearStepAdvanceTimeout();

    // Update step visibility
    const steps = this.tutorial.querySelectorAll('.tutorial-step');
    steps.forEach((stepEl, index) => {
      if (index + 1 === step) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });

    // Update progress dots
    const dots = this.tutorial.querySelectorAll('.tutorial-progress-dot');
    dots.forEach((dot, index) => {
      if (index + 1 === step) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Reset interaction flags for new steps
    if (step === 2) {
      this.hasInteractedStep2 = false;
      this.updateSectionPreview(0, true);
    } else if (step === 3) {
      this.hasInteractedStep3 = false;
      this.updateItemPreview(0, true);
    } else if (step === 4) {
      this.hasInteractedStep4 = false;
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  handleKeyPress(e) {
    if (!this.isActive) return;

    // ESC key closes tutorial
    if (e.key === 'Escape') {
      e.preventDefault();
      this.skip();
      return;
    }

    // Step 2: Detect left/right arrow key usage
    if (this.currentStep === 2) {
      const horizontalDirection = this.getHorizontalDirection(e.key);
      if (horizontalDirection !== 0) {
        e.preventDefault();
        this.updateSectionPreview(horizontalDirection);
        this.flashKey(e.key);

        if (!this.hasInteractedStep2) {
          this.hasInteractedStep2 = true;
          this.showInteractionFeedback(2);
        }

        // Auto-advance disabled - user must click Next
        // this.scheduleStepAdvance(2);
      }
    }

    // Step 3: Detect up/down arrow key usage
    if (this.currentStep === 3) {
      const verticalDirection = this.getVerticalDirection(e.key);
      if (verticalDirection !== 0) {
        e.preventDefault();
        this.updateItemPreview(verticalDirection);
        this.flashKey(e.key);

        if (!this.hasInteractedStep3) {
          this.hasInteractedStep3 = true;
          this.showInteractionFeedback(3);
        }

        // Auto-advance disabled - user must click Next
        // this.scheduleStepAdvance(3);
      }
    }

    // Step 4: Detect number key usage
    if (this.currentStep === 4) {
      const numberKey = this.getNumberKey(e.key, e.code);
      if (numberKey !== null) {
        e.preventDefault();
        this.flashNumberKey(e.code);

        if (!this.hasInteractedStep4) {
          this.hasInteractedStep4 = true;
          this.showInteractionFeedback(4);
        }
      }
    }
  }

  showInteractionFeedback(step) {
    const stepEl = this.tutorial.querySelector(`.tutorial-step[data-step="${step}"]`);
    if (!stepEl) return;

    const hint = stepEl.querySelector('.tutorial-hint');
    if (hint) {
      hint.style.borderColor = 'var(--clr-blue)';
      hint.style.background = 'rgba(59, 130, 246, 0.15)';

      const strong = hint.querySelector('strong');
      if (strong) {
        strong.textContent = 'Great job! ✓';
        strong.style.color = 'var(--clr-blue)';
      }
    }
  }

  attachEventListeners() {
    if (!this.tutorial) return;

    // Skip button
    const skipBtn = this.tutorial.querySelector('.tutorial-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skip());
    }

    // Next buttons
    const nextBtns = this.tutorial.querySelectorAll('.tutorial-next');
    nextBtns.forEach(btn => {
      btn.addEventListener('click', () => this.nextStep());
    });

    // Previous buttons
    const prevBtns = this.tutorial.querySelectorAll('.tutorial-prev');
    prevBtns.forEach(btn => {
      btn.addEventListener('click', () => this.prevStep());
    });

    // Finish button
    const finishBtn = this.tutorial.querySelector('.tutorial-finish');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.complete());
    }

    // Progress dots (allow clicking to jump to steps)
    const dots = this.tutorial.querySelectorAll('.tutorial-progress-dot');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToStep(index + 1));
    });

    // Close on overlay click
    const overlay = this.tutorial.querySelector('.tutorial-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.skip());
    }
  }

  cachePreviewElements() {
    if (!this.tutorial) return;

    this.sectionPreviewEls = Array.from(this.tutorial.querySelectorAll('.tutorial-preview--sections .preview-section'));
    this.itemPreviewEls = Array.from(this.tutorial.querySelectorAll('.tutorial-preview--items .preview-item'));
    this.sectionPreviewLabel = this.tutorial.querySelector('[data-section-preview-label]');
    this.itemPreviewLabel = this.tutorial.querySelector('[data-item-preview-label]');
    this.updateSectionPreview(0, true);
    this.updateItemPreview(0, true);
  }

  updateSectionPreview(direction = 0, reset = false) {
    if (!this.sectionPreviewEls.length) return;

    if (reset) {
      this.sectionPreviewIndex = 0;
    } else if (direction !== 0) {
      this.sectionPreviewIndex = (this.sectionPreviewIndex + direction + this.sectionPreviewEls.length) % this.sectionPreviewEls.length;
    }

    const activeSection = this.sectionPreviewEls[this.sectionPreviewIndex];
    this.sectionPreviewEls.forEach((el, index) => {
      el.classList.toggle('active', index === this.sectionPreviewIndex);
    });

    if (this.sectionPreviewLabel && activeSection) {
      this.sectionPreviewLabel.textContent = activeSection.dataset.label || `Section ${this.sectionPreviewIndex + 1}`;
    }
  }

  updateItemPreview(direction = 0, reset = false) {
    if (!this.itemPreviewEls.length) return;

    if (reset) {
      this.itemPreviewIndex = 0;
    } else if (direction !== 0) {
      this.itemPreviewIndex = (this.itemPreviewIndex + direction + this.itemPreviewEls.length) % this.itemPreviewEls.length;
    }

    const activeItem = this.itemPreviewEls[this.itemPreviewIndex];
    this.itemPreviewEls.forEach((el, index) => {
      el.classList.toggle('active', index === this.itemPreviewIndex);
    });

    if (this.itemPreviewLabel && activeItem) {
      this.itemPreviewLabel.textContent = activeItem.dataset.label || `Item ${this.itemPreviewIndex + 1}`;
    }
  }

  getHorizontalDirection(key) {
    if (['ArrowLeft', 'h', 'H'].includes(key)) return -1;
    if (['ArrowRight', 'l', 'L'].includes(key)) return 1;
    return 0;
  }

  getVerticalDirection(key) {
    if (['ArrowUp', 'k', 'K'].includes(key)) return -1;
    if (['ArrowDown', 'j', 'J'].includes(key)) return 1;
    return 0;
  }

  getNumberKey(key, code) {
    // Check for number keys 1-5
    const validKeys = ['1', '2', '3', '4', '5'];
    const validCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5'];

    if (validKeys.includes(key) || validCodes.includes(code)) {
      return parseInt(key) || parseInt(code.replace(/\D/g, ''));
    }
    return null;
  }

  flashNumberKey(code) {
    if (!this.tutorial) return;

    // Normalize numpad keys to regular digit codes
    const normalizedCode = code.startsWith('Numpad') ? code.replace('Numpad', 'Digit') : code;
    const keyEls = this.tutorial.querySelectorAll(`.tutorial-key[data-key="${normalizedCode}"]`);
    if (!keyEls.length) return;

    keyEls.forEach(keyEl => {
      keyEl.classList.add('pressed');

      if (this.keyFlashTimers.has(keyEl)) {
        clearTimeout(this.keyFlashTimers.get(keyEl));
      }

      const timeout = setTimeout(() => {
        keyEl.classList.remove('pressed');
        this.keyFlashTimers.delete(keyEl);
      }, 200);

      this.keyFlashTimers.set(keyEl, timeout);
    });
  }

  normalizeKeyForPreview(key) {
    const map = {
      h: 'ArrowLeft',
      H: 'ArrowLeft',
      l: 'ArrowRight',
      L: 'ArrowRight',
      j: 'ArrowDown',
      J: 'ArrowDown',
      k: 'ArrowUp',
      K: 'ArrowUp'
    };
    return map[key] || key;
  }

  flashKey(key) {
    if (!this.tutorial) return;
    const normalized = this.normalizeKeyForPreview(key);
    const keyEls = this.tutorial.querySelectorAll(`.tutorial-key[data-key="${normalized}"]`);
    if (!keyEls.length) return;

    keyEls.forEach(keyEl => {
      keyEl.classList.add('pressed');

      if (this.keyFlashTimers.has(keyEl)) {
        clearTimeout(this.keyFlashTimers.get(keyEl));
      }

      const timeout = setTimeout(() => {
        keyEl.classList.remove('pressed');
        this.keyFlashTimers.delete(keyEl);
      }, 200);

      this.keyFlashTimers.set(keyEl, timeout);
    });
  }

  clearKeyFlashTimers() {
    this.keyFlashTimers.forEach(timeout => clearTimeout(timeout));
    this.keyFlashTimers.clear();

    if (this.tutorial) {
      this.tutorial.querySelectorAll('.tutorial-key.pressed').forEach(el => el.classList.remove('pressed'));
    }
  }

  clearStepAdvanceTimeout() {
    if (this.stepAdvanceTimeout) {
      clearTimeout(this.stepAdvanceTimeout);
      this.stepAdvanceTimeout = null;
    }
  }

  scheduleStepAdvance(stepNumber) {
    this.clearStepAdvanceTimeout();
    this.stepAdvanceTimeout = setTimeout(() => {
      if (this.currentStep === stepNumber) {
        this.nextStep();
      }
    }, 1200);
  }
}

// Initialize tutorial
let tutorialInstance = null;

function initTutorial() {
  tutorialInstance = new NavigationTutorial();
  tutorialInstance.init();
}

// Image Modal Functionality
function initImageModal() {
  setupProfilePicModal();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}
