import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { useRefCheck } from './hooks/useRefCheck';

const positiveReasons = [
  'Overall Experience was Great',
  'Loved the Hands-Free Operation',
  'Awesome to see Action taken on my Feedback',
];

const negativeReasons = [
  'Paper Towels Unavailable',
  'Liquid Soap Unavailable',
  'Trash Bin not Cleaned',
  'Floor not Clean',
  'Bad Odor',
  'Broken Fixtures',
];

const FRIENDLY = {
  MISSING_REFID: {
    title: "Sorry, we couldn't load the Application",
    icon: '❌',
    lead: 'The link is missing a required reference.',
    bullets: [
      'If using a QR code, try rescanning the QR code at the washroom entrance.',
      'If using a saved link, retry with the latest valid link.',
    ],
  },
  INVALID_REFID: {
    title: "Sorry, we couldn't load the Application",
    icon: '❌',
    lead: 'Unable to identify the correct washroom from the link.',
    bullets: [
      'If using a QR code, try rescanning the QR code at the washroom entrance.',
      'If using a saved link, retry with the latest valid link.',
    ],
  },
  VALIDATOR_UNAVAILABLE: {
    title: "Sorry, we couldn't load the Application",
    icon: '🔌',
    lead: 'Our validation service is temporarily unavailable.',
    bullets: ['Check your connection and retry.', 'If the problem continues, contact Facilities.'],
  },
  TIMEOUT: {
    title: "Sorry, we couldn't load the Application",
    icon: '🔌',
    lead: 'Validation took longer than expected.',
    bullets: ['Check your connection and retry.', 'If the problem continues, contact Facilities.'],
  },
  UPSTREAM: {
    title: "Sorry, we couldn't load the Application",
    icon: '🚧',
    lead: 'Service is temporarily unavailable.',
    bullets: ['Refresh this page and try again.', 'If the problem continues, contact Facilities.'],
  },
  EXCEPTION: {
    title: "Sorry, we couldn't load the Application",
    icon: '❌',
    lead: 'An unexpected error occurred.',
    bullets: ['Refresh this page and try again.', 'If the problem continues, contact Facilities.'],
  },
  DEFAULT: {
    title: "Sorry, we couldn't load the Application",
    icon: '❌',
    lead: 'Please try again.',
    bullets: ['Refresh this page and try again.', 'If the problem continues, contact Facilities.'],
  },
};

