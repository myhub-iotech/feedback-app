import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const positiveReasons = [
  "Overall Experience was Great",
  "Loved the Hands-Free Operation",
  "Super Happy to see My Feedback Implemented",
];

const negativeReasons = [
  "Paper Towels Unavailable",
  "Liquid Soap Unavailable",
  "Trash Bin not Cleaned",
  "Floor not Clean",
  "Bad Odor",
  "Broken Fixtures",
];

function App() {
  const [rating, setRating] = useState("");
  const [reasons, setReasons] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [additionalComment, setAdditionalComment] = useState("");

  const toggleReason = (reason) => {
    setReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    const feedbackData = {
      module: "washroom",
      rating,
      reasons,
      additionalComment, // ✅ include this field
      device_id: "Tablet01",
      location: "Washroom 2",
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post("http://localhost:5000/submitFeedback", feedbackData);
      setSubmitted(true);
      setRating("");
      setReasons([]);
      setAdditionalComment(""); // ✅ clear after submit
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit feedback");
    }
  };

  return (
    <div className="App">
      <p className="feedbackNote">
        💬 Your feedback is valued and helps us improve everyone’s washroom
        experience.
      </p>
      <h2>🧼 How was your washroom experience?</h2>

      {!submitted ? (
        <>
          <div className="smileys">
            {[
              { emoji: "😄", label: "Super Happy", value: "Excellent" },
              { emoji: "🙂", label: "Happy", value: "Good" },
              { emoji: "😐", label: "Neutral", value: "Okay" },
              { emoji: "🙁", label: "Unhappy", value: "Poor" },
              { emoji: "😠", label: "Most Disappointed", value: "Very Poor" },
            ].map((item) => (
              <div key={item.value} className="smileyOption">
                <button
                  onClick={() => setRating(item.value)}
                  className={rating === item.value ? "selected" : ""}
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
                💡 Just one more step for us to serve you better — what specific
                aspect stood out to you?
              </h3>

              <div className="reasonSection">
                <h4>✅ Positive Feedback</h4>
                <div className="reasons">
                  {positiveReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`reasonButton green ${
                        reasons.includes(reason) ? "selected" : ""
                      }`}
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
                      className={`reasonButton amber ${
                        reasons.includes(reason) ? "selected" : ""
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: "1rem" }}>
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
                      width: "90%",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      marginTop: "0.5rem",
                    }}
                  />
                </div>

                <button className="submitBtn" onClick={handleSubmit}>
                  Submit
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <h3>✅ Thank you for your feedback!</h3>
      )}
    </div>
  );
}

export default App;
