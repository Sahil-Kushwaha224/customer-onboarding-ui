import React, { useState } from 'react';
import { TaskManager, Alert } from '../components';

/**
 * Example page showing how to use the new TaskManager component
 */
const NewTaskPage = () => {
  // Component state
  const [selectedTask, setSelectedTask] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Add alert message with auto-dismiss
  const addAlert = (message, type = 'info') => {
    const alert = { id: Date.now(), message, type };
    setAlerts(prev => [...prev, alert]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  // Handle task selection
  const handleTaskSelect = (task) => {
    console.log('Task selected:', task);
    setSelectedTask(task);
    addAlert(`Selected task for ${task.customerName}`, 'info');
  };

  // Handle task updates (assign, complete, etc.)
  const handleTaskUpdate = (task, action) => {
    console.log(`Task ${task.id} was ${action}:`, task);
    
    // Show appropriate message based on action
    switch (action) {
      case 'assigned':
        addAlert(`Task assigned to ${task.assignedTo} successfully`, 'success');
        break;
      case 'completed':
        addAlert(`Task for ${task.customerName} completed`, 'success');
        break;
      case 'rejected':
        addAlert(`Task for ${task.customerName} rejected`, 'warning');
        break;
      default:
        addAlert(`Task updated: ${action}`, 'info');
    }

    // You could also send updates to your backend here
    // updateTaskInBackend(task, action);
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1>Task Management</h1>
        <p style={{ color: '#6b7280' }}>
          Manage customer onboarding tasks and assignments
        </p>
      </div>

      {/* Alerts */}
      <div style={{ marginBottom: '1rem' }}>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            type={alert.type}
            dismissible
            onDismiss={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
          >
            {alert.message}
          </Alert>
        ))}
      </div>

      {/* Task Manager */}
      <TaskManager
        onTaskSelect={handleTaskSelect}
        onTaskUpdate={handleTaskUpdate}
        autoRefresh={true}
        refreshInterval={30000} // Refresh every 30 seconds
      />

      {/* Additional Task Actions */}
      {selectedTask && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <h3>Quick Actions for {selectedTask.customerName}</h3>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => {
                // Simulate task completion
                handleTaskUpdate({ ...selectedTask, status: 'completed' }, 'completed');
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Mark Complete
            </button>
            
            <button
              onClick={() => {
                // Simulate task rejection
                handleTaskUpdate({ ...selectedTask, status: 'rejected' }, 'rejected');
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
            
            <button
              onClick={() => {
                // Open task details in new window/modal
                console.log('Opening detailed view for task:', selectedTask.id);
                addAlert('Opening detailed task view...', 'info');
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Task Statistics */}
      <div style={{ 
        marginTop: '2rem', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem' 
      }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#ffffff', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>Total Tasks</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {/* This would come from your task data */}
            --
          </p>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#ffffff', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>Assigned</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            --
          </p>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#ffffff', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>Pending</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            --
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewTaskPage;