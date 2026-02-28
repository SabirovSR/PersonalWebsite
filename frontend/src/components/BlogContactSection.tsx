'use client';

import { useState } from 'react';
import { Blog } from '@/components/Blog';
import { Contact } from '@/components/Contact';
import type { BlogPost } from '@/lib/api.server';

export function BlogContactSection({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [hasBlog, setHasBlog] = useState(initialPosts.length > 0);

  return (
    <>
      <Blog initialPosts={initialPosts} onHasPosts={setHasBlog} />
      <Contact hasBlog={hasBlog} />
    </>
  );
}
