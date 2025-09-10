import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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

  // 🔍 Derived ID from config when available
  const washroomId = washroom && config?.washroom_ids ? config.washroom_ids[washroom] || '' : '';

  const [refId] = useState(() => getRefIdFromUrl());

  const requireRef = process.env.REACT_APP_REQUIRE_REFID === 'true';

  useEffect(() => {
    fetch('/config.json')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => {
        console.error('❌ Failed to load config.json', err);
        alert('Failed to load configuration. Please contact support.');
      });
  }, []);

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

    if (!washroomId) {
      document
        .getElementById('washroomFieldset')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert('Please select the washroom (Men’s or Women’s) before submitting.');
      return;
    }

    // 🆕 Optional: front-end guard if you plan to enforce presence strictly
    // If backend is set to MISSING_REF_POLICY=error, this gives instant UX:
    if (process.env.REACT_APP_REQUIRE_REFID === 'true' && !refId) {
      alert('This link is invalid: missing reference id. Pleas try again with valid URL / QR code');
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
      washroomId, // from config
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      hourOfDay: new Date().getHours(),
      refId, // 🆕 include the reference id (can be null; backend decides policy)
    };

    try {
      await axios.post(`${API_BASE}/submitFeedback`, feedbackData);
      setSubmitted(true);
      setRating('');
      setReasons([]);
      setAdditionalComment('');
      setWashroom('');

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('❌ Failed to submit feedback:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Status code:', err.response.status);
        console.error('Headers:', err.response.headers);
        // 🆕 Surface backend refId errors cleanly
        if (err.response.data?.message) alert(err.response.data.message);
        else alert('❌ Failed to submit feedback');
      } else if (err.request) {
        console.error('No response received:', err.request);
        alert('❌ No response from server');
      } else {
        console.error('Error setting up request:', err.message);
        alert('❌ Failed to submit feedback');
      }
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

  // ✅ PLACE THE GUARD *HERE* — after all hooks, before the main return
  if (requireRef && refId === null) {
    return (
      <div className="missing-refid">
        <h2>Invalid QR Code or URL</h2>
        <p>This link does not have a required Input. Please use the correct QR code or URL ...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* 🆕 Tiny badge so you can visually confirm which refId is active */}
      {refId ? (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, opacity: 0.8 }}>
          Ref: <code>{refId}</code>
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, opacity: 0.6 }}>
          <em>No ref</em>
        </div>
      )}

      {!submitted ? (
        <>
          <h2>📝 How was your washroom experience?</h2>
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

              {/* Washroom selector — place below the comment box */}
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
