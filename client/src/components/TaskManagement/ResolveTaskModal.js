import React, { useState } from 'react';
import '../../TaskManagement.css';

function ResolveTaskModal({ task, onClose, onTaskResolved }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleConfirm = async () => {
    setIsResolving(true);
    setError('');

    try {
      // Call the resolve task webhook with alarmId
      const resolveApiUrl = process.env.REACT_APP_RESOLVE_TASK_API;
      if (!resolveApiUrl) {
        throw new Error('REACT_APP_RESOLVE_TASK_API is not defined in .env');
      }

      const response = await fetch(`${resolveApiUrl}?alarmId=${task.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          assetId: task.assetId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to resolve task: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Task resolved successfully:', result);

      setSuccess('Task marked as completed successfully!');
      setError('');

      // Close modal and update task after 1.5 seconds
      setTimeout(() => {
        onTaskResolved(task.id);
      }, 1500);
    } catch (error) {
      console.error('Error resolving task:', error);
      setError('Failed to resolve task. Please try again.');
      setSuccess('');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Mark Task as Completed</h3>
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
            <div>
              <p className="confirmation-message">
                Have you completed this task?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={onClose}
                  disabled={isResolving}
                >
                  No
                </button>
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={handleConfirm}
                  disabled={isResolving}
                >
                  {isResolving ? 'Marking as Completed...' : 'Yes, Mark as Completed'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResolveTaskModal;
