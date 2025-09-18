// refRoutes.js
const express = require('express');
const { LRUCache } = require('lru-cache'); // <-- named import for v7+

const router = express.Router();

const OCTACLE_WEBHOOK_URL = process.env.OCTACLE_WEBHOOK_URL;
if (!OCTACLE_WEBHOOK_URL) throw new Error('OCTACLE_WEBHOOK_URL is not set');

const REQ_TIMEOUT = Number(process.env.OCTACLE_TIMEOUT_MS || 2000);
const CACHE_TTL_MS = Number(process.env.REF_CACHE_TTL_MS || 600000); // 10 min default
const CACHE_ENABLED = CACHE_TTL_MS > 0; // set 0 to disable caching
const cache = new LRUCache({ max: 1000, ttl: CACHE_ENABLED ? CACHE_TTL_MS : 1 });

// --- debug logging helpers ---
const LOG_VALIDATION = (process.env.LOG_VALIDATION || 'false').toLowerCase() === 'true';
const logv = (...args) => LOG_VALIDATION && console.log('[ref.validate]', ...args);

const redactUrl = (u) =>
  String(u)
    .replace(/(\/webhook\/)[^/?]+/i, '$1<redacted>') // hide token in path
    .replace(
      /([?&]id=)([^&]+)/i,
      (
        _,
        a,
        b // mask id param
      ) => a + (b.length > 8 ? `${b.slice(0, 4)}…${b.slice(-4)}` : '****')
    );
// --- end helpers ---

router.get('/validate', async (req, res) => {
  const refId = (req.query.refId || '').trim();
  const reqId = Math.random().toString(36).slice(2, 8);
  logv && logv(reqId, 'start', { refId });

  if (!refId) {
    logv && logv(reqId, 'error', 'MISSING_REFID');
    return res.json({ ok: false, code: 'MISSING_REFID', message: 'Missing refId' });
  }

  if (CACHE_ENABLED) {
    const cacheKey = `ref:${refId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logv && logv(reqId, 'cache-hit', { refId, ok: cached.ok, code: cached.code });
      return res.json(cached);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQ_TIMEOUT);

  try {
    // If refId ≠ assetId in your world, transform here.
    const assetId = refId;
    const masked = assetId ? `${assetId.slice(0, 4)}…${assetId.slice(-4)}` : '(empty)';
    logv && logv(reqId, 'computed-ids', { refId, assetId: masked, len: (assetId || '').length });

    const url = `${OCTACLE_WEBHOOK_URL}?id=${encodeURIComponent(assetId)}`;
    logv && logv(reqId, 'fetch', redactUrl(url));

    const t0 = Date.now();
    const r = await fetch(url, { signal: controller.signal });
    const ms = Date.now() - t0;
    clearTimeout(timer);

    logv && logv(reqId, 'upstream-status', r.status, `${ms}ms`);

    if (!r.ok) {
      const out = { ok: false, code: 'UPSTREAM', message: `Octacle HTTP ${r.status}` };
      if (CACHE_ENABLED) cache.set(cacheKey, out, { ttl: 60000 });
      return res.json(out);
    }

    const data = await r.json().catch(() => null);
    logv && logv(reqId, 'upstream-body-raw', data);

    const item = Array.isArray(data) ? data[0] : data;

    if (!item || typeof item !== 'object') {
      const out = { ok: false, code: 'INVALID_REFID', message: 'Unknown reference id' };
      if (CACHE_ENABLED) cache.set(cacheKey, out, { ttl: 60000 });
      return res.json(out);
    }

    const returnedId = item?.id?.id || null;
    const label = item?.name ?? item?.label ?? item?.title ?? null;

    const sameId =
      typeof returnedId === 'string' &&
      typeof assetId === 'string' &&
      returnedId.toLowerCase() === assetId.toLowerCase();

    if (!sameId) {
      logv && logv(reqId, 'id-mismatch', { assetId, returnedId });
      const out = { ok: false, code: 'ID_MISMATCH', message: 'Response id mismatch' };
      if (CACHE_ENABLED) cache.set(cacheKey, out, { ttl: 60000 });
      return res.json(out);
    }

    const normalized = {
      ok: true,
      code: 'OK',
      data: {
        assetId,
        label, // ← "4F Women Washroom"
        status: (item?.status && String(item.status).toLowerCase()) || 'unknown',
      },
    };

    if (CACHE_ENABLED) cache.set(cacheKey, normalized);
    logv &&
      logv(reqId, 'normalized', {
        ok: true,
        label: normalized.data.label,
        status: normalized.data.status,
      });
    return res.json(normalized);
  } catch (e) {
    const code = e.name === 'AbortError' ? 'TIMEOUT' : 'EXCEPTION';
    logv && logv(reqId, 'error', code, e.message);

    const out = { ok: false, code, message: 'Validator could not reach Octacle' };

    // ⬇️ Either do NOT cache timeouts while debugging…
    // (leave this line out for TIMEOUT)
    // if (CACHE_ENABLED && code !== 'TIMEOUT') cache.set(cacheKey, out, { ttl: 30000 });

    // …or cache TIMEOUT for a *very* short time:
    if (CACHE_ENABLED) {
      const ttl = code === 'TIMEOUT' ? 5000 : 30000; // 5s for TIMEOUTs
      cache.set(cacheKey, out, { ttl });
    }

    return res.json(out);
  }
});

module.exports = router;
