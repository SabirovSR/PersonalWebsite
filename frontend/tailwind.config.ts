import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme
        dark: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a25',
          card: '#15151f',
        },
        // Light theme
        light: {
          primary: '#f8f9fc',
          secondary: '#ffffff',
          tertiary: '#e8ecf4',
          card: '#ffffff',
        },
        // Accent colors
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          tertiary: 'var(--accent-tertiary)',
          purple: 'var(--accent-purple)',
        },
        border: 'var(--border-color)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'blink': 'blink 1s infinite',
        'pulse-slow': 'pulse 2s infinite',
        'float': 'float 4s ease-in-out infinite',
        'rotate': 'rotate 8s linear infinite',
        'glow': 'glow 3s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        rotate: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        glow: {
          '0%, 100%': { 
            filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.6))' 
          },
          '50%': { 
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.9))' 
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
