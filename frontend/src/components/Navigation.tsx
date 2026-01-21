'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import { useTranslations } from 'next-intl';

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('nav');

  const navLinks = [
    { href: '#about', label: t('about') },
    { href: '#skills', label: t('skills') },
    { href: '#experience', label: t('experience') },
    { href: '#projects', label: t('projects') },
    { href: '#contact', label: t('contact') },
  ];
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on backdrop click
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleBackdropClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('mobile-menu-backdrop')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleBackdropClick);
    return () => document.removeEventListener('click', handleBackdropClick);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Swipe to close functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;

    // Swipe right to close (swipe from left edge)
    if (distance < -minSwipeDistance && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-400 border-b ${
        isScrolled
          ? 'py-4 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-[var(--border-color)]'
          : 'py-5 border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="font-mono text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-[var(--accent-primary)] animate-blink">&gt;</span>
          sabirov.tech
        </a>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-10">
          {navLinks.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors relative group py-1"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity mr-1">{'//'}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative w-[72px] h-9 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 overflow-hidden ml-5 md:ml-0"
          aria-label="Переключить тему"
        >
          {/* Sun icon */}
          <span
            className={`absolute top-1/2 right-2 -translate-y-1/2 text-base z-[1] transition-all duration-300 ${
              theme === 'light'
                ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,200,50,0.9)]'
                : 'opacity-30'
            }`}
          >
            ☀️
          </span>

          {/* Moon icon */}
          <span
            className={`absolute top-1/2 left-2 -translate-y-1/2 text-base z-[1] transition-all duration-300 ${
              theme === 'dark'
                ? 'opacity-100 drop-shadow-[0_0_6px_rgba(220,220,255,0.8)]'
                : 'opacity-30'
            }`}
          >
            🌙
          </span>

          {/* Thumb */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full z-[2] transition-all duration-300 ${
              theme === 'dark'
                ? 'left-[calc(100%-32px)] bg-gradient-to-br from-[#1a1a2a] to-[#0d0d15] shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
                : 'left-1 bg-gradient-to-br from-[#f0f0f5] to-[#d8d8e0] shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
            }`}
          />
        </button>

        {/* Mobile Menu Toggle */}
        <button
          className="flex md:hidden flex-col gap-[5px] p-1 z-[1001] min-w-[44px] min-h-[44px] items-center justify-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Меню"
          aria-expanded={isMobileMenuOpen}
        >
          <span
            className={`w-[25px] h-[2px] bg-[var(--text-primary)] transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 translate-x-[5px] translate-y-[5px]' : ''
            }`}
          />
          <span
            className={`w-[25px] h-[2px] bg-[var(--text-primary)] transition-all duration-300 ${
              isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}
          />
          <span
            className={`w-[25px] h-[2px] bg-[var(--text-primary)] transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 translate-x-[5px] -translate-y-[5px]' : ''
            }`}
          />
        </button>

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="mobile-menu-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] md:hidden transition-opacity duration-400"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu */}
        <ul
          ref={menuRef}
          className={`fixed top-0 w-[75%] max-w-[300px] h-screen bg-[var(--bg-secondary)] flex flex-col justify-center items-center gap-8 border-l border-[var(--border-color)] transition-transform duration-400 ease-out md:hidden z-[1000] shadow-2xl ${
            isMobileMenuOpen ? 'right-0' : '-right-full'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {navLinks.map(link => (
            <li key={link.href} className="w-full text-center">
              <a
                href={link.href}
                className="font-mono text-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors duration-200 block py-3 px-6 min-h-[44px] flex items-center justify-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
