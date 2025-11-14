import React, { useState, useRef } from 'react';
import '../../TaskManagement.css';

function StaffPinEntry({ onPinValidated, onBackHome }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isLocked, setIsLocked] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleInputChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace on empty field - go to previous
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pinString = pin.join('');
    if (pinString.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    if (isLocked) {
      setError('Service Desk is locked out. Please try again later or contact Admin.');
      return;
    }

    // TODO: Replace with actual API call
    // Mock validation - accept "1234" for Staff User, "9999" for Staff Admin
    if (pinString === '4280') {
      // Mock staff data - Staff User
      const staffData = {
        id: 'staff-1',
        name: 'John Smith',
        title: 'Housekeeping Staff',
        gender: 'male',
        photo: null,
        role: 'staff_user', // staff_user or staff_admin
      };
      onPinValidated(staffData);
    } else if (pinString === '0060') {
      // Mock staff data - Staff Admin (Supervisor)
      const staffData = {
        id: 'admin-1',
        name: 'Sarah Johnson',
        title: 'Supervisor',
        gender: 'female',
        photo: null,
        role: 'staff_admin', // Can see all tasks
      };
      onPinValidated(staffData);
    } else {
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      setPin(['', '', '', '']); // Clear PIN on error
      inputRefs[0].current?.focus();

      if (newAttemptsLeft <= 0) {
        setIsLocked(true);
        setError(
          'Service Desk is locked out due to max # of consecutive unsuccessful PIN attempts. Please try again later or contact Admin.'
        );
      } else {
        setError(
          `Entered PIN is Incorrect. Please try again. ${newAttemptsLeft} attempt${newAttemptsLeft > 1 ? 's' : ''} remaining, after which Service Desk will get locked out.`
        );
      }
    }
  };

  return (
    <div className="task-auth-container">
      <button className="auth-back-btn" onClick={onBackHome} aria-label="Back to home">
        🏠
      </button>
      <div className="task-auth-card">
        <h2 className="task-auth-title">Enter Staff PIN to start Task Management</h2>

        {error && (
          <div className="task-auth-error" role="alert">
            {error}
          </div>
        )}

        {!isLocked && (
          <form onSubmit={handleSubmit}>
            <div className="pin-input-container">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="pin-input-box"
                  autoFocus={index === 0}
                  placeholder="_"
                  aria-label={`PIN digit ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              className="pin-submit-btn"
              disabled={pin.join('').length !== 4}
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default StaffPinEntry;
