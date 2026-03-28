'use client';

import { useEffect, useState } from 'react';
import type { OwnerStatus } from '@/lib/api.server';

export function applyStatusTheme(status: OwnerStatus) {
  document.documentElement.setAttribute('data-status', status.code);
}

/**
 * Subscribes to owner status (HTTP + WebSocket) and applies CSS theme via data-status.
 */
export function useOwnerStatus(initialStatus: OwnerStatus | null) {
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus | null>(initialStatus);

  useEffect(() => {
    if (initialStatus) applyStatusTheme(initialStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let unmounted = false;

    const apply = (data: OwnerStatus) => {
      setOwnerStatus(data);
      applyStatusTheme(data);
    };

    if (!initialStatus) {
      fetch('/api/public/status')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: OwnerStatus | null) => {
          if (d && !unmounted) apply(d);
        })
        .catch(() => {});
    }

    const connectWs = () => {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws/status`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OwnerStatus & { ping?: boolean };
          if (data.ping) return;
          apply(data);
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (!unmounted) reconnectTimer = setTimeout(connectWs, 3000);
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWs();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
    // Intentionally run once on mount — same as previous Hero implementation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ownerStatus;
}
