// Import Terminal for terminal mode switching
import { Terminal, setModeManager } from './terminal.js';

// Mode Manager - Handles switching between GUI and Terminal modes
const ModeManager = {
  currentMode: 'gui', // 'gui' or 'terminal'

  init() {
    // Get saved mode from localStorage or default to 'gui'
    this.currentMode = localStorage.getItem('portfolio-mode') || 'gui';
    this.applyMode(this.currentMode);
    this.attachEventListeners();

    // If starting in terminal mode, show welcome
    if (this.currentMode === 'terminal') {
      setTimeout(() => {
        const output = document.getElementById('terminal-output');
        if (output && output.children.length === 0) {
          Terminal.printWelcome();
        }
      }, 100);
    }
  },

  switchMode(mode) {
    if (mode === this.currentMode) return;

    this.currentMode = mode;
    localStorage.setItem('portfolio-mode', mode);
    this.applyMode(mode);

    // Initialize terminal output if switching to terminal mode
    if (mode === 'terminal') {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const output = document.getElementById('terminal-output');
        if (output && output.children.length === 0) {
          Terminal.printWelcome();
        }
        Terminal.focusInput();
      }, 50);
    }
  },

  applyMode(mode) {
    const layout = document.getElementById('layout');
    const terminalContainer = document.getElementById('terminal-container');

    if (!layout || !terminalContainer) return;

    if (mode === 'terminal') {
      layout.classList.add('terminal-mode');
      layout.classList.remove('gui-mode');

      // Focus terminal input
      setTimeout(() => {
        const input = document.getElementById('terminal-input');
        if (input) input.focus();
      }, 100);
    } else {
      layout.classList.add('gui-mode');
      layout.classList.remove('terminal-mode');
    }
  },

  attachEventListeners() {
    // GUI mode toggle button
    const guiToggleBtn = document.getElementById('mode-toggle-gui');
    if (guiToggleBtn) {
      guiToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('terminal');
      });
    } else {
      console.warn('GUI toggle button not found');
    }

    // Terminal mode toggle button
    const terminalToggleBtn = document.getElementById('mode-toggle-terminal');
    if (terminalToggleBtn) {
      terminalToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('gui');
      });
    } else {
      console.warn('Terminal toggle button not found');
    }
  }
};

// Set ModeManager reference in Terminal so gui command works
setModeManager(ModeManager);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ModeManager.init());
} else {
  ModeManager.init();
}
