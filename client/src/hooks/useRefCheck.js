// src/hooks/useRefCheck.js
import { useEffect, useState } from 'react';

export function useRefCheck(refId) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    if (!refId) {
      console.log('[refCheck] no refId found in URL');
      setState({ status: 'error', code: 'MISSING_REFID' });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const API_BASE = process.env.REACT_APP_API_BASE || '';
    const url = `${API_BASE}/api/ref/validate?refId=${encodeURIComponent(refId)}`;

    console.log('[refCheck] ➜ GET', url);

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        console.log('[refCheck] ⇦ status', r.status);
        let body = {};
        try {
          body = await r.json();
        } catch (e) {
          console.log('[refCheck] (no JSON body)', e?.message);
        }
        console.log('[refCheck] ⇦ body', body);

        if (cancelled) return;
        if (body?.ok) setState({ status: 'ok', data: body.data });
        else setState({ status: 'error', code: body?.code || 'INVALID_REFID' });
      })
      .catch((err) => {
        if (cancelled) return;
        console.log('[refCheck] ✗ fetch error', err?.message || err);
        setState({ status: 'error', code: 'NETWORK' });
      })
      .finally(() => {
        console.log('[refCheck] done');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refId]);

  return state;
}
