/**
 * Server-only API helpers.
 * These functions run exclusively on the server (Server Components, Route Handlers).
 * They bypass Next.js rewrites and speak directly to the backend.
 */

export interface OwnerStatus {
  code: string;
  emoji: string;
  label_ru: string;
  label_en: string;
  color: string;
  updated_at: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const BACKEND = process.env.BACKEND_URL ?? 'http://backend:8000';

export async function fetchStatus(): Promise<OwnerStatus | null> {
  try {
    const res = await fetch(`${BACKEND}/api/public/status`, {
      cache: 'no-store',
    });
    return res.ok ? (res.json() as Promise<OwnerStatus>) : null;
  } catch {
    return null;
  }
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${BACKEND}/api/public/blog`, {
      next: { revalidate: 30 },
    });
    return res.ok ? (res.json() as Promise<BlogPost[]>) : [];
  } catch {
    return [];
  }
}
