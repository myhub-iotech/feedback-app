import React, { useState, useRef } from 'react';
import '../../TaskManagement.css';

function ResolveTaskModal({ task, onClose, onTaskResolved }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleInputChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    setSuccess('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace on empty field - go to previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsValidating(true);

    // TODO: Replace with actual API call to validate OTP
    // Mock validation - accept "123456" for now
    setTimeout(() => {
      if (otpString === '123456') {
        setSuccess('OTP Validated Successfully. Will proceed updating Task Status to Resolved.');
        setError('');

        // Close modal and update task after 2 seconds
        setTimeout(() => {
          onTaskResolved(task.id);
        }, 2000);
      } else {
        setError('OTP Invalid. Please try again.');
        setOtp(['', '', '', '', '', '']);
        setSuccess('');
        inputRefs[0].current?.focus();
      }
      setIsValidating(false);
    }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Enter OTP to Resolve Task</h3>
        </div>

        <div className="modal-body">
          <div className="task-info-summary">
            <p className="task-type-summary">{task.type}</p>
            <p className="task-washroom-summary">{task.washroomLabel}</p>
          </div>

          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="modal-success" role="alert">
              {success}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="otp-input-container">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="otp-input-box"
                    autoFocus={index === 0}
                    placeholder="_"
                    disabled={isValidating}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={onClose}
                  disabled={isValidating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={otp.join('').length !== 6 || isValidating}
                >
                  {isValidating ? 'Validating...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResolveTaskModal;
