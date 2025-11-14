import React, { useState, useEffect } from 'react';
import { MdCircle, MdCheckCircle } from 'react-icons/md';
import { BiLoaderCircle } from 'react-icons/bi';
import { FaUserCircle } from 'react-icons/fa';
import TaskCard from './TaskCard';
import ResolveTaskModal from './ResolveTaskModal';
import '../../TaskManagement.css';

function TaskList({ assetId, onBackHome, staffInfo }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilters, setStatusFilters] = useState(['Open', 'In Progress']);
  const [staffFilter, setStaffFilter] = useState('all'); // For supervisor filter
  const [selectedTask, setSelectedTask] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const isSupervisor = staffInfo?.role === 'staff_admin';

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksApiUrl = process.env.REACT_APP_TASKS_API;
        if (!tasksApiUrl) {
          console.error('REACT_APP_TASKS_API is not defined in .env');
          return;
        }

        const response = await fetch(tasksApiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched tasks:', data);
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [assetId]);

  // Filter tasks based on selected status filters and staff (for supervisors)
  useEffect(() => {
    let filtered = tasks.filter((task) => statusFilters.includes(task.status));

    // If supervisor and staff filter is set, filter by selected staff
    if (isSupervisor && staffFilter !== 'all') {
      filtered = filtered.filter((task) => task.assignedTo?.id === staffFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilters, staffFilter, isSupervisor, staffInfo]);

  const toggleStatusFilter = (status) => {
    setStatusFilters((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleResolveClick = (task) => {
    setSelectedTask(task);
    setShowResolveModal(true);
  };

  const handleTaskResolved = (taskId) => {
    // Update task status
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: 'Resolved' } : task))
    );
    setShowResolveModal(false);
    setSelectedTask(null);
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  return (
    <div className="task-list-container">
      {/* Header */}
      <div className="task-list-header">
        <button className="task-home-btn" onClick={onBackHome} aria-label="Back to home">
          🏠
        </button>
        <div className="staff-profile">
          {staffInfo?.photo ? (
            <img src={staffInfo.photo} alt="Staff avatar" className="staff-avatar" />
          ) : (
            <FaUserCircle
              className="staff-avatar-icon"
              style={{ color: staffInfo?.gender === 'female' ? '#ec4899' : '#3b82f6' }}
            />
          )}
          <div className="staff-info">
            <h3 className="staff-name">{staffInfo?.name || 'Staff Member'}</h3>
            <p className="staff-title">{staffInfo?.title || 'Housekeeping Staff'}</p>
          </div>
        </div>
        <h2 className="task-list-title">My Tasks</h2>
      </div>

      {/* Filters */}
      <div className="task-filters">
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">Task Status Filter</span>
            <div className="filter-chips">
              <button
                className={`filter-chip ${statusFilters.includes('Open') ? 'active' : ''}`}
                onClick={() => toggleStatusFilter('Open')}
              >
                <MdCircle className="filter-icon" style={{ color: statusFilters.includes('Open') ? 'white' : '#f59e0b' }} />
                Open
              </button>
              <button
                className={`filter-chip ${statusFilters.includes('In Progress') ? 'active' : ''}`}
                onClick={() => toggleStatusFilter('In Progress')}
              >
                <BiLoaderCircle className="filter-icon" style={{ color: statusFilters.includes('In Progress') ? 'white' : '#3b82f6' }} />
                In Progress
              </button>
              <button
                className={`filter-chip ${statusFilters.includes('Resolved') ? 'active' : ''}`}
                onClick={() => toggleStatusFilter('Resolved')}
              >
                <MdCheckCircle className="filter-icon" style={{ color: statusFilters.includes('Resolved') ? 'white' : '#10b981' }} />
                Completed Tasks
              </button>
            </div>
          </div>

          {/* Staff Filter - Only for Supervisors */}
          {isSupervisor && (
            <div className="filter-group">
              <span className="filter-label">Staff Member Filter</span>
              <select
                className="staff-filter-select"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
              >
                <option value="all">All Staff</option>
                <option value="staff-1">John Smith</option>
                <option value="staff-2">Maria Garcia</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="task-cards-container">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks-message">
            <p>No tasks found matching the selected filters.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              formatDateTime={formatDateTime}
              onResolveClick={handleResolveClick}
            />
          ))
        )}
      </div>

      {/* Resolve Task Modal */}
      {showResolveModal && selectedTask && (
        <ResolveTaskModal
          task={selectedTask}
          onClose={() => setShowResolveModal(false)}
          onTaskResolved={handleTaskResolved}
        />
      )}
    </div>
  );
}

export default TaskList;
