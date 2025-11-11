import React from 'react';
import '../../TaskManagement.css';

function TaskCard({ task, formatDateTime, onResolveClick }) {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'status-open';
      case 'In Progress':
        return 'status-in-progress';
      case 'Resolved':
        return 'status-resolved';
      default:
        return '';
    }
  };

  const getWashroomIcon = (washroom) => {
    switch (washroom) {
      case 'Men':
        return '🚹';
      case 'Women':
        return '🚺';
      case 'Unisex':
        return '🚻';
      default:
        return '🚻';
    }
  };

  const canResolve = task.status === 'Open' || task.status === 'In Progress';

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className={`task-status-badge ${getStatusBadgeClass(task.status)}`}>
          {task.status}
        </span>
        <span className="task-datetime">{formatDateTime(task.createdAt)}</span>
      </div>

      <div className="task-card-body">
        <div className="task-washroom">
          <span className="washroom-icon" aria-hidden="true">
            {getWashroomIcon(task.washroom)}
          </span>
          <span className="washroom-label">{task.washroomLabel}</span>
        </div>

        <h3 className="task-type">{task.type}</h3>
      </div>

      {canResolve && (
        <div className="task-card-footer">
          <button className="task-resolve-btn" onClick={() => onResolveClick(task)}>
            Mark as Resolved
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskCard;
