'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLine {
  type: 'command' | 'output' | 'error';
  content: string;
}

export function Terminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);

  // Keyboard shortcut Ctrl+`
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Welcome message
  useEffect(() => {
    if (lines.length === 0) {
      addWelcomeMessage();
    }
  }, []);

  // Matrix effect
  useEffect(() => {
    if (!matrixMode || !matrixCanvasRef.current) return;

    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    let animationId: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff88';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [matrixMode]);

  const addWelcomeMessage = () => {
    const ascii = `   _____   _____ _____  
 / ____/ / ____/|  __ \\ 
| (___  | (___  | |__) |
 \\___  \\ \\___  \\|  _  / 
 ____) | ____) || | \\ \\ 
|_____/ |_____/ |_|  \\_\\
                              `;
    setLines([
      { type: 'output', content: ascii },
      { type: 'output', content: 'Welcome to SSR Terminal v1.0' },
      { type: 'output', content: 'Type "help" for available commands' },
      { type: 'output', content: 'Press Ctrl+` to toggle terminal\n' },
    ]);
  };

  const typewriterEffect = async (text: string, type: 'output' | 'error' = 'output') => {
    setIsTyping(true);
    const words = text.split(' ');
    let currentText = '';

    for (const word of words) {
      currentText += (currentText ? ' ' : '') + word;
      setLines(prev => {
        const newLines = [...prev];
        if (newLines[newLines.length - 1]?.type === type && newLines[newLines.length - 1]?.content.startsWith(currentText.split(' ')[0])) {
          newLines[newLines.length - 1] = { type, content: currentText };
        } else {
          newLines.push({ type, content: currentText });
        }
        return newLines;
      });
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    setIsTyping(false);
  };

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    // Add command to history
    if (trimmedCmd) {
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
    }

    // Add command line
    setLines(prev => [...prev, { type: 'command', content: `$ ${cmd}` }]);

    switch (trimmedCmd) {
      case 'help':
        setLines(prev => [...prev, {
          type: 'output',
          content: `Available commands:
  help      - Show this help message
  about     - Information about me
  skills    - List of technologies I work with
  projects  - My projects
  contact   - Contact information
  clear     - Clear terminal
  theme     - Toggle dark/light theme
  matrix    - Enter the Matrix
  date      - Show current date
  whoami    - Who are you?
  exit      - Close terminal`
        }]);
        break;

      case 'about':
        await typewriterEffect(
          'Hi! I\'m a Full-Stack Developer passionate about creating modern web applications. I specialize in Python backend development, React frontends, and DevOps practices. Currently working on exciting projects involving microservices, real-time systems, and automation.'
        );
        break;

      case 'skills':
        setLines(prev => [...prev, {
          type: 'output',
          content: `Technical Skills:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend:     Python, FastAPI, C#, .NET
Frontend:    React, Next.js, TypeScript
Databases:   PostgreSQL, Oracle, Redis
Message Queue: Kafka
DevOps:      Docker, GitHub Actions
Testing:     Playwright, Jest, pytest
Tools:       Git, Grafana, Prometheus`
        }]);
        break;

      case 'projects':
        setLines(prev => [...prev, {
          type: 'output',
          content: `My Projects:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 🤖 Automated Service Platform
   Telegram bot with admin panel, real-time notifications,
   monitoring via Prometheus & Grafana

2. 🚀 FastAPI Backend
   High-performance REST API with async processing,
   Celery task queues, Redis caching

3. ⚡ This Portfolio
   Modern website with glassmorphism design, 3D tilt effects,
   full CI/CD pipeline with E2E tests

Scroll up to see more details!`
        }]);
        break;

      case 'contact':
        setLines(prev => [...prev, {
          type: 'output',
          content: `Contact Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:    contact@sabirov.tech (in progress)
Telegram: @savik175
GitHub:   github.com/SabirovSR
Location: Russia

Feel free to reach out! Scroll down to the contact form.`
        }]);
        break;

      case 'clear':
        setLines([]);
        break;

      case 'theme':
        document.documentElement.classList.toggle('light');
        const newTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
        setLines(prev => [...prev, {
          type: 'output',
          content: `Theme switched to ${newTheme} mode`
        }]);
        break;

      case 'matrix':
        if (matrixMode) {
          setMatrixMode(false);
          setLines(prev => [...prev, {
            type: 'output',
            content: 'Exiting the Matrix...'
          }]);
        } else {
          setMatrixMode(true);
          setLines(prev => [...prev, {
            type: 'output',
            content: 'Entering the Matrix... Press ESC to exit'
          }]);
        }
        break;

      case 'date':
        setLines(prev => [...prev, {
          type: 'output',
          content: new Date().toString()
        }]);
        break;

      case 'whoami':
        await typewriterEffect('You are a visitor exploring my portfolio. Welcome! 👋');
        break;

      case 'exit':
        setIsOpen(false);
        break;

      case '':
        break;

      default:
        setLines(prev => [...prev, {
          type: 'error',
          content: `Command not found: ${trimmedCmd}. Type 'help' for available commands.`
        }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      executeCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (matrixMode && e.key === 'Escape') {
      setMatrixMode(false);
      setLines(prev => [...prev, {
        type: 'output',
        content: 'Exiting the Matrix...'
      }]);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <>
      {/* Matrix overlay */}
      <AnimatePresence>
        {matrixMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999]"
          >
            <canvas ref={matrixCanvasRef} className="w-full h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[100] p-4 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Toggle Terminal (Ctrl+`)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
      </motion.button>

      {/* Terminal window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[100] w-[90vw] md:w-[600px] max-h-[70vh] terminal-container rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Terminal header */}
            <div className="flex items-center justify-start px-4 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                  title="Close terminal"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-sm text-gray-400 font-mono">
                  terminal@sabirov:~
                </span>
              </div>
            </div>

            {/* Terminal content */}
            <div
              ref={terminalRef}
              className="p-4 h-[400px] overflow-y-auto font-mono text-sm"
              style={{ scrollbarWidth: 'thin' }}
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={`terminal-line mb-1 ${
                    line.type === 'command'
                      ? 'text-[var(--accent-primary)]'
                      : line.type === 'error'
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}
                >
                  {line.content}
                </div>
              ))}
              
              {/* Input line */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
                <span className="text-[var(--accent-primary)]">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