function SubmissionNotice({ variant = 'positive', washroomLabel, onClose }) {
  // Auto dismiss after 4s; can also be closed via button
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 10000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isVeryPositive = variant === 'veryPositive';
  const isPositive = variant === 'positive';
  const isNegative = variant === 'negative';

  // reuse existing styles: negative -> "neutral" (amber), others -> "positive" (green)
  const cardClass = isNegative ? 'neutral' : isVeryPositive ? 'veryPositive' : 'positive';
  const iconClass = isNegative ? 'neutral' : 'ok';
  const showConfetti = isVeryPositive; // confetti only for Excellent

  const COPY = {
    veryPositive: {
      title: 'Big Kudos for your feedback.',
      text: 'This motivates us to maintain our high Standards.',
    },
    positive: {
      title: 'Thanks much for your feedback.',
      text: 'Will strive to make it Awesome.',
    },
    negative: {
      title: 'We sincerely appreciate your feedback.',
      text: 'Will ensure to improve your next visit.',
    },
  };
  const c = COPY[variant] || COPY.positive;

  return (
    <div className="submit-wrap">
      {showConfetti && (
        <div className="burst" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      <div className={`submit-card ${cardClass}`} role="status" aria-live="polite">
        <div className={`submit-icon ${iconClass}`} aria-hidden>
          ✓
        </div>
        <h3 className="submit-title">{c.title}</h3>
        <p className="submit-text">{c.text}</p>
        <div className="submit-actions">
          <button className="submit-close" onClick={() => onClose?.()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendlyError({ code, supportPhone, variant = 'card' }) {
  const c = FRIENDLY[code] || FRIENDLY.DEFAULT;
  const hotline = supportPhone || '+91 90000 99999';

  if (variant === 'card') {
    return (
      <div className="error-wrap">
        <div className="error-card error-card--stripe" role="alert" aria-live="polite">
          <h1 className="error-title">🥲 {c.title}</h1>
          <p className="error-lead lead">
            <span className="icon" aria-hidden>
              {c.icon || '❌'}
            </span>
            <span>{c.lead}</span>
          </p>
          {c.bullets?.length > 0 && (
            <ul className="error-bullets">
              {c.bullets.map((b, i) => (
                <li key={i}>👉 {b}</li>
              ))}
            </ul>
          )}
          {hotline && (
            <p className="error-muted muted">
              📞 Need further help? Call Facilities at{' '}
              <a href={`tel:${String(hotline).replace(/\s+/g, '')}`}>{hotline}</a>
            </p>
          )}
        </div>
      </div>
    );
  }
}

function TopProgress({ visible }) {
  if (!visible) return null;
  return (
    <div className="top-progress">
      <div className="bar" />
    </div>
  );
}

// 🆕 Helper to read refId from URL (accepts aliases)
function getRefIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const candidates = [
      url.searchParams.get('refId'),
      url.searchParams.get('referenceid'),
      url.searchParams.get('ref'),
    ];
    const found = candidates.find(Boolean);
    return (found || '').trim() || null;
  } catch {
    return null;
  }
}

// catchy, compact title with a tiny badge
const HEADER_TITLE = (
  <>
    <span className="sparkle" aria-hidden>
      ✨
    </span>
    <span className="title-text">Washroom Feedback</span>
  </>
);

function AppHeader() {
  return (
    <div className="hero hero--two-rows">
      {/* Logo row with flexbox */}
      <div className="hero-logos">
        {/* LEFT: client (Sigma AVIT) */}
        <img
          src="/logos/sigma.png"
          alt="Sigma AVIT"
          className="hero-logo hero-logo--sigma"
          width={2560}
          height={739}
          decoding="async"
          fetchPriority="high"
        />

        {/* RIGHT: powered by myHuB */}
        <div className="hero-right" aria-label="Powered by myHuB">
          <span className="hero-powered">Powered by</span>
          <img
            src="/logos/myhub.png"
            alt="myHuB"
            className="hero-logo hero-logo--myhub"
            width={1024}
            height={1024}
            decoding="async"
          />
        </div>
      </div>
      {/* Title (row 2, centered) */}
      <h1 className="hero-title">{HEADER_TITLE}</h1>
    </div>
  );
}

function App() {
  const [rating, setRating] = useState('');
  const [reasons, setReasons] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [additionalComment, setAdditionalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState({});
  const configReady = config.solution && config.device_id && config.location;
  const API_BASE = (config?.api_base || process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');
  const [washroom, setWashroom] = useState('');
  const [lastRating, setLastRating] = useState(null);
  const detailsRef = useRef(null); // top of reasons/comment section
  const emojiRowRef = useRef(null); // where the emoji row sits

  // Whether config.json has been fetched (non-empty object), regardless of field values
  const configLoaded = Object.keys(config || {}).length > 0;

  // 🔍 Derived ID from config when available
  const showWashroomSelect = config?.features?.washroom_select === true;
  const requireRef = config?.features?.require_refid === true;
  const [refId] = useState(() => getRefIdFromUrl());

  const refState = useRefCheck(refId); // calls /api/ref/validate under the hood
  const backendLabel = refState.status === 'ok' ? refState.data?.label : null;

  // Compute the washroomId we will submit
  // - If selector is ON -> use selected radio -> config.washroom_ids[...] (as before)
  // - If selector is OFF -> use ref mapping if available -> else '' (backend will see null)
  const washroomId = showWashroomSelect
    ? washroom && config?.washroom_ids
      ? config.washroom_ids[washroom] || ''
      : ''
    : '';

  // Optional: friendly label to display to the user
  const effectiveWashroomLabel =
    backendLabel ||
    (showWashroomSelect && washroom
      ? config?.washroom_labels?.[washroom] ||
        (washroom === 'men'
          ? 'Men’s Washroom'
          : washroom === 'women'
            ? 'Women’s Washroom'
            : 'Selected Washroom')
      : null);

  // Admin contact
  const supportPhone = config?.admin_support?.phone || null;

  useEffect(() => {
    fetch('/config.json')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => {
        console.error('❌ Failed to load config.json', err);
        alert('Failed to load configuration. Please contact support.');
      });
  }, []);

  // Show header immediately, then load content progressively
  if (!configLoaded) {
    return (
      <div className="App">
        <AppHeader />
        <main className="page">
          {/* Loading placeholders for content */}
          <div style={{ height: '60px', background: '#f0f0f0', margin: '16px', borderRadius: '8px', animation: 'skeleton-loading 1.5s infinite' }} />
          <div style={{ height: '40px', background: '#f0f0f0', margin: '16px auto', borderRadius: '4px', maxWidth: '300px', animation: 'skeleton-loading 1.5s infinite' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '20px 0' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '50%', animation: 'skeleton-loading 1.5s infinite' }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const toggleReason = (reason) => {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (!configReady) {
      alert('Configuration not loaded yet. Please wait a moment.');
      return;
    }

    // Only enforce selection when the feature is enabled
    if (showWashroomSelect && !washroomId) {
      document
        .getElementById('washroomFieldset')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert('Please select the washroom (Men’s or Women’s) before submitting.');
      return;
    }

    // Optional: front-end guard if you enforce presence strictly
    if (requireRef && !refId) {
      alert(
        'This link is invalid: missing reference id. Please try again with a valid URL / QR code.'
      );
      return;
    }

    setIsSubmitting(true);

    const feedbackData = {
      solution: config.solution || 'SWS',
      rating,
      reasons,
      additionalComment,
      device_id: config.device_id || 'UNKNOWN_DEVICE',
      location: config.location || 'UNKNOWN_LOCATION',
      washroomId: washroomId || null,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      hourOfDay: new Date().getHours(),
      refId, // include the reference id (can be null; backend decides policy)
    };

    try {
      console.log('[submit] ➜ POST', `${API_BASE}/submitFeedback`);
      console.log('[submit] body →', feedbackData);

      const resp = await axios.post(`${API_BASE}/submitFeedback`, feedbackData, { timeout: 5000 });

      console.log('[submit] ⇦ status', resp.status);
      console.log('[submit] ⇦ data  ', resp?.data);

      const { ok, code, message } = resp?.data || {};
      if (!ok) {
        const ErrorCopy = {
          MISSING_REFID: 'Please scan a valid QR code to continue.',
          INVALID_REFID: 'This washroom is not recognized or inactive.',
          VALIDATOR_UNAVAILABLE: 'Can’t validate right now. Please try again.',
          TIMEOUT: 'Validation timed out. Please retry.',
          UPSTREAM: 'Service temporarily unavailable.',
          EXCEPTION: 'Something went wrong. Please retry.',
          SERVER_ERROR: 'Server error. Please try again.',
        };
        const friendly = ErrorCopy[code] || message || 'Could not submit feedback';
        console.log('[submit] handled error →', code, message);
        alert(friendly);
        return; // don’t clear the form on handled errors
      }

      // ✅ SUCCESS
      setLastRating(rating); // NEW: remember selection for the notice
      setSubmitted(true); // show <SubmissionNotice … />

      // clear the form for the next session
      setRating('');
      setReasons([]);
      setAdditionalComment('');
      setWashroom('');

      // ❌ REMOVE the old auto-hide timer; the notice handles its own close
      // setTimeout(() => setSubmitted(false), 5000);

      // (optional) bring the notice into view on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // only unexpected network/server errors land here
      console.log('[submit] ✗ exception', err?.message || err);
      if (err.response) {
        console.log('[submit] ✗ response.status', err.response.status);
        console.log('[submit] ✗ response.data  ', err.response.data);
      } else if (err.request) {
        console.log('[submit] ✗ no response', err.request);
      }
      alert('❌ Network or server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    // setRating('');
    setReasons([]);
    setAdditionalComment('');
    setSubmitted(false);
    // setWashroom('');
    // 🆕 Do not clear refId on reset; it should stick to the kiosk/session
  };

  // ✅ Backend-gated render (prevents emoji flicker)
  if (!showWashroomSelect && requireRef) {
    if (!configLoaded || refState.status === 'loading') {
      return (
        <>
          <AppHeader />
          <main className="page">
            <TopProgress visible />
          </main>
        </>
      );
    }
    if (refState.status === 'error') {
      return (
        <>
          <AppHeader />
          <main className="page">
            <FriendlyError code={refState.code} supportPhone={supportPhone} variant="card" />
          </main>
        </>
      );
    }
  }

  // Scroll to the details block (reasons/comment/buttons) with header offset.
  // Skips if user prefers reduced motion or we're already near the target.
  const smoothScrollToDetails = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const el = detailsRef.current;
    if (!el) return;

    const headerH = (document.querySelector('.hero')?.offsetHeight || 0) + 8; // +8px cushion
    const targetY = el.getBoundingClientRect().top + window.scrollY - headerH;

    // If we're already close, don't animate again (prevents tiny “jerks”)
    if (Math.abs(window.scrollY - targetY) < 24) return;

    window.scrollTo({ top: targetY, behavior: 'smooth' });

    // Optional: give keyboard users a focus point without re-scrolling
    setTimeout(() => {
      const focusable = el.querySelector('button, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus?.({ preventScroll: true });
    }, 250);
  };

  const onEmojiSelect = (value) => {
    setRating(value);
    setReasons([]);
    setAdditionalComment('');

    // Smoothly scroll to the details on all devices
    requestAnimationFrame(() => {
      setTimeout(smoothScrollToDetails, 0);
    });
  };

  const clearRating = () => {
    setRating('');
    setReasons([]);
    setAdditionalComment('');
    // smooth scroll back to the emoji row
    setTimeout(() => {
      emojiRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const getVariantForRating = (r) =>
    r === 'Excellent' ? 'veryPositive' : r === 'Good' ? 'positive' : 'negative';

  return (
    <div className="App">
      {/* 🆕 Tiny badge so you can visually confirm which refId is active */}

      {!submitted ? (
        <>
          <AppHeader />

          <main className="page">
            {/* Washroom confirmation banner */}
            {effectiveWashroomLabel && (
              <div
                className="infoBanner"
                style={{
                  margin: '16px 16px 20px 16px',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {effectiveWashroomLabel?.split(' ').map((word, index) => (
                  <span key={index}>
                    {word}
                    {index === 1 && <br />}
                    {index !== effectiveWashroomLabel.split(' ').length - 1 && index !== 1 && ' '}
                  </span>
                ))}
              </div>
            )}

            {/* Question prompt above emojis */}
            {(() => {
              return (
                <h2 className="prompt prompt--color">
                  <span className="q-text">How was your washroom visit today?</span>
                </h2>
              );
            })()}

            {/* Emoji row */}
            <div ref={emojiRowRef} className="smileys">
              {[
                { emoji: '😄', label: 'Excellent', value: 'Excellent' },
                { emoji: '🙂', label: 'Satisfactory', value: 'Good' },
                { emoji: '🙁', label: 'Unsatisfactory', value: 'Poor' },
              ]
                .filter((item) => !rating || item.value === rating)
                .map((item) => (
                  <div key={item.value} className="smileyOption">
                    <button
                      onClick={() => onEmojiSelect(item.value)}
                      className={rating === item.value ? 'selected' : ''}
                    >
                      {item.emoji}
                    </button>
                    <div className="smileyLabel">{item.label}</div>
                  </div>
                ))}
            </div>

            {rating && (
              <div className="change-rating">
                <button type="button" className="linkBtn" onClick={clearRating}>
                  ← Change rating
                </button>
              </div>
            )}

            {rating && (
              <>
                <div ref={detailsRef} /> {/* <-- anchor to scroll to */}
                <div className="feedbackGrid">
                  {['Excellent', 'Good'].includes(rating) && (
                    <div className="feedbackColumn">
                      <h4>👍 What you liked most?</h4>
                      <div className="reasons">
                        {positiveReasons.map((reason) => {
                          const isSelected = reasons.includes(reason);
                          return (
                            <button
                              key={reason}
                              onClick={() => toggleReason(reason)}
                              className={`reasonButton green ${isSelected ? 'selected' : ''}`}
                            >
                              {isSelected ? '✅ ' : ''}
                              {reason}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {['Poor'].includes(rating) && (
                    <div className="feedbackColumn">
                      <h4>🤔 What could have been better?</h4>
                      <div className="reasons">
                        {negativeReasons.map((reason) => {
                          const isSelected = reasons.includes(reason);
                          return (
                            <button
                              key={reason}
                              onClick={() => toggleReason(reason)}
                              className={`reasonButton amber ${isSelected ? 'selected' : ''}`}
                            >
                              {isSelected ? '✅ ' : ''}
                              {reason}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Comment box */}
                  {['Excellent', 'Good', 'Poor'].includes(rating) && (
                    <div className="comment-box">
                      <label htmlFor="additionalComment">
                        <strong>💡 Anything else you'd like to share?</strong>
                      </label>
                      <br />
                      <textarea
                        id="additionalComment"
                        value={additionalComment}
                        onChange={(e) => setAdditionalComment(e.target.value)}
                        placeholder="Type your comment here..."
                        rows={3}
                        style={{
                          width: '90%',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: '1px solid #ccc',
                          marginTop: '0.5rem',
                        }}
                      />
                    </div>
                  )}
                </div>
                {/* Washroom selector — only when enabled via config */}
                {showWashroomSelect && (
                  <fieldset id="washroomFieldset" className="washroomFieldset">
                    <legend className="washroomLegend">Which washroom?</legend>
                    <div className="washroomCards">
                      <label className={`washroomCard ${washroom === 'men' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="washroom"
                          value="men"
                          checked={washroom === 'men'}
                          onChange={() => setWashroom('men')}
                          className="hiddenInput"
                        />
                        <div className="washroomEmoji">🚹</div>
                        <div className="washroomLabel">Men’s</div>
                      </label>

                      <label className={`washroomCard ${washroom === 'women' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="washroom"
                          value="women"
                          checked={washroom === 'women'}
                          onChange={() => setWashroom('women')}
                          className="hiddenInput"
                        />
                        <div className="washroomEmoji">🚺</div>
                        <div className="washroomLabel">Women’s</div>
                      </label>
                    </div>
                  </fieldset>
                )}
                <div className="button-row">
                  <button
                    className="submitBtn"
                    onClick={handleSubmit}
                    disabled={!configReady || isSubmitting}
                  >
                    Submit
                  </button>
                  <button className="resetBtn" onClick={handleReset} disabled={isSubmitting}>
                    🔄 Reset
                  </button>
                </div>
                {isSubmitting && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '0.5rem', color: '#007bff' }}>Submitting...</p>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      ) : (
        <SubmissionNotice
          variant={getVariantForRating(lastRating)}
          washroomLabel={effectiveWashroomLabel}
          onClose={() => setSubmitted(false)}
        />
      )}
    </div>
  );
}

export default App;
