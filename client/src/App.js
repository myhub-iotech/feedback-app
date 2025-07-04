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

function App() {
  const [rating, setRating] = useState('');
  const [reasons, setReasons] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [additionalComment, setAdditionalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState({});
  const configReady = config.solution && config.device_id && config.location;

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

    setIsSubmitting(true); // show loading spinner

    const feedbackData = {
      solution: config.solution || 'SWS', // ✅ Updated field name to indicate this is coming from Smart Washroom Solution (Not Parking)
      rating,
      reasons,
      additionalComment,
      device_id: config.device_id || 'UNKNOWN_DEVICE',
      location: config.location || 'UNKNOWN_LOCATION',
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent, // ✅ browser info
      hourOfDay: new Date().getHours(), // ✅ time of day
    };

    try {
      await axios.post('https://feedback-app-7ll0.onrender.com/submitFeedback', feedbackData);
      setSubmitted(true);
      setRating('');
      setReasons([]);
      setAdditionalComment('');

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to submit feedback');
    } finally {
      setIsSubmitting(false); // hide spinner
    }
  };

  const handleReset = () => {
    setRating('');
    setReasons([]);
    setAdditionalComment('');
    setSubmitted(false);
  };

  return (
    <div className="App">
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
