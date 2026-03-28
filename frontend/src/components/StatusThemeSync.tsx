'use client';

import { useOwnerStatus } from '@/hooks/useOwnerStatus';
import type { OwnerStatus } from '@/lib/api.server';

/** Applies live status color theme on routes that do not render Hero. */
export function StatusThemeSync({ initialStatus }: { initialStatus: OwnerStatus | null }) {
  useOwnerStatus(initialStatus);
  return null;
}
