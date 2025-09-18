import React, { useState, useEffect } from 'react';
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
    title: "Sorry, we couldn't load the Feedback App",
    icon: '❌',
    lead: 'The link is missing a required reference.',
    bullets: [
      'If using a QR code, try rescanning the QR code at the washroom entrance.',
      'If using a saved link, retry with the latest valid link.',
    ],
  },
  INVALID_REFID: {
    title: "Sorry, we couldn't load the Feedback App",
    icon: '❌',
    lead: 'Unable to identify the correct washroom from the link. We would love to hear from you though...',
    bullets: [
      'If using a QR code, try rescanning the QR code at the washroom entrance.',
      'If using a saved link, retry with the latest valid link.',
    ],
  },
  VALIDATOR_UNAVAILABLE: {
    title: "Sorry, we couldn't load the Feedback App",
    icon: '🔌',
    lead: 'Our validation service is temporarily unavailable.',
    bullets: ['Check your connection and retry.', 'If it persists, please inform Facilities.'],
  },
  TIMEOUT: {
    title: "Sorry, we couldn't load the Feedback App",
    icon: '🔌',
    lead: 'Validation took longer than expected.',
    bullets: ['Check your connection and retry.', 'If it persists, please inform Facilities.'],
  },
  UPSTREAM: {
    title: "Sorry, we couldn't load the Feedback App",
    icon: '🚧',
    lead: 'Service is temporarily unavailable.',
    bullets: ['Refresh this page and try again.', 'If the problem continues, contact Facilities.'],
  },
  EXCEPTION: {
    title: "Sorry, we couldn't load the Feedback App",
    icon: '❌',
    lead: 'An unexpected error occurred.',
    bullets: ['Refresh this page and try again.', 'If the problem continues, contact Facilities.'],
  },
  DEFAULT: {
    title: "Sorry, we couldn't load the Feedback App",
    icon: '❌',
    lead: 'Please try again.',
    bullets: ['Refresh this page and try again.', 'If the problem continues, contact Facilities.'],
  },
};

function FriendlyError({ code, supportPhone, variant = 'card' }) {
  const c = FRIENDLY[code] || FRIENDLY.DEFAULT;
  const hotline = supportPhone || '+91 90000 99999';

  if (variant === 'card') {
    return (
      <div className="error-wrap error-card--stripe">
        <div className="error-card">
          <h1>🥲 {c.title}</h1>
          <p className="lead">
            <span className="icon" aria-hidden>
              {c.icon || '❌'}
            </span>
            <span>{c.lead}</span>
          </p>
          {c.bullets?.length > 0 && (
            <ul>
              {c.bullets.map((b, i) => (
                <li key={i}>👉 {b}</li>
              ))}
            </ul>
          )}
          {hotline && (
            <p className="muted">
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

  // ⛔ Prevent initial flash: don’t render anything until config.json is loaded
  if (!configLoaded) {
    // Option A: totally blank (fastest, no flicker)
    return null;

    // Option B: minimal branded loader (uncomment if you want a spinner)
    // return (
    //   <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    //     <div className="spinner" />
    //   </div>
    // );
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

    // UPDATED: Only enforce selection when the feature is enabled
    if (showWashroomSelect && !washroomId) {
      document
        .getElementById('washroomFieldset')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert('Please select the washroom (Men’s or Women’s) before submitting.');
      return;
    }

    // 🆕 Optional: front-end guard if you plan to enforce presence strictly
    // If backend is set to MISSING_REF_POLICY=error, this gives instant UX:
    // Enforce refId only when enabled via config.features.require_refid
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
      refId, // 🆕 include the reference id (can be null; backend decides policy)
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

      // ✅ success
      setSubmitted(true);
      setRating('');
      setReasons([]);
      setAdditionalComment('');
      setWashroom('');
      setTimeout(() => setSubmitted(false), 5000);
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
    setRating('');
    setReasons([]);
    setAdditionalComment('');
    setSubmitted(false);
    setWashroom('');
    // 🆕 Do not clear refId on reset; it should stick to the kiosk/session
  };

  // ✅ Backend-gated render (prevents emoji flicker)
  if (!showWashroomSelect && requireRef) {
    if (!configLoaded || refState.status === 'loading') {
      // subtle loading: just the top bar, keep normal page background
      return <TopProgress visible />;
    }
    if (refState.status === 'error') {
      // centered red-tinted card on the same background — no color jump
      return <FriendlyError code={refState.code} supportPhone={supportPhone} variant="card" />;
    }
  }

  return (
    <div className="App">
      {/* 🆕 Tiny badge so you can visually confirm which refId is active */}

      {!submitted ? (
        <>
          <h2>📝 How was your washroom experience?</h2>
          {/* Washroom confirmation banner */}
          {effectiveWashroomLabel && (
            <div
              className="infoBanner"
              style={{
                margin: '8px 0 14px',
                padding: '10px 12px',
                borderRadius: 8,
                background: '#f4f8ff',
                border: '1px solid #d8e6ff',
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              <strong>Feedback for:</strong>{' '}
              <span style={{ fontWeight: 'bold', color: '#1a3d8f' }}>{effectiveWashroomLabel}</span>
              <br />
              <em style={{ opacity: 0.9 }}>
                If this isn’t the correct washroom, please scan the right QR code or check the link.
                {supportPhone && (
                  <>
                    {' '}
                    Need further help? Call Facilities at{' '}
                    <a
                      href={`tel:${supportPhone.replace(/\s+/g, '')}`}
                      style={{ textDecoration: 'underline', color: '#1a3d8f' }}
                    >
                      {supportPhone}
                    </a>
                    .
                  </>
                )}
              </em>
            </div>
          )}

          <div className="smileys">
            {[
              { emoji: '😄', label: 'Excellent', value: 'Excellent' },
              { emoji: '🙂', label: 'Satisfactory', value: 'Good' },
              { emoji: '🙁', label: 'Unsatisfactory', value: 'Poor' },
            ].map((item) => (
              <div key={item.value} className="smileyOption">
                <button
                  onClick={() => {
                    setRating(item.value);
                    setReasons([]);
                    setAdditionalComment('');
                  }}
                  className={rating === item.value ? 'selected' : ''}
                >
                  {item.emoji}
                </button>
                <div className="smileyLabel">{item.label}</div>
              </div>
            ))}
          </div>

          {rating && (
            <>
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

                {/* Show comment box for positive and negative, not for Neutral */}
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

              {/* Washroom selector — rendered only when enabled via config */}
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
        </>
      ) : (
        <div className="thankYouBlock">
          <h3>🎉 Thank you for your valuable feedback!</h3>
          <p style={{ marginTop: '0.5rem' }}>
            Your input helps us make every washroom visit better for everyone.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
