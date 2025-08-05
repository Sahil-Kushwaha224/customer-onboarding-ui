import React, { useState, useEffect } from 'react';
import './OpenTask.css';

const OpenTask = () => {
  const [openTasks, setOpenTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Load open tasks from localStorage (submitted from customer onboarding)
  useEffect(() => {
    const loadOpenTasks = () => {
      setLoading(true);
      try {
        const savedApplications = localStorage.getItem('submittedApplications');
        if (savedApplications) {
          const parsedApplications = JSON.parse(savedApplications);
          console.log('All applications in localStorage:', parsedApplications);
          
          // Filter applications that are in progress or pending (open tasks)
          const openTasksData = parsedApplications
            .filter(app => {
              console.log('Checking app:', app.id, 'workflowStatus:', app.workflowStatus, 'status:', app.status);
              return app.workflowStatus === 'manual_review' || 
                     app.status === 'pending_review' ||
                     app.workflowStatus === 'in_progress' ||
                     app.status === 'submitted';
            })
            .map(app => ({
              ...app,
              customerName: app.customer?.fullName || 'Unknown Customer',
              incomeBand: app.customer?.income_band || 'Not specified',
              pep: app.customer?.pep || false,
              completedSteps: calculateCompletedSteps(app),
              submissionDate: app.submissionTimestamp ? 
                new Date(app.submissionTimestamp).toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0],
              // Task-specific fields
              taskName: 'Manual Review',
              creationDate: app.submissionTimestamp ? 
                new Date(app.submissionTimestamp).toLocaleDateString() : 
                new Date().toLocaleDateString(),
              taskStatus: app.assignedTo ? 'assigned' : 'unassigned',
              assignedTo: app.assignedTo || null,
              isAssigned: !!app.assignedTo,
              customerData: {
                fullName: app.customer?.fullName || '',
                dob: app.customer?.dob || '',
                mobile: app.customer?.mobile || '',
                email: app.customer?.email || '',
                occupation: app.customer?.occupation || '',
                income_band: app.customer?.income_band || '',
                pep: app.customer?.pep || false,
                address: app.address || {},
                product: app.product || {},
                ids: app.ids || {}
              }
            }));
          setOpenTasks(openTasksData);
        } else {
          setOpenTasks([]);
        }
      } catch (error) {
        console.error('Error loading open tasks:', error);
        addAlert('Error loading tasks', 'error');
        setOpenTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadOpenTasks();
    
    // Listen for storage changes to update in real-time
    const handleStorageChange = () => {
      loadOpenTasks();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Get task status based on workflow and application status
  const getTaskStatus = (workflowStatus, status) => {
    if (workflowStatus === 'manual_review') return 'Manual Review';
    if (status === 'pending_review') return 'Pending Review';
    if (workflowStatus === 'in_progress') return 'In Progress';
    if (status === 'submitted') return 'Submitted';
    return 'Unknown';
  };

  // Calculate completed steps based on available data
  const calculateCompletedSteps = (app) => {
    let steps = 0;
    
    // Check if basic customer info is complete
    if (app.customer?.fullName && app.customer?.email && app.customer?.mobile) {
      steps++;
    }
    
    // Check if address is complete
    if (app.address?.line1 && app.address?.city && app.address?.state) {
      steps++;
    }
    
    // Check if documents are uploaded
    if (app.documents && app.documents.length > 0) {
      steps++;
    }
    
    // Check if product selection is complete
    if (app.product?.desired_account) {
      steps++;
    }
    
    return `${steps}/4`;
  };

  const addAlert = (message, type = 'info') => {
    const alert = { id: Date.now(), message, type };
    setAlerts(prev => [...prev, alert]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  const handleTaskAction = async (action) => {
    if (!selectedTask) {
      addAlert('No task selected', 'error');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const newWorkflowStatus = action === 'approve' ? 'account_setup' : 'rejected';

      // Update application status in localStorage
      const savedApplications = JSON.parse(localStorage.getItem('submittedApplications') || '[]');
      const updatedApplications = savedApplications.map(app => 
        app.id === selectedTask.id 
          ? { 
              ...app, 
              status: newStatus,
              workflowStatus: newWorkflowStatus,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewer: 'Admin User',
              workflowHistory: [
                ...(app.workflowHistory || []),
                {
                  step: 'Task Review',
                  status: 'completed',
                  timestamp: new Date().toISOString(),
                  description: `Task ${action}d by reviewer`
                },
                ...(action === 'approve' ? [{
                  step: 'Account Setup',
                  status: 'in_progress',
                  timestamp: new Date().toISOString(),
                  description: 'Account creation in progress after approval'
                }] : [])
              ]
            }
          : app
      );
      
      localStorage.setItem('submittedApplications', JSON.stringify(updatedApplications));
      window.dispatchEvent(new Event('storage'));

      // Update local state - remove the task from open tasks since it's now processed
      setOpenTasks(prev => prev.filter(task => task.id !== selectedTask.id));
      
      addAlert(
        `Task ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 
        'success'
      );

      // Clear selection since the task is no longer in the list
      setSelectedTask(null);

    } catch (error) {
      console.error('Error processing task action:', error);
      addAlert(`Failed to ${action} task`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAssignment = async (action) => {
    if (!selectedTask) {
      addAlert('No task selected', 'error');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const currentUser = 'Admin User'; // In a real app, this would come from auth context
      const newAssignedTo = action === 'assign' ? currentUser : null;

      // Update application assignment in localStorage
      const savedApplications = JSON.parse(localStorage.getItem('submittedApplications') || '[]');
      const updatedApplications = savedApplications.map(app => 
        app.id === selectedTask.id 
          ? { 
              ...app, 
              assignedTo: newAssignedTo,
              assignmentDate: action === 'assign' ? new Date().toISOString() : null,
              workflowHistory: [
                ...(app.workflowHistory || []),
                {
                  step: 'Task Assignment',
                  status: 'completed',
                  timestamp: new Date().toISOString(),
                  description: action === 'assign' 
                    ? `Task assigned to ${currentUser}` 
                    : `Task unassigned from ${app.assignedTo || 'user'}`
                }
              ]
            }
          : app
      );
      
      localStorage.setItem('submittedApplications', JSON.stringify(updatedApplications));
      window.dispatchEvent(new Event('storage'));

      // Update local state
      setOpenTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { 
              ...task, 
              assignedTo: newAssignedTo,
              isAssigned: !!newAssignedTo,
              taskStatus: newAssignedTo ? 'assigned' : 'unassigned'
            }
          : task
      ));

      // Update selected task
      setSelectedTask(prev => ({
        ...prev,
        assignedTo: newAssignedTo,
        isAssigned: !!newAssignedTo,
        taskStatus: newAssignedTo ? 'assigned' : 'unassigned'
      }));
      
      addAlert(
        `Task ${action === 'assign' ? 'assigned' : 'unassigned'} successfully`, 
        'success'
      );

    } catch (error) {
      console.error('Error processing task assignment:', error);
      addAlert(`Failed to ${action} task`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    // Using CSS variables for consistent theming
    const root = document.documentElement;
    const getVar = (varName) => getComputedStyle(root).getPropertyValue(varName).trim();
    
    switch (status) {
      case 'submitted': return getVar('--color-info');
      case 'in_progress': return getVar('--color-warning');
      case 'pending_review': return getVar('--color-warning-alt');
      case 'manual_review': return getVar('--color-danger');
      default: return getVar('--color-secondary');
    }
  };

  return (
    <div className="open-task-container">
      <h1 className="page-title">All open tasks</h1>

      {alerts.map(alert => (
        <div key={alert.id} className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      ))}

      <div className="task-layout">
        {/* Tasks List */}
        <div className="tasks-panel panel">
          <div className="tasks-header flex-header">
            <h2>All open tasks</h2>
            <div className="sort-icon">⇅</div>
          </div>
          
          <div className="tasks-list">
            {loading ? (
              <div className="loading-tasks empty-state">
                <div className="loading-spinner">⏳</div>
                <h3>Loading tasks...</h3>
                <p>Please wait while we fetch your open tasks.</p>
              </div>
            ) : openTasks.length === 0 ? (
              <div className="no-tasks empty-state">
                <div className="no-tasks-icon">🔍</div>
                <h3>No tasks found</h3>
                <p>There are no tasks matching your filter criteria.</p>
              </div>
            ) : (
              openTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-card ${selectedTask?.id === task.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="task-header">
                    <h3>{task.taskName}</h3>
                  </div>
                  <div className="task-details">
                    <div className="task-detail-row">
                      <span className="detail-label">Creation Date:</span>
                      <span className="detail-value">{task.creationDate}</span>
                    </div>
                    <div className="task-detail-row">
                      <span className="detail-label">Task Status:</span>
                      <span className="detail-value">{task.taskStatus}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Details Panel */}
        <div className="task-details-panel panel">
          {selectedTask ? (
            <>
              <div className="task-details-header flex-header">
                <h2>Task Details: {selectedTask.customerName}</h2>
                <div className="task-assignment-controls">
                  {selectedTask.isAssigned ? (
                    <>
                      <span className="assigned-to">Assigned to: {selectedTask.assignedTo}</span>
                      <button 
                        className="btn btn-secondary unassign-btn btn-base"
                        onClick={() => handleTaskAssignment('unassign')}
                        disabled={loading}
                      >
                        {loading ? 'Unassigning...' : 'Unassign'}
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-primary assign-btn btn-base"
                      onClick={() => handleTaskAssignment('assign')}
                      disabled={loading}
                    >
                      {loading ? 'Assigning...' : 'Assign to Me'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="details-sections">
                {/* Customer Information */}
                <div className="details-section">
                  <h3>Customer Information</h3>
                  <div className="info-grid">
                    {selectedTask.customerData.fullName && (
                      <div><strong>Full Name:</strong> {selectedTask.customerData.fullName}</div>
                    )}
                    {selectedTask.customerData.dob && (
                      <div><strong>Date of Birth:</strong> {selectedTask.customerData.dob}</div>
                    )}
                    {selectedTask.customerData.email && (
                      <div><strong>Email:</strong> {selectedTask.customerData.email}</div>
                    )}
                    {selectedTask.customerData.mobile && (
                      <div><strong>Mobile:</strong> {selectedTask.customerData.mobile}</div>
                    )}
                    {selectedTask.customerData.occupation && (
                      <div><strong>Occupation:</strong> {selectedTask.customerData.occupation}</div>
                    )}
                    {selectedTask.customerData.income_band && (
                      <div><strong>Income Band:</strong> {selectedTask.customerData.income_band}</div>
                    )}
                    <div><strong>PEP Status:</strong> {selectedTask.customerData.pep ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Address Information */}
                {(selectedTask.customerData.address.line1 || 
                  selectedTask.customerData.address.city || 
                  selectedTask.customerData.address.state) && (
                  <div className="details-section">
                    <h3>Address</h3>
                    <div className="address-info">
                      {selectedTask.customerData.address.line1 && (
                        <p>{selectedTask.customerData.address.line1}</p>
                      )}
                      {selectedTask.customerData.address.line2 && (
                        <p>{selectedTask.customerData.address.line2}</p>
                      )}
                      {(selectedTask.customerData.address.city || selectedTask.customerData.address.state) && (
                        <p>
                          {selectedTask.customerData.address.city}
                          {selectedTask.customerData.address.city && selectedTask.customerData.address.state && ', '}
                          {selectedTask.customerData.address.state}
                        </p>
                      )}
                      {(selectedTask.customerData.address.pin || selectedTask.customerData.address.country) && (
                        <p>
                          {selectedTask.customerData.address.pin}
                          {selectedTask.customerData.address.pin && selectedTask.customerData.address.country && ', '}
                          {selectedTask.customerData.address.country}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Product Information */}
                {(selectedTask.customerData.product.desired_account || 
                  selectedTask.customerData.product.expected_mab_range) && (
                  <div className="details-section">
                    <h3>Product Details</h3>
                    <div className="info-grid">
                      {selectedTask.customerData.product.desired_account && (
                        <div><strong>Account Type:</strong> {selectedTask.customerData.product.desired_account}</div>
                      )}
                      {selectedTask.customerData.product.expected_mab_range && (
                        <div><strong>Expected MAB:</strong> {selectedTask.customerData.product.expected_mab_range}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ID Information */}
                {(selectedTask.customerData.ids.idType || selectedTask.customerData.ids.idNumber) && (
                  <div className="details-section">
                    <h3>Identity Details</h3>
                    <div className="info-grid">
                      {selectedTask.customerData.ids.idType && (
                        <div><strong>ID Type:</strong> {selectedTask.customerData.ids.idType.toUpperCase()}</div>
                      )}
                      {selectedTask.customerData.ids.idNumber && (
                        <div><strong>ID Number:</strong> {selectedTask.customerData.ids.idNumber}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedTask.documents && selectedTask.documents.length > 0 && (
                  <div className="details-section">
                    <h3>Documents ({selectedTask.documents.length})</h3>
                    <div className="documents-list">
                      {selectedTask.documents.map((doc, index) => (
                        <div key={index} className="document-item">
                          <div className="doc-info">
                            <div className="doc-name">{doc.name}</div>
                            <div className="doc-type">{doc.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Status */}
                <div className="details-section">
                  <h3>Task Status</h3>
                  <div className="status-info">
                    <div className="status-item">
                      <strong>Current Status:</strong>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(selectedTask.status || selectedTask.workflowStatus) }}
                      >
                        {(selectedTask.status || selectedTask.workflowStatus || 'Unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="status-item">
                      <strong>Submission Date:</strong> {selectedTask.submissionDate}
                    </div>
                    <div className="status-item">
                      <strong>Process ID:</strong> {selectedTask.id}
                    </div>
                    <div className="status-item">
                      <strong>Completed Steps:</strong> {selectedTask.completedSteps}
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="task-actions">
                  <div className="action-buttons">
                    <button 
                      className="btn btn-approve"
                      onClick={() => handleTaskAction('approve')}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button 
                      className="btn btn-reject"
                      onClick={() => handleTaskAction('reject')}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection empty-state">
              <h2>Select a Task</h2>
              <p>Choose a task from the list to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenTask;