'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import clsx from 'clsx';
import { TiltCard } from './TiltCard';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Minimal markdown renderer (no external deps)
// ---------------------------------------------------------------------------

function parseMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> lines in <ul> — done before newline substitution
  // so items are still separated by \n (no s-flag needed, [^\n]* stays on one line)
  html = html.replace(/(<li>[^\n]*<\/li>\n?)+/g, (match) =>
    `<ul>${match.replace(/\n/g, '')}</ul>`
  );

  html = html
    // Links
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Double newline → paragraph break
    .replace(/\n\n/g, '</p><p>')
    // Single newline
    .replace(/\n/g, '<br/>');

  return `<p>${html}</p>`;
}

// ---------------------------------------------------------------------------
// Post modal
// ---------------------------------------------------------------------------

function PostModal({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  const locale = useLocale();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const date = new Date(post.created_at).toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  // Portal to document.body so the modal escapes any parent stacking context
  // (Blog section is z-[1]; without a portal, Contact section z-[1] painted later
  // would cover the modal on scroll)
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{post.title}</h2>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-1">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          className="px-6 py-5 prose-blog text-[var(--text-secondary)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
        />
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Blog card
// ---------------------------------------------------------------------------

function BlogCard({
  post,
  index,
  inView,
  onClick,
}: {
  post: BlogPost;
  index: number;
  inView: boolean;
  onClick: () => void;
}) {
  const locale = useLocale();
  const date = new Date(post.created_at).toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const preview = post.content.replace(/[#*`>[\]()_~]/g, '').slice(0, 160).trim();

  return (
    <button
      onClick={onClick}
      className={clsx(
        'card text-left w-full card-shadow-md hover:border-[var(--accent-primary)] transition-all duration-500 cursor-pointer group',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="p-6">
        {/* Date */}
        <span className="font-mono text-xs text-[var(--accent-primary)] mb-3 block">{date}</span>

        {/* Title */}
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-primary)] transition-colors leading-snug">
          {post.title}
        </h3>

        {/* Preview */}
        <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
          {preview}{preview.length === 160 ? '…' : ''}
        </p>

        {/* Read more */}
        <span className="inline-flex items-center gap-1 mt-4 text-xs font-mono text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
          читать →
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Blog section
// ---------------------------------------------------------------------------

export function Blog({ onHasPosts }: { onHasPosts?: (has: boolean) => void }) {
  const t = useTranslations('blog');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogPost | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Initial HTTP fetch as a fallback; the WebSocket snapshot will override it.
  useEffect(() => {
    fetch('/api/public/blog')
      .then((res) => res.ok ? res.json() : [])
      .then((data: BlogPost[]) => {
        setPosts(data);
        onHasPosts?.(data.length > 0);
      })
      .catch(() => {
        setPosts([]);
        onHasPosts?.(false);
      })
      .finally(() => setLoading(false));
  }, [onHasPosts]);

  // Real-time updates via WebSocket (same-origin Traefik routing).
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/blog`;
    let ws: WebSocket | null = null;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            action?: string;
            posts?: BlogPost[];
            post?: BlogPost;
            id?: string;
          };
          if (msg.action === 'snapshot' && Array.isArray(msg.posts)) {
            setPosts(msg.posts);
            onHasPosts?.(msg.posts.length > 0);
            setLoading(false);
          } else if (msg.action === 'created' && msg.post) {
            setPosts((prev) => {
              const without = prev.filter((p) => p.id !== msg.post!.id);
              return [msg.post!, ...without];
            });
            onHasPosts?.(true);
          } else if (msg.action === 'updated' && msg.post) {
            setPosts((prev) => prev.map((p) => p.id === msg.post!.id ? msg.post! : p));
          } else if (msg.action === 'deleted' && msg.id) {
            setPosts((prev) => {
              const next = prev.filter((p) => p.id !== msg.id);
              onHasPosts?.(next.length > 0);
              return next;
            });
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!closed) setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      ws?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-20 md:py-32 relative z-[1]" id="blog">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div
          ref={sectionRef}
          className={clsx(
            'text-center mb-16 transition-all duration-600',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="font-mono text-sm text-[var(--accent-primary)] block mb-4">
            {t('section')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card p-6 animate-pulse"
              >
                <div className="h-3 bg-[var(--bg-tertiary)] rounded w-24 mb-4" />
                <div className="h-5 bg-[var(--bg-tertiary)] rounded w-3/4 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded" />
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.97 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <TiltCard scale={1}>
                    <BlogCard
                      post={post}
                      index={i}
                      inView={inView}
                      onClick={() => setSelected(post)}
                    />
                  </TiltCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Post modal */}
      {selected && (
        <PostModal post={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
