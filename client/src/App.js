import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const positiveReasons = [
  'Overall Experience was Great',
  'Loved the Hands-Free Operation',
  'Super Happy to see My Feedback Implemented',
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

  const toggleReason = (reason) => {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true); // show loading spinner

    const feedbackData = {
      solution: 'SWS', // ✅ Updated field name to indicate this is coming from Smart Washroom Solution (Not Parking)
      rating,
      reasons,
      additionalComment,
      device_id: 'Tablet01',
      location: 'Washroom 2',
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
      <p className="feedbackNote">
        💬 Your feedback is valued and helps us improve everyone’s washroom experience.
      </p>
      {!submitted ? (
        <>
          <h2>🧼 How was your washroom experience?</h2>
          <div className="smileys">
            {[
              { emoji: '😄', label: 'Super Happy', value: 'Excellent' },
              { emoji: '🙂', label: 'Happy', value: 'Good' },
              { emoji: '😐', label: 'Neutral', value: 'Okay' },
              { emoji: '🙁', label: 'Unhappy', value: 'Poor' },
              { emoji: '😠', label: 'Most Disappointed', value: 'Very Poor' },
            ].map((item) => (
              <div key={item.value} className="smileyOption">
                <button
                  onClick={() => setRating(item.value)}
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
              <h3>
                💡 Just one more step for us to serve you better — what specific aspect stood out to
                you?
              </h3>

              <div className="reasonSection">
                <h4>✅ Positive Feedback</h4>
                <div className="reasons">
                  {positiveReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`reasonButton green ${reasons.includes(reason) ? 'selected' : ''}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <h4>⚠️ Areas to Improve</h4>
                <div className="reasons">
                  {negativeReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`reasonButton amber ${reasons.includes(reason) ? 'selected' : ''}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label htmlFor="additionalComment">
                    <strong>🗣️ Anything else you'd like to share?</strong>
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

                {isSubmitting && <p style={{ color: '#007bff' }}>Submitting...</p>}

                <button className="submitBtn" onClick={handleSubmit}>
                  Submit
                </button>
                <button onClick={handleReset}>🔄 Reset</button>
              </div>
            </>
          )}
        </>
      ) : (
        <h3>🎉 Feedback submitted successfully!</h3>
      )}
    </div>
  );
}

export default App;
