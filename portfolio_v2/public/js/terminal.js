// Import LanguageManager for translation support
import { LanguageManager } from './language.js';

// ModeManager will be set by modeManager.js after it loads
let ModeManager = null;

// Function to set ModeManager from external module
export function setModeManager(manager) {
  ModeManager = manager;
}

// Terminal emulator with virtual file system
const Terminal = {
  currentPath: '/home/sohaib',
  history: [],
  historyIndex: -1,
  commandBuffer: '',

  fileSystem: {},

  async init() {
    await this.buildFileSystem();

    // Delay attaching listeners to ensure DOM is ready
    setTimeout(() => {
      this.attachEventListeners();
    }, 100);

    // Listen for language changes
    window.addEventListener('languageChanged', async () => {
      await this.buildFileSystem();
    });
    // Don't print welcome yet - wait for terminal mode to be activated
  },

  async buildFileSystem() {
    const sections = ['home', 'experience', 'projects', 'skills', 'certifications'];
    const fileData = {};

    await Promise.all(sections.map(async (section) => {
      try {
        fileData[section] = await LanguageManager.fetchSectionData(section);
      } catch (error) {
        console.error(`[Terminal] Failed to load ${section}:`, error);
        fileData[section] = null;
      }
    }));

    // Build virtual file system structure
    this.fileSystem = {
      '/': {
        type: 'dir',
        children: {
          'home': {
            type: 'dir',
            children: {
              'sohaib': {
                type: 'dir',
                children: {
                  'about.txt': {
                    type: 'file',
                    content: this.formatHomeContent(fileData.home)
                  },
                  'experience': {
                    type: 'dir',
                    children: this.buildExperienceFiles(fileData.experience)
                  },
                  'projects': {
                    type: 'dir',
                    children: this.buildProjectFiles(fileData.projects)
                  },
                  'skills': {
                    type: 'dir',
                    children: {
                      'skills.txt': {
                        type: 'file',
                        content: this.formatSkillsContent(fileData.skills)
                      }
                    }
                  },
                  'certifications': {
                    type: 'dir',
                    children: {
                      'certifications.txt': {
                        type: 'file',
                        content: this.formatCertificationsContent(fileData.certifications)
                      }
                    }
                  },
                  'README.md': {
                    type: 'file',
                    content: 'Welcome to my portfolio!\n\nNavigate using standard Unix commands:\n- ls: list files\n- cd: change directory\n- cat: view file contents\n- tree: view directory structure\n- pwd: print working directory\n- clear: clear the terminal\n- help: show available commands\n- gui: switch back to GUI mode\n\nExplore the directories to learn more about my experience, projects, and skills!'
                  },
                  '.secrets': {
                    type: 'file',
                    content: 'Hmm, you found the hidden file! 🕵️\n\nSome commands aren\'t what they seem...\nTry common typos, get some coffee, or just say hello.\nThe answer to everything might help.\nAnd remember: with great power comes great responsibility. 😉\n\n(Hint: Not all commands are listed in help!)'
                  }
                }
              }
            }
          }
        }
      }
    };
  },

  formatHomeContent(data) {
    if (!data || !data.data) return 'Welcome!';

    let content = '';
    data.data.forEach(section => {
      section.content.forEach(line => {
        // Remove HTML tags and {{}} markers
        const cleaned = line
          .replace(/<[^>]*>/g, '')
          .replace(/\{\{([^}]+)\}\}/g, '$1');
        content += cleaned + '\n';
      });
      content += '\n';
    });
    return content.trim();
  },

  buildExperienceFiles(data) {
    if (!data || !data.data) return {};

    const files = {};
    data.data.forEach((exp, index) => {
      if (!exp || !exp.company) {
        console.warn('Experience missing company:', exp);
        return;
      }

      const filename = `${index + 1}_${exp.company.toLowerCase().replace(/\s+/g, '_')}.txt`;
      let content = `${exp.name || 'Position'}\n`;
      content += `Company: ${exp.company}\n`;
      content += `Period: ${exp.date || 'N/A'}\n`;
      if (exp.title) {
        content += `\n${exp.title}\n`;
        content += '='.repeat(exp.title.length) + '\n\n';
      }

      if (exp.content && Array.isArray(exp.content)) {
        exp.content.forEach(line => {
          const cleaned = line.replace(/\{\{([^}]+)\}\}/g, '$1');
          content += '• ' + cleaned + '\n';
        });
      }

      if (exp.technologies && Array.isArray(exp.technologies)) {
        content += '\nTechnologies: ' + exp.technologies.join(', ') + '\n';
      }

      files[filename] = {
        type: 'file',
        content: content
      };
    });

    return files;
  },

  buildProjectFiles(data) {
    if (!data || !data.data) return {};

    const files = {};
    data.data.forEach((project, index) => {
      if (!project) {
        console.warn('Project missing data at index:', index);
        return;
      }

      const projectTitle = project.title || project.name;
      if (!projectTitle) {
        console.warn('Project missing title/name:', project);
        return;
      }

      const filename = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}.txt`;
      let content = `${projectTitle}\n`;
      content += '='.repeat(projectTitle.length) + '\n\n';

      if (project.year) content += `Built in: ${project.year}\n`;
      if (project.technologies) content += `Technologies: ${project.technologies.join(', ')}\n\n`;

      if (project.content && Array.isArray(project.content)) {
        project.content.forEach(line => {
          const cleaned = line.replace(/\{\{([^}]+)\}\}/g, '$1');
          content += cleaned + '\n\n';
        });
      }

      if (project.githubUrl) content += `GitHub: ${project.githubUrl}\n`;
      if (project.demoUrl) content += `Demo: ${project.demoUrl}\n`;

      files[filename] = {
        type: 'file',
        content: content.trim()
      };
    });

    return files;
  },

  formatSkillsContent(data) {
    if (!data || !data.data) return 'Skills information not available.';

    let content = 'Technical Skills & Tools\n';
    content += '========================\n\n';

    data.data.forEach(skill => {
      const label = skill.title || skill.name;
      if (!label) {
        console.warn('Skill missing title/name:', skill);
        return;
      }
      content += `• ${label}\n`;
    });

    return content;
  },

  formatCertificationsContent(data) {
    if (!data || !data.data) return 'Certifications information not available.';

    let content = 'Professional Certifications\n';
    content += '===========================\n\n';

    data.data.forEach(cert => {
      const title = cert.title || cert.name;
      if (!title) {
        console.warn('Certification missing title/name:', cert);
        return;
      }

      content += `• ${title}\n`;
      if (cert.issuer) content += `  Issuer: ${cert.issuer}\n`;
      if (cert.date) content += `  Status: ${cert.date}\n`;
      if (cert.certificateUrl) content += `  Certificate: ${cert.certificateUrl}\n`;
      content += '\n';
    });

    return content;
  },

  printWelcome() {
    const welcome = `
╔══════════════════════════════════════════════════════════════╗
║      Sohaib Mokhliss - Portfolio Terminal                   ║
║                                                             ║
║  Welcome! Type 'help' for available commands                ║
║  Type 'gui' to switch back to GUI mode                      ║
╚══════════════════════════════════════════════════════════════╝

`;
    this.print(welcome, 'welcome');
    this.printPrompt();
  },

  print(text, className = '') {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    const line = document.createElement('div');
    if (className) line.className = className;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  },

  printHTML(html) {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    const line = document.createElement('div');
    line.innerHTML = html;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  },

  printPrompt() {
    const prompt = document.getElementById('terminal-prompt');
    if (prompt) {
      prompt.textContent = `sohaib@portfolio:${this.currentPath}$ `;
    }
  },

  resolvePath(path) {
    if (!path) return this.currentPath;

    // Handle absolute paths
    if (path.startsWith('/')) {
      return path;
    }

    // Handle relative paths
    const parts = this.currentPath.split('/').filter(p => p);
    const pathParts = path.split('/');

    pathParts.forEach(part => {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    });

    return '/' + parts.join('/');
  },

  getNode(path) {
    const normalized = this.resolvePath(path);
    const parts = normalized.split('/').filter(p => p);

    let current = this.fileSystem['/'];

    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        return null;
      }
      current = current.children[part];
    }

    return current;
  },

  // Command implementations
  commands: {
    help() {
      const help = `
Available Commands:
━━━━━━━━━━━━━━━━━━
  ls [path]           List directory contents
  cd <path>           Change directory
  cat <file>          Display file contents
  tree [path]         Display directory tree
  pwd                 Print working directory
  clear               Clear the terminal
  help                Show this help message
  gui                 Switch to GUI mode

Navigation:
━━━━━━━━━━
  Use Tab for autocompletion
  Use ↑/↓ arrows for command history
`;
      Terminal.print(help);
    },

    pwd() {
      Terminal.print(Terminal.currentPath);
    },

    clear() {
      const output = document.getElementById('terminal-output');
      if (output) output.innerHTML = '';
    },

    ls(args) {
      const path = args[0] || Terminal.currentPath;
      const node = Terminal.getNode(path);

      if (!node) {
        Terminal.print(`ls: cannot access '${path}': No such file or directory`, 'error');
        return;
      }

      if (node.type === 'file') {
        Terminal.print(path.split('/').pop());
        return;
      }

      const items = Object.keys(node.children || {}).sort();
      if (items.length === 0) {
        return;
      }

      let output = '';
      items.forEach(item => {
        const itemNode = node.children[item];
        const prefix = itemNode.type === 'dir' ? '<span class="text-blue">' : '<span class="text-orange">';
        const suffix = itemNode.type === 'dir' ? '/' : '';
        output += `${prefix}${item}${suffix}</span>  `;
      });

      Terminal.printHTML(output);
    },

    cd(args) {
      if (!args[0]) {
        Terminal.currentPath = '/home/sohaib';
        Terminal.printPrompt();
        return;
      }

      const newPath = Terminal.resolvePath(args[0]);
      const node = Terminal.getNode(newPath);

      if (!node) {
        Terminal.print(`cd: ${args[0]}: No such file or directory`, 'error');
        return;
      }

      if (node.type !== 'dir') {
        Terminal.print(`cd: ${args[0]}: Not a directory`, 'error');
        return;
      }

      Terminal.currentPath = newPath || '/';
      Terminal.printPrompt();
    },

    cat(args) {
      if (!args[0]) {
        Terminal.print('cat: missing file operand', 'error');
        return;
      }

      const node = Terminal.getNode(args[0]);

      if (!node) {
        Terminal.print(`cat: ${args[0]}: No such file or directory`, 'error');
        return;
      }

      if (node.type === 'dir') {
        Terminal.print(`cat: ${args[0]}: Is a directory`, 'error');
        return;
      }

      Terminal.print(node.content || '');
    },

    tree(args) {
      const path = args[0] || Terminal.currentPath;
      const node = Terminal.getNode(path);

      if (!node) {
        Terminal.print(`tree: ${path}: No such file or directory`, 'error');
        return;
      }

      Terminal.print(path);
      Terminal.printTree(node, '', true);
    },

    gui() {
      if (ModeManager) {
        ModeManager.switchMode('gui');
      }
    },

    // Hidden Easter Eggs (not in help)
    whoami() {
      Terminal.print('You are a curious visitor exploring Sohaib\'s portfolio.');
      Terminal.print('But the real question is... who is Sohaib? 🤔');
    },

    sudo(args) {
      const command = args.join(' ');
      Terminal.print('');
      Terminal.print('Nice try! But this is a portfolio, not a production server. 😄');
      Terminal.print('Here, have a cookie instead: 🍪');
    },

    hack() {
      Terminal.print('');
      Terminal.print('Initializing hack sequence...');
      setTimeout(() => {
        Terminal.print('Bypassing firewall... ░░░░░░░░░░ 0%');
      }, 500);
      setTimeout(() => {
        Terminal.print('Cracking encryption... ████░░░░░░ 40%');
      }, 1000);
      setTimeout(() => {
        Terminal.print('Accessing mainframe... ████████░░ 80%');
      }, 1500);
      setTimeout(() => {
        Terminal.print('Access granted! ██████████ 100%');
        Terminal.print('');
        Terminal.print('Just kidding! 😂 This isn\'t Mr. Robot.');
        Terminal.print('But I appreciate your hacker spirit! 💻');
        Terminal.printPrompt();
      }, 2000);
    },

    matrix() {
      Terminal.print('');
      Terminal.print('Wake up, Neo... 🟢');
      Terminal.print('The portfolio has you...');
      Terminal.print('Follow the white rabbit. 🐰');
      Terminal.print('');
      Terminal.print('Knock, knock.');
    },

    coffee() {
      const responses = [
        '☕ Brewing some fresh code... I mean coffee!',
        '☕ Error 418: I\'m a teapot, not a coffee maker!',
        '☕ Coffee.exe has stopped working. Please restart developer.',
        '☕ while(!(succeed=try())); // The developer\'s motto'
      ];
      Terminal.print('');
      Terminal.print(responses[Math.floor(Math.random() * responses.length)]);
    },

    xyzzy() {
      Terminal.print('');
      Terminal.print('A hollow voice says "Fool."');
      Terminal.print('');
      Terminal.print('(Classic adventure game reference! You know your stuff! 🎮)');
    },

    joke() {
      const jokes = [
        'Why do programmers prefer dark mode?\nBecause light attracts bugs! 🐛',
        'How many programmers does it take to change a light bulb?\nNone. It\'s a hardware problem. 💡',
        'Why did the developer go broke?\nBecause he used up all his cache! 💰',
        'What\'s a programmer\'s favorite hangout?\nThe Foo Bar! 🍺',
        'Why do Java developers wear glasses?\nBecause they don\'t C#! 👓'
      ];
      Terminal.print('');
      Terminal.print(jokes[Math.floor(Math.random() * jokes.length)]);
    },

    vim() {
      Terminal.print('');
      Terminal.print('Entering vim...');
      Terminal.print('');
      Terminal.print('Just kidding! You\'re still in the terminal. 😅');
      Terminal.print('(To exit vim in real life: ESC, then :q!)');
    },

    emacs() {
      Terminal.print('');
      Terminal.print('Error: Emacs is a great operating system, lacking only a decent editor.');
      Terminal.print('😏 #TeamVim');
    },

    sl() {
      Terminal.print('');
      Terminal.print('   (  ) (@@) ( )  (@)  ()    @@    O     @     O     @');
      Terminal.print('  (@@@)');
      Terminal.print('(    )');
      Terminal.print(' (@@@@)');
      Terminal.print('(      )');
      Terminal.print('');
      Terminal.print('You meant "ls", didn\'t you? 🚂');
    },

    potato() {
      Terminal.print('');
      Terminal.print('🥔 This portfolio runs on potato-grade servers.');
      Terminal.print('Just kidding! It\'s actually pretty fast. 🚀');
    },

    '42'() {
      Terminal.print('');
      Terminal.print('The Answer to the Ultimate Question of Life,');
      Terminal.print('the Universe, and Everything is...');
      Terminal.print('');
      Terminal.print('42');
      Terminal.print('');
      Terminal.print('Now you know. But what was the question? 🤔');
    },

    konami() {
      Terminal.print('');
      Terminal.print('🎮 ↑ ↑ ↓ ↓ ← → ← → B A START');
      Terminal.print('');
      Terminal.print('+30 Lives! Just kidding, this isn\'t Contra.');
      Terminal.print('But here\'s a secret: try typing "secret"');
    },

    secret() {
      Terminal.print('');
      Terminal.print('🎉 Congratulations! You found the secret command!');
      Terminal.print('');
      Terminal.print('Here\'s a fun fact about Sohaib:');
      Terminal.print('He believes in clean code, strong coffee, and deploying on Fridays.');
      Terminal.print('(Just kidding about that last one... or am I? 😈)');
      Terminal.print('');
      Terminal.print('Try these other secrets: hack, matrix, joke, coffee, 42');
    },

    hello() {
      Terminal.print('');
      Terminal.print('Hello, World! 👋');
      Terminal.print('The classic first program. You\'re keeping it real!');
    },

    ping() {
      Terminal.print('');
      Terminal.print('PING portfolio.browncj.dev (127.0.0.1) 56(84) bytes of data.');
      Terminal.print('64 bytes from localhost: icmp_seq=1 ttl=64 time=0.042 ms');
      Terminal.print('64 bytes from localhost: icmp_seq=2 ttl=64 time=0.037 ms');
      Terminal.print('--- portfolio.browncj.dev ping statistics ---');
      Terminal.print('2 packets transmitted, 2 received, 0% packet loss');
      Terminal.print('');
      Terminal.print('Connection is strong! 📡');
    }
  },

  printTree(node, prefix, isLast) {
    if (!node.children) return;

    const items = Object.entries(node.children);
    items.forEach(([name, child], index) => {
      const isLastItem = index === items.length - 1;
      const connector = isLastItem ? '└── ' : '├── ';
      const color = child.type === 'dir' ? 'text-blue' : 'text-orange';

      Terminal.printHTML(`${prefix}${connector}<span class="${color}">${name}${child.type === 'dir' ? '/' : ''}</span>`);

      if (child.type === 'dir') {
        const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
        Terminal.printTree(child, newPrefix, isLastItem);
      }
    });
  },

  executeCommand(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      this.printPrompt();
      return;
    }

    // Add to history
    this.history.push(trimmed);
    this.historyIndex = this.history.length;

    // Echo the command
    this.printHTML(`<span class="text-pink">sohaib@portfolio</span>:<span class="text-blue">${this.currentPath}</span>$ ${trimmed}`);

    // Parse command
    const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const command = parts[0];
    const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, ''));

    // Execute command
    if (this.commands[command]) {
      this.commands[command](args);
    } else {
      this.print(`${command}: command not found. Type 'help' for available commands.`, 'error');
    }

    this.printPrompt();
  },

  attachEventListeners() {
    const input = document.getElementById('terminal-input');
    if (!input) {
      console.warn('Terminal input not found');
      return;
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const command = input.value;
        input.value = '';
        Terminal.executeCommand(command);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (Terminal.historyIndex > 0) {
          Terminal.historyIndex--;
          input.value = Terminal.history[Terminal.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (Terminal.historyIndex < Terminal.history.length - 1) {
          Terminal.historyIndex++;
          input.value = Terminal.history[Terminal.historyIndex];
        } else {
          Terminal.historyIndex = Terminal.history.length;
          input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        Terminal.autocomplete(input);
      }
    });

    // Auto-focus input when terminal is visible
    const terminalContainer = document.getElementById('terminal-container');
    if (terminalContainer) {
      terminalContainer.addEventListener('click', () => {
        input.focus();
      });
    }

    // Focus input immediately
    input.focus();
  },

  focusInput() {
    const input = document.getElementById('terminal-input');
    if (input) {
      input.focus();
    }
  },

  autocomplete(input) {
    const value = input.value;
    const parts = value.split(' ');
    const commandPart = parts[0];
    const argPart = parts.slice(1).join(' ');

    // If no space yet, autocomplete command
    if (parts.length === 1) {
      const commands = Object.keys(this.commands);
      const matches = commands.filter(cmd => cmd.startsWith(commandPart));

      if (matches.length === 1) {
        input.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        this.print('');
        this.print(matches.join('  '));
        this.printPrompt();
      }
      return;
    }

    // Autocomplete path for commands that take paths
    const pathCommands = ['cd', 'ls', 'cat', 'tree'];
    if (pathCommands.includes(commandPart)) {
      const matches = this.getPathMatches(argPart);

      if (matches.length === 1) {
        input.value = commandPart + ' ' + matches[0];
      } else if (matches.length > 1) {
        this.print('');
        this.print(matches.join('  '));
        this.printPrompt();
      }
    }
  },

  getPathMatches(partial) {
    const path = this.resolvePath(partial);
    const parts = partial.split('/');
    const searchTerm = parts.pop() || '';
    const basePath = parts.length > 0 ? this.resolvePath(parts.join('/')) : this.currentPath;

    const node = this.getNode(basePath);
    if (!node || !node.children) return [];

    const matches = Object.keys(node.children)
      .filter(name => name.startsWith(searchTerm))
      .map(name => {
        const childNode = node.children[name];
        const suffix = childNode.type === 'dir' ? '/' : '';

        // Build the full path to return
        if (partial.includes('/')) {
          const prefix = parts.join('/');
          return prefix ? prefix + '/' + name + suffix : name + suffix;
        }
        return name + suffix;
      });

    return matches;
  }
};

// Export Terminal for use in other modules
export { Terminal };

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Terminal.init());
} else {
  Terminal.init();
}
