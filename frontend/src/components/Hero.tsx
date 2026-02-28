'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import type { OwnerStatus } from '@/lib/api.server';

function applyStatusTheme(status: OwnerStatus) {
  document.documentElement.setAttribute('data-status', status.code);
}

export function Hero({ initialStatus = null }: { initialStatus?: OwnerStatus | null }) {
  const t = useTranslations('hero');
  const locale = useLocale();
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [typedText, setTypedText] = useState('');
  const fullText = t('subtitle');
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus | null>(initialStatus);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80]);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, []);

  // Apply the server-provided status theme on first mount so CSS variables
  // are set before any paint, preventing the status badge from flashing.
  useEffect(() => {
    if (initialStatus) applyStatusTheme(initialStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let unmounted = false;

    const applyStatus = (data: OwnerStatus) => {
      setOwnerStatus(data);
      applyStatusTheme(data);
    };

    // HTTP fallback: only needed when no server-side initial status was provided.
    if (!initialStatus) {
      fetch('/api/public/status')
        .then((r) => r.ok ? r.json() : null)
        .then((d: OwnerStatus | null) => { if (d && !unmounted) applyStatus(d); })
        .catch(() => {});
    }

    // WebSocket via same-origin URL so it proxies through the Next.js rewrite
    // (/api/ws/status → backend:8000/api/ws/status). This avoids any
    // cross-domain TLS / browser-security issues.
    const connectWs = () => {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws/status`;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OwnerStatus & { ping?: boolean };
          if (data.ping) return;
          applyStatus(data);
        } catch { /* ignore malformed frames */ }
      };

      ws.onclose = () => {
        if (!unmounted) reconnectTimer = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => { ws?.close(); };
    };

    connectWs();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const statusLabel = ownerStatus
    ? (locale === 'ru' ? ownerStatus.label_ru : ownerStatus.label_en)
    : '';

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center relative z-[1] pt-20" id="hero">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="animate-[fadeInUp_0.8s_ease-out] order-2 lg:order-1 text-center lg:text-left">
            {/* Status badge — hidden until status arrives, then fades in */}
            <div className={`mb-6 transition-all duration-500 ${ownerStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                 style={{ minHeight: '2.25rem' }}>
              <span className="inline-flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-4 py-2 rounded-full font-mono text-sm text-[var(--accent-primary)]">
                {/* Dot: only for online status */}
                {ownerStatus?.code === 'online' && (
                  <span className="w-2 h-2 rounded-full animate-pulse bg-[var(--accent-primary)]" />
                )}

                {/* Emoji: for all non-online statuses; gaming pulses */}
                {ownerStatus && ownerStatus.code !== 'online' && (
                  <span className={ownerStatus.code === 'gaming' ? 'animate-pulse' : ''}>
                    {ownerStatus.emoji}
                  </span>
                )}

                {statusLabel}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              {t('greeting')}
              <span className="block bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>

            <p ref={subtitleRef} className="font-mono text-lg text-[var(--text-secondary)] mb-6 h-7">
              {typedText}
            </p>

            <p className="text-lg text-[var(--text-secondary)] max-w-[500px] mb-8 mx-auto lg:mx-0">
              {t('description')}
            </p>

            <div className="flex gap-4 flex-wrap justify-center lg:justify-start">
              <a href="#contact" className="btn-primary">
                {t('cta')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#projects" className="btn-secondary">
                {t('viewProjects')}
              </a>
            </div>
          </div>

          {/* Image */}
          <div className="relative flex justify-center order-1 lg:order-2 animate-[fadeInUp_0.8s_ease-out_0.2s_backwards]">
            <div className="relative w-[280px] h-[280px] lg:w-[350px] lg:h-[350px]">
              {/* Rotating border */}
              <div className="absolute inset-[-3px] bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-purple)] rounded-full animate-[rotate_8s_linear_infinite] -z-10" />
              <div className="absolute inset-0 bg-[var(--bg-primary)] rounded-full -z-10" />

              {/* Avatar */}
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--bg-primary)]">
                <Image
                  src="/avatar.jpg"
                  alt="Сабиров Савелий"
                  width={350}
                  height={350}
                  className="w-full h-full object-cover"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2315151f' width='100' height='100'/%3E%3Ctext x='50' y='55' font-size='40' text-anchor='middle' fill='%2300ff88'%3EСС%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>

            {/* Floating elements with parallax - hidden on mobile */}
            <motion.div 
              className="hidden lg:block absolute top-[20%] -right-[10%] font-mono text-sm px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg animate-float"
              style={{ y: y1 }}
            >
              <span className="mr-2">🐳</span> Docker / DevOps
            </motion.div>
            <motion.div 
              className="hidden lg:block absolute bottom-[20%] -left-[5%] font-mono text-sm px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg animate-float" 
              style={{ animationDelay: '1s', y: y2 }}
            >
              <span className="mr-2">⚡</span> C# / .NET
            </motion.div>
            <motion.div 
              className="hidden lg:block absolute bottom-[5%] -right-[5%] font-mono text-sm px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg animate-float" 
              style={{ animationDelay: '2s', y: y3 }}
            >
              <span className="mr-2">🐍</span> Python / FastAPI
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
