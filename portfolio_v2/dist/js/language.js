// Centralized language manager
const LanguageManager = {
  currentLang: 'en',
  initialized: false,
  listenersAttached: false,
  dataCache: new Map(),

  translations: {
    en: {
      home: 'Home',
      experience: 'Experience',
      projects: 'Projects',
      skills: 'Skills - Tools',
      certifications: 'Certifications',
      windowTitle: 'Sohaib Mokhliss - Portfolio Terminal',
      homeIntro: "Hi! I'm <span class=\"text-blue\">Sohaib Mokhliss</span>, a security-minded engineer building <span class=\"text-orange\">DevOps automation</span> and <span class=\"text-pink\">resilient infrastructures</span>."
    },
    fr: {
      home: 'Accueil',
      experience: 'Expérience',
      projects: 'Projets',
      skills: 'Compétences - Outils',
      certifications: 'Certifications',
      windowTitle: 'Sohaib Mokhliss - Portfolio Terminal',
      homeIntro: "Salut ! Je suis <span class=\"text-blue\">Sohaib Mokhliss</span>, un ingénieur orienté sécurité qui crée des <span class=\"text-orange\">automatismes DevOps</span> et des <span class=\"text-pink\">infrastructures résilientes</span>."
    }
  },

  isSupportedLanguage(lang) {
    return typeof lang === 'string' && Object.prototype.hasOwnProperty.call(this.translations, lang);
  },

  resolveInitialLanguage() {
    const savedLang = localStorage.getItem('portfolio-language');
    if (this.isSupportedLanguage(savedLang)) {
      return savedLang;
    }

    const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
    if (this.isSupportedLanguage(browserLang)) {
      return browserLang;
    }

    return 'en';
  },

  init() {
    if (this.initialized) {
      return this.currentLang;
    }

    this.currentLang = this.resolveInitialLanguage();
    localStorage.setItem('portfolio-language', this.currentLang);

    this.updateUI();
    this.updateStaticText();
    this.attachEventListeners();
    this.initialized = true;

    window.dispatchEvent(new CustomEvent('languageManagerReady', {
      detail: { lang: this.currentLang }
    }));

    return this.currentLang;
  },

  setLanguage(lang) {
    if (!this.isSupportedLanguage(lang)) {
      console.warn(`[LanguageManager] Unsupported language requested: "${lang}"`);
      return;
    }

    if (this.currentLang === lang) {
      return;
    }

    this.currentLang = lang;
    localStorage.setItem('portfolio-language', lang);

    this.updateUI();
    this.updateStaticText();

    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { lang }
    }));
  },

  getDataPath(filename, lang = this.currentLang) {
    const targetLang = this.isSupportedLanguage(lang) ? lang : 'en';
    const dataFolder = targetLang === 'fr' ? 'data-fr' : 'data';
    return `${dataFolder}/${filename}.json`;
  },

  async fetchSectionData(sectionName, options = {}) {
    const normalizedSection = String(sectionName || '').trim();
    if (!normalizedSection) {
      throw new Error('[LanguageManager] fetchSectionData requires a section name');
    }

    const targetLang = this.isSupportedLanguage(options.lang) ? options.lang : this.currentLang;
    const cacheKey = `${targetLang}:${normalizedSection}`;

    if (!options.forceRefresh && this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    const path = this.getDataPath(normalizedSection, targetLang);

    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Request for ${path} failed with status ${response.status}`);
      }

      const payload = await response.json();
      const result = { ...payload, __language: targetLang };
      this.dataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`[LanguageManager] Failed to load ${path}:`, error);

      if (targetLang !== 'en') {
        console.warn('[LanguageManager] Falling back to English content');
        return this.fetchSectionData(normalizedSection, {
          lang: 'en',
          forceRefresh: options.forceRefresh
        });
      }

      throw error;
    }
  },

  updateUI() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      if (lang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  updateStaticText() {
    const t = this.translations[this.currentLang];
    if (!t) {
      return;
    }

    const homeTitle = document.querySelector('#home .title p');
    if (homeTitle) homeTitle.textContent = t.home;

    const experienceTitle = document.querySelector('#experience-title p');
    if (experienceTitle) experienceTitle.textContent = t.experience;

    const projectsTitle = document.querySelector('#projects .title p');
    if (projectsTitle) projectsTitle.textContent = t.projects;

    const skillsTitle = document.querySelector('#skills-title p');
    if (skillsTitle) skillsTitle.textContent = t.skills;

    const certificationsTitle = document.querySelector('#certifications-title p');
    if (certificationsTitle) certificationsTitle.textContent = t.certifications;

    const windowTitle = document.querySelector('.window-title');
    if (windowTitle) windowTitle.textContent = t.windowTitle;

    const homeParagraph = document.querySelector('#home-section-paragraph');
    if (homeParagraph) homeParagraph.innerHTML = t.homeIntro;
  },

  attachEventListeners() {
    if (this.listenersAttached) {
      return;
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.setLanguage(lang);
      });
    });

    this.listenersAttached = true;
  }
};

// Expose globally for legacy scripts that expect window.LanguageManager
if (typeof window !== 'undefined') {
  window.LanguageManager = LanguageManager;
}

export { LanguageManager };

// Initialize when DOM is ready - this happens FIRST
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LanguageManager.init());
} else {
  LanguageManager.init();
}
