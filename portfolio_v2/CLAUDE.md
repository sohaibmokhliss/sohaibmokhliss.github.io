# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A dual-mode portfolio website for Sohaib Mokhliss built with vanilla JavaScript, featuring both a GUI mode and Terminal mode. The site is deployed to GitHub Pages and showcases work in Cybersecurity, Network Engineering, and DevOps.

**Live Site:** https://browncj.dev/ (deployed from `d-browncj/portfolio_v2` repository)

## Development Commands

```bash
# Start development server (runs on localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages (runs predeploy build automatically)
npm run deploy
```

## Architecture

### Dual-Mode System

The portfolio operates in two distinct modes that share the same data but present it differently:

**GUI Mode** (`js/tui.js`)
- Terminal-inspired visual interface with sidebar navigation
- 5 main sections: Home, Experience, Projects, Skills, Certifications
- Content rendered from JSON files in `data/` directory
- Keyboard navigation: Arrow keys, PageUp/Down, number keys (1-5)
- Sidebar uses custom scrollbar component (`sidebar-scrollbar`)

**Terminal Mode** (`js/terminal.js`)
- Fully interactive bash-like terminal emulator
- Virtual file system built from the same JSON data
- Available commands: `ls`, `cd`, `cat`, `pwd`, `clear`, `help`, `gui`, `lang`
- File system structure mirrors portfolio sections as directories

**Mode Manager** (`js/modeManager.js`)
- Singleton that controls mode switching between GUI and Terminal
- Persists user's mode preference in localStorage (`portfolio-mode`)
- Updates navbar toggle button dynamically based on current mode
- Handles smooth transitions and terminal initialization

### Key Components

**Language System** (`js/language.js`)
- Bilingual support (English/French) via `LanguageManager` singleton
- Fetches localized JSON from `data/` or `data/fr/` based on current language
- Language preference stored in localStorage (`portfolio-language`)
- Dispatches `languageChanged` event to notify other components

**Content Loading**
- All portfolio content is stored as JSON in `data/` directory
- Structure: `{ data: [...] }` where each item has `title`, `content`, `date`, etc.
- Content files: `home.json`, `experience.json`, `projects.json`, `skills.json`, `certifications.json`
- French translations in `data/fr/` directory with identical structure

**Mobile Navigation**
- Hamburger menu for sidebar on mobile (< 768px)
- Single toggle button in navbar switches between GUI/Terminal modes
- Button automatically updates emoji and text based on current mode
- Sidebar slides in from right with transform animation

### File Synchronization

Changes to source files must be manually copied to deployment directories:

```bash
# After modifying HTML
cp index.html dist/index.html

# After modifying CSS
cp css/tui.css public/css/tui.css
cp css/tui.css dist/css/tui.css

# After modifying JavaScript
cp js/[filename].js public/js/[filename].js
cp js/[filename].js dist/js/[filename].js
```

This is required because Vite doesn't auto-sync during development. Always copy to both `public/` and `dist/` directories before deploying.

## Content Security Policy

The site has a CSP meta tag in `index.html` that includes `'unsafe-eval'` to support Vite's development mode:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...">
```

This is required for Vite's hot module replacement and source maps.

## Styling Architecture

**CSS Variables** (`css/tui.css`)
- Dual theme system with dark (default) and light themes
- CSS custom properties in `:root` and `[data-theme="light"]`
- Theme preference stored in localStorage via theme toggle button
- Mobile-specific overrides in `@media (max-width: 768px)` and `@media (max-width: 900px)`

**Mobile Sidebar Styling**
- Fixed position with slide-in animation
- Positioned with `top: 3.5rem` to clear navbar
- 95vw width with 2.5vw left margin for centering
- Custom scrollbar styling for touch devices
- Enhanced with backdrop blur and gradient backgrounds

## Data Structure

Each section JSON follows this pattern:

```json
{
  "data": [
    {
      "title": "Project/Position Title",
      "date": "Date or Time Period",
      "year": "Build Year (optional)",
      "technologies": ["Tech1", "Tech2"],
      "content": ["Paragraph 1", "Paragraph 2"],
      "images": ["image1.jpg", "image2.png"],
      "snippet": "language-extension",
      "githubUrl": "url",
      "demoUrl": "url"
    }
  ]
}
```

Content supports `{{placeholders}}` for colored text spans which are replaced with random color classes (`text-blue`, `text-orange`, `text-pink`) during rendering.

## Important Implementation Details

1. **Mode Toggle Button**: The navbar button (`#mode-toggle-nav`) dynamically updates its content when modes change via `ModeManager.updateNavToggleButton()`

2. **Terminal Commands**: All terminal commands are defined in `Terminal.commands` object. To add a new command, add it there and update the `help` command output.

3. **Section Navigation**: GUI mode sections are defined in `left_sections` array in `tui.js`. Current position tracking uses `currentPosition` and `previousPosition` objects.

4. **Responsive Breakpoints**:
   - Mobile: < 768px
   - Tablet/Desktop transition: < 900px

5. **Asset Cache Busting**: Static assets use query parameter versioning (e.g., `?v=8`) in HTML to force cache invalidation.

## Vite Configuration

Minimal Vite setup (`vite.config.js`):
- Base path: `/`
- Public directory: `public`
- JSON files included as assets
- No build plugins or optimizations configured
